import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        syncvas: {
          bg: "#080d14",
          panel: "rgba(8, 13, 20, 0.76)",
          accent: "#00e5ff",
          purple: "#7c3aed",
          noteYellow: "#f7df69",
          notePink: "#f5b6d7",
          noteGreen: "#b8e986",
          noteBlue: "#86c5ff",
          notePurple: "#ce9cff",
        },
      },
      boxShadow: {
        glow: "0 0 30px rgba(0, 229, 255, 0.15)",
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        caveat: ["Caveat", "cursive"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
