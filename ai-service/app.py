import groq
import google.generativeai as genai

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

providers = []

if GROQ_API_KEY:
    try:
        client = groq.Client(api_key=GROQ_API_KEY)
        providers.append({"name": "groq", "client": client, "model": "llama-3.1-8b-instant", "available": True, "cooldown_until": 0})
        logger.info("Groq configured")
    except Exception as e:
        logger.error(f"Groq init failed: {e}")

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        providers.append({"name": "gemini", "client": genai, "model": "gemini-2.5-flash", "available": True, "cooldown_until": 0})
        logger.info("Gemini configured")
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")

logger.info(f"Total providers: {len(providers)}")
provider_usage = {p["name"]: 0 for p in providers}
current_provider_index = 0


def get_next_available_provider():
    global current_provider_index
    if not providers:
        raise Exception("No AI providers available")
    now = time.time()
    for p in providers:
        if not p["available"] and now >= p.get("cooldown_until", 0):
            p["available"] = True
            logger.info(f"{p['name']} cooldown expired, marking available")
    available = [p for p in providers if p["available"]]
    if not available:
        soonest = min(providers, key=lambda p: p.get("cooldown_until", 0))
        wait = max(0, soonest["cooldown_until"] - now)
        logger.warning(f"All providers cooling. Waiting {wait:.1f}s for {soonest['name']}")
        time.sleep(wait + 0.5)
        soonest["available"] = True
        available = [soonest]
    provider = available[current_provider_index % len(available)]
    current_provider_index += 1
    return provider


def call_provider(provider, prompt, response_format):
    name = provider["name"]
    client = provider["client"]
    model = provider["model"]
    if response_format == "json":
        system_content = (
            "You are a JSON-only generator. "
            "Respond with ONLY valid JSON. No markdown, no backticks, no explanation. "
            "Start with { or [ and end with } or ]."
        )
    else:
        system_content = "You are a helpful AI that generates concise educational content."
    if name == "groq":
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system_content}, {"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=4000,
        )
        return completion.choices[0].message.content
    elif name == "gemini":
        model_name = model.replace("models/", "")
        model_instance = client.GenerativeModel(model_name)
        response = model_instance.generate_content(f"{system_content}\n\nUser: {prompt}")
        return response.text
    raise Exception(f"Unknown provider: {name}")


def call_ai_with_fallback(prompt: str, response_format: str = "text") -> str:
    if not providers:
        raise HTTPException(status_code=503, detail="No AI providers configured")
    if len(prompt) > 2800:
        prompt = prompt[:2800]
    errors = []
    for attempt in range(len(providers) * 3):
        try:
            provider = get_next_available_provider()
            logger.info(f"Attempt {attempt + 1}: trying {provider['name']}...")
            result = call_provider(provider, prompt, response_format)
            provider_usage[provider["name"]] = provider_usage.get(provider["name"], 0) + 1
            logger.info(f"SUCCESS with {provider['name']}")
            return result
        except Exception as e:
            error_msg = str(e)
            logger.warning(f"{provider['name']} failed: {error_msg[:120]}")
            is_rate = any(k in error_msg.lower() for k in [
                "rate_limit", "rate limit", "quota", "429", "413",
                "limit", "exceeded", "resource_exhausted", "too many"
            ])
            if is_rate:
                cooldown = 30 + (attempt * 15)
                provider["available"] = False
                provider["cooldown_until"] = time.time() + cooldown
                logger.warning(f"{provider['name']} rate-limited, cooling {cooldown}s")
            else:
                time.sleep(2)
            errors.append(f"{provider['name']}: {error_msg[:60]}")
    raise HTTPException(status_code=500, detail=f"All AI providers failed: {'; '.join(errors)}")


def call_ai(prompt, response_format="text"):
    return call_ai_with_fallback(prompt, response_format)


def extract_text_from_pdf(file_bytes):
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages[:8]:
            text += page.extract_text() or ""
        return re.sub(r'\s+', ' ', text)[:4000]
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise


def extract_text_from_docx(file_bytes):
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join(p.text for p in doc.paragraphs[:40])
        return re.sub(r'\s+', ' ', text)[:4000]
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        raise


