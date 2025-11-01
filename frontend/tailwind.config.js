/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // ✅ This ensures Tailwind reads all JSX files including components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
