/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        volt: {
          50:  '#f5fff0',
          100: '#e6ffcc',
          200: '#ccff99',
          300: '#b3ff66',
          400: '#99ff33',
          500: '#80ff00',
          600: '#66cc00',
          700: '#4d9900',
          800: '#336600',
          900: '#193300',
        },
      },
    },
  },
  plugins: [],
}
