import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2BBFB3",
          dark:    "#1a9990",
          light:   "#e6f9f8",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body:    ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
        md: "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)",
        lg: "0 4px 8px 3px rgba(60,64,67,0.15), 0 1px 3px rgba(60,64,67,0.3)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
