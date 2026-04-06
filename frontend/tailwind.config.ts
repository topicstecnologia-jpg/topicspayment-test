import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "rgba(16, 17, 22, 0.78)",
        stroke: "rgba(255, 255, 255, 0.1)",
        accent: "#ff6c8f",
        accentSoft: "#ffb6c7"
      },
      boxShadow: {
        panel: "0 30px 120px rgba(0, 0, 0, 0.55)",
        glow: "0 0 120px rgba(255, 108, 143, 0.18)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "serif"]
      },
      backgroundImage: {
        "hero-noise":
          "radial-gradient(circle at top left, rgba(255,108,143,0.18), transparent 25%), radial-gradient(circle at 80% 20%, rgba(120,130,255,0.08), transparent 20%), linear-gradient(135deg, rgba(6,7,10,1) 0%, rgba(12,13,17,1) 45%, rgba(4,5,8,1) 100%)"
      }
    }
  },
  plugins: []
};

export default config;
