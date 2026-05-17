import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        safety: {
          navy: "#102136",
          red: "#c9282d",
          green: "#0f766e",
          gold: "#f0b429"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
