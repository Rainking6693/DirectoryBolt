/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map "secondary" to a custom dark gray palette
        secondary: {
          50:  "#f7f8fa",
          100: "#eef1f5",
          200: "#d9dee7",
          300: "#b9c0cf",
          400: "#8e99b1",
          500: "#6b7b97",
          600: "#4f5f7b",
          700: "#3a4861",
          800: "#27324a",   // <– this makes bg-secondary-800 work
          900: "#1a2236",
        },
        // Map "volt" to a bright neon yellow-green palette
        volt: {
          50:  "#fdffe6",
          100: "#f7ffb3",
          200: "#eeff66",
          300: "#e0ff33",
          400: "#ccff0a",
          500: "#b3ff00",   // <– this makes ring-volt-500 work
          600: "#89cc00",
          700: "#669900",
          800: "#4d7300",
          900: "#334d00",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
}
