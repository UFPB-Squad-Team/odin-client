import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shell/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/core/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ["calc(0.75rem * var(--odin-font-scale))", { lineHeight: "calc(1rem * var(--odin-font-scale))" }],
        sm: ["calc(0.875rem * var(--odin-font-scale))", { lineHeight: "calc(1.25rem * var(--odin-font-scale))" }],
        base: ["calc(1rem * var(--odin-font-scale))", { lineHeight: "calc(1.5rem * var(--odin-font-scale))" }],
        lg: ["calc(1.125rem * var(--odin-font-scale))", { lineHeight: "calc(1.75rem * var(--odin-font-scale))" }],
        xl: ["calc(1.25rem * var(--odin-font-scale))", { lineHeight: "calc(1.75rem * var(--odin-font-scale))" }],
        "2xl": ["calc(1.5rem * var(--odin-font-scale))", { lineHeight: "calc(2rem * var(--odin-font-scale))" }],
        "3xl": ["calc(1.875rem * var(--odin-font-scale))", { lineHeight: "calc(2.25rem * var(--odin-font-scale))" }],
        "4xl": ["calc(2.25rem * var(--odin-font-scale))", { lineHeight: "calc(2.5rem * var(--odin-font-scale))" }],
        "5xl": ["calc(3rem * var(--odin-font-scale))", { lineHeight: "1" }],
        "6xl": ["calc(3.75rem * var(--odin-font-scale))", { lineHeight: "1" }],
        "7xl": ["calc(4.5rem * var(--odin-font-scale))", { lineHeight: "1" }],
        "8xl": ["calc(6rem * var(--odin-font-scale))", { lineHeight: "1" }],
        "9xl": ["calc(8rem * var(--odin-font-scale))", { lineHeight: "1" }],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
