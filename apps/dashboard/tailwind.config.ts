import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        police: {
          navy: "#102136",
          red: "#c9282d",
          gold: "#f0b429"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
