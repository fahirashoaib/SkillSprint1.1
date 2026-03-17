from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
import PyPDF2
import docx
import io
import json
import time
import logging
from typing import Optional
import re
import groq

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Configure Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = None

if GROQ_API_KEY:
    try:
        groq_client = groq.Groq(api_key=GROQ_API_KEY)
        logger.info("Groq configured")
        groq_client.models.list()
        logger.info("Groq connection successful")
    except Exception as e:
        logger.error(f"Error initializing Groq: {e}")
        groq_client = None
else:
    logger.warning("No Groq API key found")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5000", 
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file_bytes):
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise

def extract_text_from_docx(file_bytes):
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        raise

def clean_json_response(text: str) -> str:
    """Clean JSON from markdown code blocks and fix common issues"""
    # Remove markdown code blocks
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    
    text = text.strip()
    
    # Look for the LAST complete JSON array or object
    # The AI sometimes includes the example first, then the actual response
    
    # For arrays - find the LAST complete array
    if '[' in text and ']' in text:
        # Find all potential arrays
        arrays = []
        start_positions = [i for i, char in enumerate(text) if char == '[']
        
        for start in start_positions:
            bracket_count = 0
            for i in range(start, len(text)):
                if text[i] == '[':
                    bracket_count += 1
                elif text[i] == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        # Found a complete array
                        arrays.append(text[start:i+1])
                        break
        
        # Return the LAST array (most likely the actual response)
        if arrays:
            return arrays[-1]
    
    # For objects - find the LAST complete object
    if '{' in text and '}' in text:
        objects = []
        start_positions = [i for i, char in enumerate(text) if char == '{']
        
        for start in start_positions:
            brace_count = 0
            for i in range(start, len(text)):
                if text[i] == '{':
                    brace_count += 1
                elif text[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        objects.append(text[start:i+1])
                        break
        
        # Return the LAST object
        if objects:
            return objects[-1]
    
    return text

def call_groq(prompt, response_format="text"):
    try:
        model = "llama-3.3-70b-versatile"
        
        if response_format == "json":
            system_content = """You are a JSON generator. You MUST respond with ONLY valid JSON.
            - Use double quotes for all strings
            - No comments or explanations
            - No markdown formatting
            - No text before or after the JSON
            - Return a SINGLE JSON array or object, never multiple concatenated objects"""
        else:
            system_content = "You are a helpful AI that generates educational content. Write clear, well-formatted text."
        
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": prompt}
        ]
        
        completion = groq_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.1,
            max_tokens=8000,
            top_p=0.9,
            stream=False
        )
        
        return completion.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise e

def safe_json_loads(raw: str):
    """
    Best-effort JSON parsing with a single Groq repair attempt.
    Returns parsed JSON on success, raises on failure.
    """
    cleaned = clean_json_response(raw)
    try:
        return json.loads(cleaned)
    except Exception:
        # Try to extract the last complete object/array via bracket matching
        try:
            # Arrays
            if '[' in cleaned and ']' in cleaned:
                arrays = []
                start_positions = [i for i, ch in enumerate(cleaned) if ch == '[']
                for start in start_positions:
                    depth = 0
                    for i in range(start, len(cleaned)):
                        if cleaned[i] == '[':
                            depth += 1
                        elif cleaned[i] == ']':
                            depth -= 1
                            if depth == 0:
                                arrays.append(cleaned[start:i+1])
                                break
                if arrays:
                    return json.loads(arrays[-1])
            # Objects
            if '{' in cleaned and '}' in cleaned:
                objects = []
                start_positions = [i for i, ch in enumerate(cleaned) if ch == '{']
                for start in start_positions:
                    depth = 0
                    for i in range(start, len(cleaned)):
                        if cleaned[i] == '{':
                            depth += 1
                        elif cleaned[i] == '}':
                            depth -= 1
                            if depth == 0:
                                objects.append(cleaned[start:i+1])
                                break
                if objects:
                    return json.loads(objects[-1])
        except Exception:
            pass

        # One repair attempt via Groq
        repair_prompt = f"""You previously returned INVALID JSON.

Fix it and return ONLY valid JSON (no markdown, no explanation).

INVALID JSON:
{cleaned}
"""
        repaired = call_groq(repair_prompt, "json")
        repaired_cleaned = clean_json_response(repaired)
        return json.loads(repaired_cleaned)

