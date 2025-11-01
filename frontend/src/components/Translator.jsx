// src/components/Translator.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Copy,
  Volume2,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  Languages,
  X,
  ChevronDown,
} from "lucide-react";

const Translator = () => {
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState("ur");
  const [translated, setTranslated] = useState("");
  const [sourceLang, setSourceLang] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [voices, setVoices] = useState([]);

  const languages = [
    { code: "ur", name: "Urdu", flag: "Pakistan" },
    { code: "ar", name: "Arabic", flag: "Saudi Arabia" },
    { code: "fr", name: "French", flag: "France" },
    { code: "en", name: "English", flag: "United States" },
  ];

  /* ---------- Speech Voices ---------- */
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  /* ---------- Drag & Drop ---------- */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  /* ---------- File Upload ---------- */
  const handleFile = async (f) => {
    const valid = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!valid.includes(f.type)) {
      setError("Only .txt, .pdf, .docx allowed.");
      return;
    }
    setFile(f);
    setUploading(true);
    setError("");
    setSuccess("");
    const fd = new FormData();
    fd.append("file", f);
    try {
      const { data } = await axios.post("http://127.0.0.1:8000/upload", fd);
      setText(data.cleaned_text ?? "");
      setSuccess("File cleaned!");
    } catch (err) {
      setError(err.response?.data?.detail ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ---------- Translate ---------- */
  const handleTranslate = async () => {
    if (!text.trim()) return setError("Enter text or upload a file.");
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await axios.post("http://127.0.0.1:8000/translate", {
        text: text.trim(),
        target_lang: targetLang,
      });
      if (data.translated_text) {
        setTranslated(data.translated_text);
        setSourceLang((data.source_lang ?? "AUTO").toUpperCase());
        setSuccess("Translated!");
      } else setError(data.error ?? "Translation failed");
    } catch {
      setError("Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- TTS ---------- */
  const speak = (msg) => {
    if (!msg) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(msg);
    const voice = voices.find(
      (v) =>
        v.lang.startsWith(targetLang) ||
        (targetLang === "ur" && /urdu/i.test(v.name)) ||
        (targetLang === "ar" && /arabic/i.test(v.name))
    ) ?? voices.find((v) => v.lang.startsWith("en"));
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }
    utter.rate = 0.9;
    synth.speak(utter);
  };

  /* ---------- Copy / Download ---------- */
  const copy = () => {
    navigator.clipboard.writeText(translated);
    setSuccess("Copied!");
    setTimeout(() => setSuccess(""), 2000);
  };
  const download = () => {
    const blob = new Blob([translated], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translation_${targetLang}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
              <Languages className="w-10 h-10 text-yellow-400" />
              AI Translator Pro
            </h1>
            <p className="text-blue-200">Upload • Clean • Translate</p>
          </div>

          {/* ---------- FILE UPLOAD ---------- */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 mb-6 transition-all ${
              dragActive ? "border-yellow-400 bg-yellow-400/10" : "border-white/30"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <FileText className="w-6 h-6" />
                <span className="font-medium truncate max-w-xs">{file.name}</span>
                <button
                  onClick={() => {
                    setFile(null);
                    setText("");
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-3 text-blue-300" />
                <p className="text-white mb-2">Drop file or click</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-semibold"
                >
                  Choose File
                </button>
                <p className="text-xs text-blue-300 mt-2">.txt • .pdf • .docx</p>
              </>
            )}
            {uploading && (
              <div className="mt-3 flex justify-center items-center gap-2 text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            )}
          </div>

          {/* ---------- TEXTAREA ---------- */}
          <textarea
            className="w-full h-40 p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none transition-all"
            placeholder="Enter text or upload a file..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* ---------- LANG SELECT + BUTTON ---------- */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1 relative">
              <label className="text-sm text-blue-200 block mb-1">Target Language</label>

              {/* Custom styled select */}
              <div className="relative">
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full h-12 pl-4 pr-10 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer"
                  style={{ backgroundImage: "none" }}
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleTranslate}
                disabled={loading || !text.trim()}
                className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  loading || !text.trim()
                    ? "bg-gray-600 cursor-not-allowed opacity-70"
                    : "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="w-5 h-5" />
                    Translate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ---------- ALERTS ---------- */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-300"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-300"
              >
                <CheckCircle className="w-5 h-5" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- RESULT ---------- */}
          {translated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 p-6 bg-white/10 rounded-xl border border-white/20"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-white">Translation</h3>
                {sourceLang && (
                  <span className="text-sm text-blue-300">
                    Detected: <b>{sourceLang}</b>
                  </span>
                )}
              </div>
              <p className="text-lg text-white mb-4 leading-relaxed break-words">{translated}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={copy}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2 transition-all"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  onClick={() => speak(translated)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg flex items-center gap-2 transition-all"
                >
                  <Volume2 className="w-4 h-4" /> Speak
                </button>
                <button
                  onClick={download}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Translator;