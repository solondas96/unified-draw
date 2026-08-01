/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: "#f8f9fa",
          grid: "#e9ecef",
          gridMajor: "#dee2e6",
        },
        panel: {
          bg: "#ffffff",
          border: "#e5e7eb",
          hover: "#f3f4f6",
          active: "#e0e7ff",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          light: "#e0e7ff",
        },
      },
    },
  },
  plugins: [],
};