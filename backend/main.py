# main.py
import os
import time
import re
import unicodedata
from typing import Optional

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from transformers import MarianMTModel, MarianTokenizer
from langdetect import detect, DetectorFactory

# ---------- Optional: PDF / DOCX ----------
try:
    from pdfminer.high_level import extract_text as pdf_extract_text
    PDF_AVAILABLE = True
except Exception:
    PDF_AVAILABLE = False

try:
    import docx
    DOCX_AVAILABLE = True
except Exception:
    DOCX_AVAILABLE = False

# ---------- Suppress TF warnings ----------
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# ---------- Langdetect seed ----------
DetectorFactory.seed = 0

app = FastAPI(title="AI Translator API + File Cleaner", version="3.1")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models ----------
class TranslationRequest(BaseModel):
    text: str
    target_lang: str

class CleanedResponse(BaseModel):
    cleaned_text: str
    original_size: int
    cleaned_size: int
    source_lang: Optional[str] = None

MODELS = {
    "en-fr": "Helsinki-NLP/opus-mt-en-fr",
    "fr-en": "Helsinki-NLP/opus-mt-fr-en",
    "en-ur": "Helsinki-NLP/opus-mt-en-ur",
    "ur-en": "Helsinki-NLP/opus-mt-ur-en",
    "en-ar": "Helsinki-NLP/opus-mt-en-ar",
    "ar-en": "Helsinki-NLP/opus-mt-ar-en",
}

loaded_models: dict[str, tuple[MarianTokenizer, MarianMTModel]] = {}

def get_model(src: str, tgt: str):
    key = f"{src}-{tgt}"
    if key in loaded_models:
        return loaded_models[key]
    name = MODELS.get(key)
    if not name:
        return None
    print(f"Loading model: {name}...")
    tokenizer = MarianTokenizer.from_pretrained(name)
    model = MarianMTModel.from_pretrained(name)
    loaded_models[key] = (tokenizer, model)
    print(f"Model {key} loaded.")
    return loaded_models[key]

# ---------- Text Cleaning ----------
def clean_text(raw: str) -> str:
    if not raw:
        return ""
    raw = raw.replace("\ufeff", "").replace("\u200b", "")
    raw = "".join(ch for ch in raw if unicodedata.category(ch)[0] != "C" or ch in "\n\t")
    raw = re.sub(r"\s+", " ", raw)
    raw = re.sub(r"<[^>]+>", "", raw)
    raw = unicodedata.normalize("NFKC", raw)
    return raw.strip()

# ---------- File Extraction ----------
def extract_txt(b: bytes) -> str:
    return b.decode("utf-8", errors="ignore")

def extract_pdf(b: bytes) -> str:
    if not PDF_AVAILABLE:
        raise HTTPException(status_code=500, detail="PDF support not available. Install: pip install pdfminer.six")
    from io import BytesIO
    return pdf_extract_text(BytesIO(b))

def extract_docx(b: bytes) -> str:
    if not DOCX_AVAILABLE:
        raise HTTPException(status_code=500, detail="DOCX support not available. Install: pip install python-docx")
    from io import BytesIO
    doc = docx.Document(BytesIO(b))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

# ---------- Endpoints ----------
@app.get("/")
def home():
    return {"message": "AI Translator Backend is running!"}

@app.post("/upload", response_model=CleanedResponse)
async def upload_file(file: UploadFile = File(...)):
    if file.filename is None:
        raise HTTPException(status_code=400, detail="No file uploaded")

    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".txt"):
        raw = extract_txt(content)
    elif filename.endswith(".pdf"):
        raw = extract_pdf(content)
    elif filename.endswith((".docx", ".doc")):
        raw = extract_docx(content)
    else:
        raise HTTPException(status_code=400, detail="Only .txt, .pdf, .docx allowed")

    cleaned = clean_text(raw)
    try:
        src_lang = detect(cleaned) if cleaned.strip() else None
    except:
        src_lang = None

    return CleanedResponse(
        cleaned_text=cleaned,
        original_size=len(raw),
        cleaned_size=len(cleaned),
        source_lang=src_lang,
    )

@app.post("/translate")
def translate(req: TranslationRequest):
    start = time.time()
    try:
        if not req.text.strip():
            return {"error": "Input text is empty"}

        src_lang = detect(req.text)
        print(f"Detected: {src_lang} to {req.target_lang}")

        pair = get_model(src_lang, req.target_lang)
        if not pair:
            # via English
            intermediate = req.text
            if src_lang != "en":
                p1 = get_model(src_lang, "en")
                if not p1:
                    return {"error": f"Unsupported source language: {src_lang}"}
                t1, m1 = p1
                i1 = t1(req.text, return_tensors="pt", padding=True, truncation=True, max_length=512)
                o1 = m1.generate(**i1)
                intermediate = t1.decode(o1[0], skip_special_tokens=True)

            p2 = get_model("en", req.target_lang)
            if not p2:
                return {"error": f"Unsupported target language: {req.target_lang}"}
            t2, m2 = p2
            i2 = t2(intermediate, return_tensors="pt", padding=True, truncation=True, max_length=512)
            o2 = m2.generate(**i2)
            result = t2.decode(o2[0], skip_special_tokens=True)
        else:
            tok, mod = pair
            inp = tok(req.text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            out = mod.generate(**inp)
            result = tok.decode(out[0], skip_special_tokens=True)

        print(f"Done in {time.time()-start:.2f}s")
        return {"translated_text": result, "source_lang": src_lang}

    except Exception as e:
        print("Translation error:", e)
        return {"error": "Translation failed. Try shorter text."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)