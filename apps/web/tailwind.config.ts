import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:        "var(--color-ink)",
        charcoal:   "var(--color-charcoal)",
        stone:      "var(--color-stone)",
        gold:       "var(--color-gold)",
        "gold-light": "var(--color-gold-light)",
        cream:      "var(--color-cream)",
        mist:       "var(--color-mist)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body:    ["var(--font-body)"],
      },
      animation: {
        "fade-up": "fadeUp 500ms var(--ease-luxury) both",
        shimmer:   "shimmer 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
