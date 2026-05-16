import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070811",
          900: "#0b0d18",
          850: "#10131f",
          800: "#161a28",
          700: "#1f2436",
          600: "#2a3046",
          500: "#3a4159",
          400: "#5b6685",
        },
        flame: {
          50: "#fff4ed",
          100: "#ffe5d0",
          200: "#ffc89c",
          300: "#ffa45c",
          400: "#ff7a1a",
          500: "#f25b07",
          600: "#c63f03",
          700: "#9a2f06",
          800: "#7a280a",
          900: "#3c1505",
        },
        ember: "#ff7a1a",
        plasma: "#3affe9",
        violet: "#a778ff",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "Helvetica Neue", "Arial"],
        display: ["ui-sans-serif", "system-ui", "Inter"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 30px rgba(255, 122, 26, 0.35)",
        plasma: "0 0 22px rgba(58, 255, 233, 0.45)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 50% 30%, rgba(255,122,26,0.10), transparent 60%), radial-gradient(circle at 80% 80%, rgba(58,255,233,0.08), transparent 55%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
