import type { Config } from "tailwindcss";

// Design tokens carried over from the ledger-style dashboard mockup.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        paper: "var(--paper)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        gold: "var(--gold)",
        rust: "var(--rust)",
        sage: "var(--sage)",
        slate: "var(--slate)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