def clean_json_response(text: str) -> str:
    if not text:
        return ""
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
    text = text.strip()
    
    # 🔥 NEW: Handle case where response is just multiple objects
    if '{' in text and '}' in text:
        # Count if it's multiple objects
        if text.count('{') > 1 and not text.startswith('['):
            # It's multiple objects - keep as is, safe_json_loads will wrap
            pass
        else:
            start, end = text.find('{'), text.rfind('}')
            if end > start:
                text = text[start:end + 1]
    elif '[' in text and ']' in text:
        start, end = text.find('['), text.rfind(']')
        if end > start:
            text = text[start:end + 1]
    return text


def safe_json_loads(raw: str):
    """More robust JSON parser that handles incomplete/malformed JSON"""
    import re  # Import at the top of function to ensure it's always available
    
    if not raw:
        raise ValueError("Empty response")
    
    cleaned = clean_json_response(raw)
    
    # Try 1: Direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    
    # Try 2: Fix trailing commas and add missing brackets
    try:
        # Remove trailing commas before } or ]
        fixed = re.sub(r',\s*([}\]])', r'\1', cleaned)
        # Add missing closing brackets if needed
        open_braces = fixed.count('{')
        close_braces = fixed.count('}')
        open_brackets = fixed.count('[')
        close_brackets = fixed.count(']')
        
        if open_braces > close_braces:
            fixed += '}' * (open_braces - close_braces)
        if open_brackets > close_brackets:
            fixed += ']' * (open_brackets - close_brackets)
        
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass
    
    # Try 3: Extract only complete objects using regex
    try:
        # Match complete objects { ... } (handles nested)
        obj_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        objects = re.findall(obj_pattern, cleaned)
        if objects:
            parsed_objects = []
            for obj_str in objects:
                try:
                    parsed_objects.append(json.loads(obj_str))
                except:
                    pass
            if parsed_objects:
                if len(parsed_objects) > 1:
                    return parsed_objects
                return parsed_objects[0]
    except:
        pass
    
    # Try 4: Use ast.literal_eval as fallback (for Python dicts)
    try:
        import ast
        return ast.literal_eval(cleaned)
    except:
        pass
    
    raise ValueError(f"Could not parse JSON. Snippet: {cleaned[:300]}")

def normalize_unit_title(title: str) -> str:
    if not title:
        return title
    t = re.sub(r'^\s*unit\s*\d+\s*[:\-]\s*', '', str(title).strip(), flags=re.IGNORECASE).strip()
    return t or str(title).strip()


def compact_excerpt(text: str, max_len: int = 1400) -> str:
    t = (text or "").strip()
    if len(t) <= max_len:
        return t
    return t[:int(max_len * 0.65)] + "\n...\n" + t[-int(max_len * 0.35):]


def ensure_concept_checks(unit_data: dict) -> dict:
    screens = unit_data.get("screens", [])
    if not isinstance(screens, list):
        unit_data["screens"] = []
        return unit_data
    repaired = []
    for screen in screens:
        if not isinstance(screen, dict):
            continue
        if str(screen.get("type", "content")).strip() != "concept-check":
            repaired.append(screen)
            continue
        qs = screen.get("questions", [])
        if not isinstance(qs, list):
            qs = []
        fixed_qs = []
        for qi, q in enumerate(qs):
            if not isinstance(q, dict):
                q = {}
            f = {
                "type": str(q.get("type", "mcq")).strip() or "mcq",
                "question": str(q.get("question") or f"Question {qi+1}").strip(),
                "explanation": str(q.get("explanation") or "Review the content.").strip(),
                "xp": int(q.get("xp", 5)) if str(q.get("xp", "5")).lstrip('-').isdigit() else 5,
            }
            opts = [str(o).strip() for o in (q.get("options") or []) if str(o).strip()]
            while len(opts) < 4:
                opts.append(f"Option {chr(65+len(opts))}")
            f["options"] = opts[:4]
            f["correctAnswer"] = str(q.get("correctAnswer", opts[0])).strip()
            fixed_qs.append(f)
        if not fixed_qs:
            fixed_qs = [{"type":"mcq","question":"Which best describes the key concept?",
                         "options":["Option A","Option B","Option C","Option D"],
                         "correctAnswer":"Option A","explanation":"Review the content.","xp":5}]
        screen["type"] = "concept-check"
        screen["questions"] = fixed_qs
        repaired.append(screen)
    unit_data["screens"] = repaired
    return unit_data


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:5000","http://localhost:5173",
                   "http://127.0.0.1:3000","http://127.0.0.1:5000","http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.post("/generate-step")
