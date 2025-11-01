import React from "react";
import Translator from "./components/Translator";
import "./index.css";

function App() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-500 text-white font-[Poppins] px-4">
      <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-3xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          🌐 Smart AI Translator
        </h1>
        <p className="text-gray-200 mb-6">
          Translate text instantly using Hugging Face Transformers (React + FastAPI)
        </p>

        <Translator />

        <footer className="mt-10 border-t border-white/20 pt-4">
          <p className="text-sm opacity-80">
            Developed by <span className="font-semibold">Hilal Janas</span> 💻
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
