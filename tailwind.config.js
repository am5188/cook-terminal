/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cookie: {
          50: "#fff8ed",
          100: "#ffefd4",
          200: "#ffdba8",
          300: "#ffc071",
          400: "#ff9c38",
          500: "#ff7f11",
          600: "#f06306",
          700: "#c74a07",
          800: "#9e3a0e",
          900: "#7f320f",
        },
        ink: {
          900: "#0b0d10",
          800: "#111418",
          700: "#171b21",
          600: "#1f242c",
          500: "#2b323d",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