async def generate_step(
    file: UploadFile = File(...),
    step: str = Form(...),
    sessionId: Optional[str] = Form(None),
    overview: Optional[str] = Form(None),
    unitIndex: Optional[str] = Form(None),
    unitTitle: Optional[str] = Form(None),
    unitDescription: Optional[str] = Form(None),
    feedbackInstructions: Optional[str] = Form(None),
):
    try:
        logger.info(f"Step={step} file={file.filename}")
        contents = await file.read()
        if file.filename.lower().endswith('.pdf'):
            doc_text = extract_text_from_pdf(contents)
        elif file.filename.lower().endswith('.docx'):
            doc_text = extract_text_from_docx(contents)
        else:
            doc_text = contents.decode('utf-8', errors='ignore')[:4000]

        if not doc_text:
            raise HTTPException(status_code=400, detail="Could not extract text from document")
        if not providers:
            raise HTTPException(status_code=503, detail="No AI providers configured")

        time.sleep(0.3)
        extra = f"\nAdmin instructions: {feedbackInstructions}" if feedbackInstructions else ""

        # ── Overview ──────────────────────────────────────────────────────────
        if step == 'overview':
            prompt = (
                f"Document:\n{compact_excerpt(doc_text, 1300)}{extra}\n\n"
                "List 4-6 learning objectives as a JSON array of strings.\n"
                "Each starts with an action verb. Max 12 words each.\n"
                'Return ONLY: ["Objective 1", "Objective 2", ...]'
            )
            response = call_ai(prompt, "json")
            parsed = safe_json_loads(response)
            if isinstance(parsed, dict):
                objectives = parsed.get("overview") or parsed.get("objectives") or list(parsed.values())[0]
            else:
                objectives = parsed
            if not isinstance(objectives, list):
                objectives = [objectives]
            cleaned = [str(next(iter(o.values())) if isinstance(o, dict) else o).strip() for o in objectives if o]
            cleaned = [c for c in cleaned if c]
            if not cleaned:
                cleaned = ["Understand core concepts", "Apply key principles", "Analyse examples", "Evaluate outcomes"]
            return {"sessionId": sessionId or str(int(time.time()*1000)), "overview": cleaned}

        # ── Units ─────────────────────────────────────────────────────────────
        elif step == 'units':
            prompt = (
                f"Document:\n{compact_excerpt(doc_text, 1100)}{extra}\n\n"
                "Create a course outline as a JSON array of 4-6 units.\n"
                'Each: {"title":"short title","description":"one sentence","estimatedScreens":6}\n'
                "Return ONLY the JSON array."
            )
            response = call_ai(prompt, "json")
            parsed = safe_json_loads(response)
            if isinstance(parsed, dict):
                units = parsed.get("units") or [parsed]
            else:
                units = parsed if isinstance(parsed, list) else [parsed]
            validated = []
            for i, u in enumerate(units):
                if isinstance(u, dict):
                    validated.append({
                        "title": normalize_unit_title(u.get("title", f"Unit {i+1}")),
                        "description": str(u.get("description","")).replace('\n',' ').strip() or "Ready to learn?",
                        "estimatedScreens": int(u.get("estimatedScreens", 6)),
                    })
            if len(validated) < 3:
                validated = [
                    {"title":"Foundations","description":"Core concepts","estimatedScreens":6},
                    {"title":"Key Ideas","description":"Main principles","estimatedScreens":6},
                    {"title":"Applications","description":"Practical use","estimatedScreens":6},
                    {"title":"Review","description":"Consolidate learning","estimatedScreens":5},
                ]
            return {"sessionId": sessionId, "units": validated}

        # ── Unit content ──────────────────────────────────────────────────────
        elif step == 'unit-content':
            if not unitTitle:
                return {"error": "Missing unitTitle"}
            title_clean = normalize_unit_title(unitTitle)
            snippet = compact_excerpt(doc_text, 900)

            prompt = f"""Generate Duolingo-style micro-learning JSON. Return ONLY valid JSON.

Unit: "{title_clean}"
Context: {snippet}{extra}

Rules:
- 5-7 screens total
- content screens: title max 6 words, description max 35 words + 1 example
- concept-check screens: 1-2 MCQs, 4 short options, mark correct answer
- LAST screen title contains "Takeaway", description = 3 bullets separated by \\n
- Flash-card style, no long paragraphs

Exact JSON shape to return:
{{"title":"{title_clean}","screens":[
  {{"type":"content","title":"Title Here","description":"Short text. Example: ..."}},
  {{"type":"concept-check","title":"Quick Check","questions":[{{"type":"mcq","question":"Question?","options":["A","B","C","D"],"correctAnswer":"A","explanation":"Why A is correct","xp":5}}]}},
  {{"type":"content","title":"Key Takeaway","description":"• Point 1\\n• Point 2\\n• Point 3"}}
]}}"""

            response = call_ai(prompt, "json")
            logger.info(f"unit-content raw ({len(response)} chars): {response[:150]}")

            try:
                parsed = json.loads(clean_json_response(response))
            except Exception:
                parsed = safe_json_loads(response)

            if isinstance(parsed, list):
                unit_data = (parsed[0] if parsed and isinstance(parsed[0], dict) else {})
            elif isinstance(parsed, dict):
                unit_data = parsed.get("unit") if isinstance(parsed.get("unit"), dict) else parsed
            else:
                unit_data = {}

            if not isinstance(unit_data, dict):
                unit_data = {}
            unit_data.setdefault("title", title_clean)
            unit_data.setdefault("screens", [])

            # Coerce all string fields
            for screen in unit_data.get("screens", []):
                if not isinstance(screen, dict):
                    continue
                for f in ['title','description','content']:
                    if f in screen and not isinstance(screen[f], str):
                        screen[f] = str(screen[f])
                if 'title' in screen:
                    screen['title'] = screen['title'].strip()
                for q in screen.get("questions",[]):
                    if isinstance(q, dict):
                        for f in ['question','explanation']:
                            if f in q and not isinstance(q[f], str):
                                q[f] = str(q[f])
                        if 'options' in q:
                            q['options'] = [str(o) for o in q['options']]

            unit_data['title'] = normalize_unit_title(unit_data.get('title', title_clean))
            unit_data = ensure_concept_checks(unit_data)

            # Fallback minimal screens
            if len(unit_data.get("screens",[])) < 3:
                unit_data["screens"] = [
                    {"type":"content","title":"Introduction","description":f"Welcome to {title_clean}. Let's get started."},
                    {"type":"concept-check","title":"Quick Check","questions":[{
                        "type":"mcq","question":f"What is the focus of {title_clean}?",
                        "options":["Core concepts","History","Advanced math","None of the above"],
                        "correctAnswer":"Core concepts","explanation":"This unit covers core concepts.","xp":5
                    }]},
                    {"type":"content","title":"Key Takeaway","description":f"• You learned {title_clean}\n• Apply in practice\n• Review if unsure"},
                ]

            logger.info(f"'{title_clean}' -> {len(unit_data['screens'])} screens")
            return {"sessionId": sessionId, "unit": unit_data, "meta": {"source": "ai"}}

        else:
            return {"error": "Invalid step"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/apply-feedback")
async def apply_feedback(request: Request):
    try:
        data = await request.json()
        feedback = data.get('feedback','').strip()
        screen_content = data.get('screen_content', {})
        if not providers:
            raise HTTPException(status_code=503, detail="No AI providers configured")
        if not feedback:
            raise HTTPException(status_code=400, detail="Feedback required")

        prompt = (
            f"Modify this course screen JSON based on the feedback.\n"
            f"Keep the same JSON structure. Return ONLY valid JSON.\n\n"
            f"Screen:\n{json.dumps(screen_content)[:1100]}\n\n"
            f"Feedback: {feedback[:400]}\n\nModified JSON:"
        )
        response = call_ai(prompt, "json")
        parsed = safe_json_loads(response)
        return {"modified_screen": parsed, "message": "Feedback applied"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"apply-feedback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/modify-generation")
async def modify_generation(request: Request):
    """Live feedback during active generation: add_unit | add_screen | modify_unit | remove_unit"""
    try:
        data = await request.json()
        action = data.get("action","")
        payload = data.get("payload", {})
        if not providers:
            raise HTTPException(status_code=503, detail="No AI providers configured")

        if action == "add_unit":
            instructions = payload.get("instructions","")
            doc_context = payload.get("docContext","")[:500]
            prompt = (
                f"Generate ONE new course unit as JSON.\n"
                f"Context: {doc_context}\nInstructions: {instructions}\n\n"
                'Return ONLY: {"title":"unit title","description":"one sentence","estimatedScreens":6}'
            )
            response = call_ai(prompt, "json")
            parsed = safe_json_loads(response)
            if isinstance(parsed, list):
                parsed = parsed[0]
            return {"unit": {
                "title": normalize_unit_title(parsed.get("title","New Unit")),
                "description": str(parsed.get("description","")).strip() or "New unit",
                "estimatedScreens": int(parsed.get("estimatedScreens", 6)),
            }}

        elif action == "add_screen":
            unit_title = payload.get("unitTitle","")
            screen_type = payload.get("screenType","content")
            instructions = payload.get("instructions","")
            position = payload.get("position", "after")
            reference_screen_index = payload.get("referenceScreenIndex", 0)
            doc_context = payload.get("docContext","")[:500]
            
            position_text = f" This screen should be placed {position} screen #{reference_screen_index + 1}."
            
            if screen_type == "concept-check":
                prompt = (
                    f"Generate ONE concept-check screen for unit '{unit_title}'.\n"
                    f"Context: {doc_context}\nInstructions: {instructions}{position_text}\n\n"
                    'Return: {"type":"concept-check","title":"Quick Check","questions":[{"type":"mcq","question":"...","options":["A","B","C","D"],"correctAnswer":"A","explanation":"...","xp":5}]}'
                )
            else:
                prompt = (
                    f"Generate ONE content screen for unit '{unit_title}'.\n"
                    f"Context: {doc_context}\nInstructions: {instructions}{position_text}\n\n"
                    'Return: {"type":"content","title":"Short Title","description":"Max 35 words. Example: ..."}'
                )
            response = call_ai(prompt, "json")
            parsed = safe_json_loads(response)
            if isinstance(parsed, list):
                parsed = parsed[0]
            if parsed.get("type") == "concept-check":
                parsed = ensure_concept_checks({"screens":[parsed]})["screens"][0]
            return {"screen": parsed}

        elif action == "modify_screen":
            unit_title = payload.get("unitTitle", "")
            screen_index = payload.get("screenIndex", 0)
            instructions = payload.get("instructions", "")
            current_screen = payload.get("currentScreen", {})
            
            prompt = (
                f"Modify this course screen based on the feedback.\n"
                f"Unit: {unit_title}\n"
                f"Keep the same JSON structure. Return ONLY valid JSON.\n\n"
                f"Current Screen:\n{json.dumps(current_screen)[:1500]}\n\n"
                f"Feedback/Instructions: {instructions}\n\n"
                f"Modified JSON (only change what's requested, preserve everything else):"
            )
            response = call_ai(prompt, "json")
            parsed = safe_json_loads(response)
            logger.info(f"Modified screen at index {screen_index}")
            return {"screen": parsed}

        
        elif action in ("remove_unit","reorder_units","modify_unit"):
            return {"message": f"Action '{action}' acknowledged"}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"modify-generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reset-providers")
async def reset_providers_ep():
    for p in providers:
        p["available"] = True
        p["cooldown_until"] = 0
    return {"status": "ok", "providers": len(providers)}

@app.post("/generate-prompt")
async def generate_prompt(request: Request):
    """Generic endpoint for AI prompt generation"""
    try:
        data = await request.json()
        prompt = data.get("prompt", "")
        response_format = data.get("response_format", "json")
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt required")
        
        response = call_ai(prompt, response_format)
        
        return {"response": response}
    except Exception as e:
        logger.error(f"Generate prompt error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    now = time.time()
    return {"status": "healthy", "providers": [{
        "name": p["name"],
        "available": p["available"],
        "cooling_down": not p["available"] and now < p.get("cooldown_until",0),
        "cooldown_remaining": max(0, round(p.get("cooldown_until",0) - now)),
    } for p in providers]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")