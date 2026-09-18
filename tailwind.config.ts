import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dolphin: {
          50: "#eef9ff",
          100: "#d9f1ff",
          200: "#b8e6ff",
          300: "#86d6ff",
          400: "#4dbeff",
          500: "#249fff",
          600: "#0f80f0",
          700: "#0c66c4",
          800: "#11549e",
          900: "#14497d",
          950: "#0f2d4d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