def normalize_unit_title(title: str) -> str:
    if not title:
        return title
    t = str(title).strip()
    # Strip "Unit 1:" / "Unit 1 -" prefixes
    t = re.sub(r'^\s*unit\s*\d+\s*[:\-]\s*', '', t, flags=re.IGNORECASE).strip()
    return t or str(title).strip()

def looks_like_headings(items) -> bool:
    """
    Heuristic: detect when 'learning objectives' are actually topic headings,
    e.g., short title-cased phrases like 'Trees' or 'Binary Search Trees'.
    """
    if not isinstance(items, list) or not items:
        return True

    heading_like = 0
    for it in items:
        s = str(it or '').strip()
        if not s:
            continue
        # Too short and no verb/punctuation
        word_count = len(re.findall(r'\b\w+\b', s))
        has_verbish = bool(re.search(r'^(define|describe|explain|compare|analyze|implement|apply|identify|traverse|evaluate|design|solve|use|construct)\b', s, re.IGNORECASE))
        if (word_count <= 4 and not has_verbish) or re.match(r'^[A-Z0-9][A-Za-z0-9\s:.-]{0,30}$', s):
            heading_like += 1

    # If most items look like headings, treat as bad output
    return heading_like >= max(2, int(0.6 * len(items)))

def ensure_complete_concept_checks(unit_data: dict) -> dict:
    """
    Ensure concept-check screens contain complete question objects:
    - question (string)
    - options (4 strings) for mcq
    - correctAnswer (string, must be one of options for mcq)
    - explanation (string)
    - xp (int)
    """
    if not isinstance(unit_data, dict):
        return {"title": "Unit", "screens": []}

    screens = unit_data.get("screens", [])
    if not isinstance(screens, list):
        unit_data["screens"] = []
        return unit_data

    repaired_screens = []
    for s_idx, screen in enumerate(screens):
        if not isinstance(screen, dict):
            continue

        s_type = str(screen.get("type", "content") or "content").strip()
        if s_type != "concept-check":
            repaired_screens.append(screen)
            continue

        questions = screen.get("questions", [])
        if not isinstance(questions, list):
            questions = []

        fixed_questions = []
        for q_idx, q in enumerate(questions):
            if not isinstance(q, dict):
                q = {}
            q_type = str(q.get("type", "mcq") or "mcq").strip()
            question_text = str(q.get("question") or "").strip()

            # Provide a minimal placeholder rather than an empty question
            if not question_text:
                question_text = f"Quick check: choose the correct answer (Q{q_idx + 1})."

            xp_val = q.get("xp", 5)
            try:
                xp_val = int(xp_val)
            except Exception:
                xp_val = 5
            if xp_val < 0:
                xp_val = 0

            explanation = str(q.get("explanation") or "").strip()
            if not explanation:
                explanation = "Review the previous screen and choose the option that best matches the concept."

            fixed = {
                "type": q_type,
                "question": question_text,
                "explanation": explanation,
                "xp": xp_val
            }

            if q_type == "mcq":
                options = q.get("options", [])
                if not isinstance(options, list):
                    options = []
                options = [str(o).strip() for o in options if str(o).strip()]
                # Ensure exactly 4 options
                while len(options) < 4:
                    options.append(f"Option {chr(65 + len(options))}")
                if len(options) > 4:
                    options = options[:4]

                correct = str(q.get("correctAnswer") or "").strip()
                if correct not in options:
                    # Try to map numeric index answers (e.g., 0/1/2/3 or A/B/C/D)
                    if correct.isdigit():
                        idx = int(correct)
                        if 0 <= idx < len(options):
                            correct = options[idx]
                    elif correct.upper() in ["A", "B", "C", "D"]:
                        idx = ord(correct.upper()) - ord("A")
                        if 0 <= idx < len(options):
                            correct = options[idx]
                    else:
                        correct = options[1]  # default to B

                fixed.update({
                    "options": options,
                    "correctAnswer": correct
                })
            else:
                # Non-mcq: keep whatever correctAnswer exists, but ensure it's present
                fixed["correctAnswer"] = q.get("correctAnswer", "")

            fixed_questions.append(fixed)

        # If model produced no questions at all, add one placeholder mcq
        if not fixed_questions:
            fixed_questions = [{
                "type": "mcq",
                "question": "Quick check: which option best matches the concept?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "Option B",
                "explanation": "Option B matches the definition from the content screen.",
                "xp": 5
            }]

        screen["type"] = "concept-check"
        screen["questions"] = fixed_questions
        repaired_screens.append(screen)

    unit_data["screens"] = repaired_screens
    return unit_data

