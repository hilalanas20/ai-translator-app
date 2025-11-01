# 🌐 AI Translator Web Application  

A full-stack AI-powered translation web app built using **React.js** (frontend) and **FastAPI** (backend).  
It performs accurate multilingual text and document translation using **Hugging Face Transformers (MarianMT)** models, with features like **file upload**, **language detection**, **text-to-speech**, and a **modern animated interface**.

---

## 🖼️ Project Preview  

![AI Translator Screenshot](https://github.com/hilalanas20/ai-translator-app/blob/e748bba003b3481857e0618ee1678bc8f606f1fa/ai%20translator.jpg)

*(Preview of the AI Translator Web App — built using React + FastAPI)*

---

## 🚀 Features  

✅ Real-time translation between **English**, **Urdu**, **Arabic**, and **French**  
✅ Automatic source language detection  
✅ File upload support for `.txt`, `.pdf`, `.docx`  
✅ Text cleaning and preprocessing  
✅ Text-to-Speech output  
✅ Copy and download options for translated text  
✅ Responsive, animated UI built with **Tailwind CSS** and **Framer Motion**  
✅ Model caching for fast, efficient performance  

---

## ⚙️ Tech Stack  

**Frontend:** React.js, Tailwind CSS, Framer Motion, Axios  
**Backend:** FastAPI, Python, Uvicorn  
**AI Models:** Hugging Face MarianMT Models  
**Utilities:** Torch, LangDetect, pdfminer.six, python-docx  

---

## 🧩 Setup Instructions  

### 🔹 Backend Setup  

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
