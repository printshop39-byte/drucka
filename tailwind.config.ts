import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0B5D49",
          hover: "#08483B",
          dark: "#06382F",
          cream: "#FAF6EE",
          mint: "#EEF8F3",
          gold: "#D8A33D",
          goldSoft: "#FFF1CC",
          ink: "#12211C",
          muted: "#66756E",
          border: "#DDE8E2",
        },
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "serif"],
        body: ["var(--font-dmsans)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(18,33,28,0.08)",
        premium: "0 18px 45px rgba(6,56,47,0.12)",
        glow: "0 0 0 4px rgba(216,163,61,0.18)",
      },
      borderRadius: {
        premium: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
