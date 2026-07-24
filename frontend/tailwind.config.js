/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          light: "#eff6ff",
        },
        secondary: {
          DEFAULT: "#16a34a",
          light: "#f0fdf4",
        },
        danger: {
          DEFAULT: "#dc2626",
          light: "#fef2f2",
        },
        ink: {
          DEFAULT: "#0f172a",
          muted: "#64748b",
          faint: "#94a3b8",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
      },
    },
  },
  plugins: [],
}