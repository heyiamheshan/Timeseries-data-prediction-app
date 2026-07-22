/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body   : ["Inter", "sans-serif"],
        mono   : ["JetBrains Mono", "monospace"],
      },
      colors: {
        midnight: "#0A0F1E",
        surface : {
          DEFAULT: "#111827",
          2      : "#1a2235",
          border : "#1F2937",
        },
      },
      fontWeight: {
        500: "500",
        600: "600",
        700: "700",
      },
      borderRadius: {
        "2xl": "16px",
        "xl" : "12px",
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
}