def validate_unit_content(unit_data: dict) -> list:
    """Return a list of human-readable issues (empty list means ok)."""
    issues = []
    if not isinstance(unit_data, dict):
        return ["unit_data is not an object"]
    screens = unit_data.get("screens")
    if not isinstance(screens, list) or not screens:
        return ["no screens generated"]

    if len(screens) < 8:
        issues.append(f"too few screens ({len(screens)})")

    concept_checks = [s for s in screens if isinstance(s, dict) and str(s.get("type")).strip() == "concept-check"]
    if len(concept_checks) < 2:
        issues.append(f"too few concept-check screens ({len(concept_checks)})")

    has_takeaways = any(
        isinstance(s, dict) and isinstance(s.get("title"), str) and "takeaway" in s["title"].lower()
        for s in screens
    )
    if not has_takeaways:
        issues.append("missing Key Takeaways screen")

    # Detect generic placeholder MCQs
    placeholder_mcq = 0
    total_mcq = 0
    for s in concept_checks:
        qs = s.get("questions", [])
        if not isinstance(qs, list):
            continue
        for q in qs:
            if not isinstance(q, dict):
                continue
            if str(q.get("type", "mcq")) != "mcq":
                continue
            total_mcq += 1
            opts = q.get("options", [])
            if isinstance(opts, list) and set(opts) >= {"Option A", "Option B", "Option C", "Option D"}:
                placeholder_mcq += 1
    if total_mcq > 0 and placeholder_mcq / total_mcq >= 0.5:
        issues.append("MCQ options look like placeholders (Option A/B/C/D)")

    return issues

def build_richer_mock_unit_content(unitTitle: str, unitDescription: str = ""):
    title = normalize_unit_title(unitTitle)
    desc_hint = (unitDescription or "").strip()
    if desc_hint:
        desc_hint = desc_hint.replace('\n', ' ').strip()
        if len(desc_hint) > 140:
            desc_hint = desc_hint[:137] + "..."

    return {
        "title": title,
        "screens": [
            {
                "title": "What you will learn",
                "description": f"In this unit, you will:\n- Explain the main idea\n- Work through an example\n- Test yourself with quick checks\n{('- ' + desc_hint) if desc_hint else ''}".strip(),
                "type": "content"
            },
            {
                "title": "Key terms",
                "description": "Key terms to recognize:\n- Definition\n- Properties\n- Common mistakes\n- Real-world meaning",
                "type": "content"
            },
            {
                "title": "Core concept",
                "description": "Definition:\nExplain the concept in simple terms.\nWhy it matters:\nConnect it to a real situation.\nCommon mistake:\nWhat learners often confuse.",
                "type": "content"
            },
            {
                "title": "Worked example",
                "description": "Example:\nWalk through a small example step-by-step.\nKey observation:\nHighlight what to notice.\nResult:\nSummarize the outcome.",
                "type": "content"
            },
            {
                "title": "Quick Check 1",
                "type": "concept-check",
                "questions": [
                    {
                        "type": "mcq",
                        "question": "Which statement best matches the definition from the previous screen?",
                        "options": ["A definition", "A property", "An example", "A misconception"],
                        "correctAnswer": "A definition",
                        "explanation": "The definition states what the concept is.",
                        "xp": 5
                    },
                    {
                        "type": "mcq",
                        "question": "What is a common mistake learners make with this concept?",
                        "options": ["Confusing terms", "Overcomplicating", "Ignoring constraints", "Skipping examples"],
                        "correctAnswer": "Confusing terms",
                        "explanation": "Many learners mix up similar terminology early on.",
                        "xp": 5
                    }
                ]
            },
            {
                "title": "How to apply it",
                "description": "Step-by-step:\n1) Identify what you’re given\n2) Apply the rule\n3) Check your result\n4) Interpret the outcome",
                "type": "content"
            },
            {
                "title": "Quick Check 2",
                "type": "concept-check",
                "questions": [
                    {
                        "type": "mcq",
                        "question": "Which step should happen first when applying the concept?",
                        "options": ["Apply the rule", "Identify what you’re given", "Interpret the outcome", "Check the result"],
                        "correctAnswer": "Identify what you’re given",
                        "explanation": "You need inputs/conditions before applying any rule.",
                        "xp": 5
                    }
                ]
            },
            {
                "title": "Key Takeaways",
                "description": "- Main idea in one line\n- One key rule/property\n- When to apply it\n- One pitfall to avoid",
                "type": "content"
            },
            {
                "title": "Final quick check",
                "type": "concept-check",
                "questions": [
                    {
                        "type": "mcq",
                        "question": "Which option best summarizes the key takeaway of this unit?",
                        "options": ["A short summary", "A random fact", "A separate topic", "A vague statement"],
                        "correctAnswer": "A short summary",
                        "explanation": "Key takeaways are concise summaries of what matters most.",
                        "xp": 5
                    }
                ]
            }
        ]
    }

