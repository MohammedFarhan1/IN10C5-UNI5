import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#101828",
          sand: "#F6F1E8",
          gold: "#D4A446",
          pine: "#1F5C4A",
          mist: "#E7EEF5",
          coral: "#E76F51"
        }
      },
      boxShadow: {
        soft: "0 20px 50px rgba(16, 24, 40, 0.12)"
      },
      borderRadius: {
        xl2: "1.5rem"
      },
      fontFamily: {
        sans: ["Bahnschrift", "Aptos", "Segoe UI", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"]
      }
    }
  },
  plugins: []
};

export default config;

