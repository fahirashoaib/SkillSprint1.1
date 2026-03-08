from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
import PyPDF2
import docx
import io

load_dotenv()

app = FastAPI()

# Allow CORS for your Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],  # Your Node.js port
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file_bytes):
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

def extract_text_from_docx(file_bytes):
    doc = docx.Document(io.BytesIO(file_bytes))
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text

@app.post("/generate-course")
async def generate_course(file: UploadFile = File(...)):
    try:
        # Read uploaded file
        contents = await file.read()
        
        # Extract text based on file type
        if file.filename.endswith('.pdf'):
            text = extract_text_from_pdf(contents)
        elif file.filename.endswith('.docx'):
            text = extract_text_from_docx(contents)
        elif file.filename.endswith('.txt') or file.filename.endswith('.md'):
            text = contents.decode('utf-8')
        else:
            return {"error": "Unsupported file type"}
        
        # For now, just return the extracted text
        # We'll add LLM integration in next step
        return {
            "message": "Text extracted successfully",
            "text_length": len(text),
            "text_preview": text[:500] + "..."
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)