def compact_document_excerpt(text: str, max_len: int = 6500) -> str:
    """Keep a head+tail excerpt to reduce prompt size while retaining coverage."""
    t = (text or "").strip()
    if len(t) <= max_len:
        return t
    head = t[: int(max_len * 0.7)]
    tail = t[-int(max_len * 0.3):]
    return head + "\n...\n" + tail

@app.post("/generate-step")
async def generate_step(
    file: UploadFile = File(...),
    step: str = Form(...),
    overview: Optional[str] = Form(None),
    unitIndex: Optional[str] = Form(None),
    unitTitle: Optional[str] = Form(None),
    unitDescription: Optional[str] = Form(None)
):
    try:
        logger.info(f"Processing step: {step}, file: {file.filename}")
        
        contents = await file.read()
        if file.filename.endswith('.pdf'):
            document_text = extract_text_from_pdf(contents)
        elif file.filename.endswith('.docx'):
            document_text = extract_text_from_docx(contents)
        else:
            document_text = contents.decode('utf-8')

        logger.info(f"Extracted {len(document_text)} characters")

        if not groq_client:
            logger.warning("No Groq client, using mock data")
            return generate_mock_response(step, overview, unitTitle, unitIndex)

        time.sleep(0.5)

        # STEP 1: Generate Learning Objectives
        if step == 'overview':
            prompt = f"""Based on the following document, generate 4-6 LEARNING OBJECTIVES as a JSON array of strings.

        DOCUMENT CONTENT:
        {document_text[:8000]}

        Return ONLY a valid JSON array of strings. Do NOT return objects with keys.

        CORRECT EXAMPLE:
        ["Define and explain the concept of a tree data structure", "Describe the properties and terminology of trees", "Explain the difference between depth and height in a tree"]

        VERY IMPORTANT:
        - Do NOT return topic headings like "Trees" or "Binary Search Trees"
        - Do NOT return course titles or codes like "CSCI 210"
        - Each item MUST be a full-sentence learning objective starting with an action verb (Define/Explain/Compare/Implement/Analyze/etc.)
        - Each objective should be 8-20 words

        INCORRECT (DO NOT DO THIS):
        [{{"objective": "Define and explain the concept of a tree data structure"}}]

        Requirements:
        - Each objective should be a plain string, not an object
        - Start with action verbs
        - Be clear and beginner-friendly
        - Base on document content only

        Return ONLY the JSON array:"""

            try:
                response = call_groq(prompt, "json")
                logger.info(f"Raw overview response: {response[:200]}")
                
                parsed = safe_json_loads(response)
                # Some models wrap results like {"overview": [...]}
                if isinstance(parsed, dict) and "overview" in parsed:
                    objectives = parsed.get("overview")
                else:
                    objectives = parsed
                if not isinstance(objectives, list):
                    objectives = [objectives]
                
                # CRITICAL FIX: Extract objective strings if they're wrapped in objects
                cleaned_objectives = []
                for obj in objectives:
                    if isinstance(obj, dict):
                        # If it's an object, try to get the first value or 'objective' key
                        if 'objective' in obj:
                            cleaned_objectives.append(str(obj['objective']).strip())
                        else:
                            # Take the first value from the object
                            for value in obj.values():
                                cleaned_objectives.append(str(value).strip())
                                break
                    else:
                        # If it's already a string, use it directly
                        cleaned_objectives.append(str(obj).strip())
                
                # Remove any empty strings
                cleaned_objectives = [o for o in cleaned_objectives if o]

                # If the model returned headings instead of objectives, do one strict retry
                if looks_like_headings(cleaned_objectives):
                    strict_prompt = f"""Convert the following TOPIC HEADINGS into 4-6 LEARNING OBJECTIVES.

Headings:
{json.dumps(cleaned_objectives, ensure_ascii=False)}

Rules:
- Return ONLY a JSON array of strings
- Each string must start with an action verb (Define/Explain/Compare/Implement/Analyze/Apply)
- Each objective must be 8-20 words and end with a period
- No headings, no course codes, no single-word items
"""
                    strict_resp = call_groq(strict_prompt, "json")
                    strict_obj = safe_json_loads(strict_resp)
                    cleaned_objectives = [str(x).strip() for x in strict_obj if str(x).strip()]
                
                if not cleaned_objectives:
                    cleaned_objectives = [
                        "Learn the core concepts",
                        "Understand key principles",
                        "Master fundamental operations",
                        "Apply knowledge to solve problems"
                    ]
                
                logger.info(f"Generated {len(cleaned_objectives)} learning objectives")
                
                # Generate a session ID
                session_id = str(int(time.time() * 1000))
                
                return {
                    "sessionId": session_id,
                    "overview": cleaned_objectives  # Now this is an array of strings
                }
                
            except Exception as e:
                logger.error(f"Overview generation error: {e}")
                # Return mock data with session ID
                return {
                    "sessionId": str(int(time.time() * 1000)),
                    "overview": [
                        "Learn the core concepts",
                        "Understand key principles",
                        "Master fundamental operations",
                        "Apply knowledge to solve problems"
                    ]
                }

        # STEP 2: Generate Units
        elif step == 'units':
            # Parse overview if it's a JSON string
            overview_text = overview
            if overview:
                try:
                    parsed = json.loads(overview)
                    if isinstance(parsed, list):
                        overview_text = '\n'.join(parsed)
                except:
                    pass
            
            prompt = f"""Based ONLY on the document content below, generate a course outline as a JSON array of units.
            
        IMPORTANT:
        - Decide the number of units based on the document length and complexity (typically 4-12).
        - Do NOT name units like "Unit 1" or "Unit 2". Use meaningful topic titles.
        - Each description must be ONE concise line (no newlines).
        - Do NOT use the example topics. Generate units based SOLELY on the document.

        Document content:
        {document_text[:8000]}

        Course Learning Objectives:
        {overview_text}

        Generate units about the actual topic in the document.

        Return ONLY a valid JSON array with this structure:
        [
            {{
                "title": "Unit Title (specific to the document topic)",
                "description": "One-line description of what this unit covers",
                "estimatedScreens": 10
            }}
        ]

        Return ONLY the JSON array:"""

            try:
                response = call_groq(prompt, "json")
                logger.info(f"Raw units response: {response[:200]}")
                
                parsed = safe_json_loads(response)
                # Some models wrap results like {"units": [...]}
                if isinstance(parsed, dict) and "units" in parsed:
                    units = parsed.get("units")
                else:
                    units = parsed
                
                if not isinstance(units, list):
                    units = [units]
                
                validated_units = []
                for i, unit in enumerate(units):
                    if isinstance(unit, dict):
                        title = normalize_unit_title(unit.get("title", f"Unit {i+1}"))
                        desc = str(unit.get("description", "Ready to learn? Start now!")).replace('\n', ' ').strip()
                        validated_units.append({
                            "title": title,
                            "description": desc,
                            "estimatedScreens": int(unit.get("estimatedScreens", 10))
                        })
                
                if len(validated_units) >= 3:
                    logger.info(f"Generated {len(validated_units)} units")
                    return {"units": validated_units}
                else:
                    return {"units": generate_mock_units()}
                    
            except Exception as e:
                logger.error(f"Units generation error: {e}")
                return {"units": generate_mock_units()}

        # STEP 3: Generate Unit Content
        elif step == 'unit-content':
            if not unitIndex or not unitTitle:
                return {"error": "Missing unit information"}
            
            # Parse overview if needed
            overview_text = overview
            if overview:
                try:
                    parsed = json.loads(overview)
                    if isinstance(parsed, list):
                        overview_text = '\n'.join(parsed)
                except:
                    pass
            
            unitTitleClean = normalize_unit_title(unitTitle)
            unitDescClean = (unitDescription or "").replace("\n", " ").strip()
            doc_excerpt = compact_document_excerpt(document_text, 6500)
            prompt = f"""Based on the document, generate detailed screens for the unit: "{unitTitleClean}" as a JSON object.

Document content:
{doc_excerpt}

Course Learning Objectives:
{overview_text}

Unit description (1 line):
{unitDescClean}

Return ONLY a valid JSON object with this structure:
{{
    "title": "{unitTitleClean}",
    "screens": [
        {{
            "title": "Screen Title",
            "description": "Clear explanation with examples",
            "type": "content"
        }},
        {{
            "title": "Quick Check",
            "type": "concept-check",
            "questions": [
                {{
                    "type": "mcq",
                    "question": "Question text",
                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                    "correctAnswer": "Option 1",
                    "explanation": "Explanation",
                    "xp": 5
                }}
            ]
        }}
    ]
}}

Requirements:
- Include 8-15 screens
- Mix content and concept-check screens (at least 2 concept-check screens)
- Include at least one screen that summarizes key takeaways (title should include 'Key Takeaways')
- Use simple, friendly language
- Include analogies and examples
- For each content screen, write 3-7 short lines in the description (use \\n between lines)
- For each concept-check screen:
  - Include 1-3 questions
  - For mcq questions: ALWAYS include exactly 4 options, and correctAnswer must match one of the options
  - ALWAYS include explanation and xp
- Do NOT use placeholder options like \"Option A\"/\"Option B\". Make options meaningful.

Return ONLY the JSON object:"""

            try:
                response = call_groq(prompt, "json")
                logger.info(f"Raw unit content response: {response[:200]}")
                parsed = safe_json_loads(response)
                # Some models wrap results like {"unit": {...}}
                if isinstance(parsed, dict) and "unit" in parsed and isinstance(parsed.get("unit"), dict):
                    unit_data = parsed.get("unit")
                else:
                    unit_data = parsed
                if not isinstance(unit_data, dict):
                    raise ValueError("unit-content response is not a JSON object")
                
                # Convert all text fields to strings
                if 'screens' in unit_data and isinstance(unit_data['screens'], list):
                    for screen in unit_data['screens']:
                        for field in ['title', 'description', 'content']:
                            if field in screen and not isinstance(screen[field], str):
                                screen[field] = str(screen[field])
                        if 'title' in screen:
                            screen['title'] = str(screen['title']).strip()
                        
                        if 'questions' in screen and isinstance(screen['questions'], list):
                            for q in screen['questions']:
                                for field in ['question', 'explanation']:
                                    if field in q and not isinstance(q[field], str):
                                        q[field] = str(q[field])
                                if 'options' in q and isinstance(q['options'], list):
                                    q['options'] = [str(opt) for opt in q['options']]
                
                if 'screens' not in unit_data:
                    unit_data['screens'] = []
                if 'title' in unit_data:
                    unit_data['title'] = normalize_unit_title(unit_data.get('title'))

                # Ensure concept checks are complete (no partial questions)
                unit_data = ensure_complete_concept_checks(unit_data)

                # Validate quality; retry once if output looks like fallback/generic
                issues = validate_unit_content(unit_data)
                if issues:
                    logger.warning(f"Unit content validation issues: {issues}. Retrying once.")
                    retry_prompt = f"""Your previous JSON was valid but NOT acceptable for our course schema.

Problems: {issues}

Regenerate the FULL unit content JSON for unit: \"{unitTitleClean}\".

Must-haves:
- 8-15 screens
- >= 2 concept-check screens
- 1 Key Takeaways screen
- For MCQ: 4 meaningful options, correctAnswer matches one option, include explanation and xp
- Content must be specific to the document (mention key terms from the document)

Document content:
{document_text[:10000]}

Course Learning Objectives:
{overview_text}

Unit description:
{unitDescClean}

Return ONLY the JSON object."""
                    retry_resp = call_groq(retry_prompt, "json")
                    retry_parsed = safe_json_loads(retry_resp)
                    if isinstance(retry_parsed, dict) and "unit" in retry_parsed and isinstance(retry_parsed.get("unit"), dict):
                        unit_data = retry_parsed.get("unit")
                    else:
                        unit_data = retry_parsed
                    if not isinstance(unit_data, dict):
                        raise ValueError("unit-content retry response is not a JSON object")
                    if 'title' in unit_data:
                        unit_data['title'] = normalize_unit_title(unit_data.get('title'))
                    unit_data = ensure_complete_concept_checks(unit_data)
                
                logger.info(f"Generated unit with {len(unit_data['screens'])} screens")
                return {"unit": unit_data, "meta": {"source": "groq"}}
                
            except Exception as e:
                logger.error(f"Unit content error: {e}", exc_info=True)
                # Fallback still returns a full multi-screen unit
                return {"unit": build_richer_mock_unit_content(unitTitleClean, unitDescClean), "meta": {"source": "fallback", "error": str(e)}}

        else:
            return {"error": "Invalid step"}

    except Exception as e:
        logger.error(f"Generation error: {str(e)}", exc_info=True)
        return {"error": str(e)}

