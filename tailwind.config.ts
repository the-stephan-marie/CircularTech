import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        secondary: "#0858c8",
        "on-surface-variant": "#3e4a3e",
        primary: "#006b2d",
        "primary-container": "#0c873c",
        "primary-fixed": "#8ef9a0",
        "on-primary-fixed": "#002109",
        "surface-bright": "#f8f9fa",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "surface-container-low": "#f3f4f5",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#191c1d",
        outline: "#6e7a6d",
        "outline-variant": "#becabb",
        background: "#f8f9fa",
        surface: "#f8f9fa",
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
      },
      boxShadow: {
        ambient: "0px 8px 24px rgba(25, 28, 29, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
