import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        // Escala de marca de Fast Dolphin — 600 es el rojo de marca exacto
        // (#E71925). El resto de la escala se deriva de ahí para que
        // hover/focus/fondos claros sigan viéndose coherentes.
        dolphin: {
          50: "#fef2f2",
          100: "#fde3e3",
          200: "#fbc9ca",
          300: "#f7a3a5",
          400: "#f07073",
          500: "#e83f43",
          600: "#E71925",
          700: "#c4121d",
          800: "#9e131c",
          900: "#83151c",
          950: "#47070b",
        },
        ink: "#24313B",
        canvas: "#F6F7F9",
      },
      borderRadius: {
        xl: "10px",
        "2xl": "14px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(36, 49, 59, 0.04), 0 1px 6px -1px rgba(36, 49, 59, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