def generate_mock_units():
    return [
        {"title": "Foundations", "description": "Build the core ideas you’ll need for the rest of the course.", "estimatedScreens": 10},
        {"title": "Key Concepts", "description": "Learn the main concepts with examples and simple explanations.", "estimatedScreens": 12},
        {"title": "Practice & Checks", "description": "Reinforce learning with quick checks and applied practice.", "estimatedScreens": 14},
        {"title": "Applications", "description": "See how the concepts are used in real scenarios.", "estimatedScreens": 12},
        {"title": "Review", "description": "Summarize key takeaways and prepare for assessment.", "estimatedScreens": 10}
    ]

def generate_mock_unit_content(unitTitle):
    return {
        "title": normalize_unit_title(unitTitle),
        "screens": [
            {
                "title": "What you will learn",
                "description": "In this unit, you will:\n- Understand the main idea\n- See a simple example\n- Practice with a quick check",
                "type": "content"
            },
            {
                "title": "Core concept",
                "description": "Definition:\nExplain the concept in simple terms.\nWhy it matters:\nConnect it to a real situation.\nCommon mistake:\nWhat learners often confuse.",
                "type": "content"
            },
            {
                "title": "Worked example",
                "description": "Example:\nWalk through a small example step-by-step.\nKey observation:\nHighlight what to notice.\nResult:\nSummarize the outcome.",
                "type": "content"
            },
            {
                "title": "Quick Check 1",
                "type": "concept-check",
                "questions": [
                    {
                        "type": "mcq",
                        "question": "Which statement best matches the core concept?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": "Option B",
                        "explanation": "Option B matches the definition and example.",
                        "xp": 5
                    }
                ]
            },
            {
                "title": "Key Takeaways",
                "description": "- Main idea in one line\n- Key rule or property\n- When to apply it\n- One common pitfall to avoid",
                "type": "content"
            },
            {
                "title": "Quick Check 2",
                "type": "concept-check",
                "questions": [
                    {
                        "type": "mcq",
                        "question": "What is the best next step in the example scenario?",
                        "options": ["A", "B", "C", "D"],
                        "correctAnswer": "C",
                        "explanation": "C follows from the worked example and the key rule.",
                        "xp": 5
                    }
                ]
            }
        ]
    }

def generate_mock_response(step, overview=None, unitTitle=None, unitIndex=None):
    if step == 'overview':
        return {
            "sessionId": str(int(time.time() * 1000)),
            "overview": [
                "Learn the core concepts",
                "Understand key principles",
                "Master fundamental operations",
                "Apply knowledge to solve problems"
            ]
        }
    elif step == 'units':
        return {"units": generate_mock_units()}
    elif step == 'unit-content':
        return {"unit": generate_mock_unit_content(unitTitle or "Sample Unit")}
    return {"error": "Invalid step"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "groq_configured": bool(groq_client)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")