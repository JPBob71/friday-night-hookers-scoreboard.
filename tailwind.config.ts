import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: "#0f5f46",
        night: "#101820",
        scoreRed: "#c81e32",
        scoreBlack: "#111111",
        lane: "#f6d28b",
      },
    },
  },
  plugins: [],
};

export default config;
