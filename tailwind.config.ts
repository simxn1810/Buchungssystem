import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        verein: {
          blau: "#00417A",
          gelb: "#FBFF00",
        },
      },
    },
  },
  plugins: [],
};

export default config;
