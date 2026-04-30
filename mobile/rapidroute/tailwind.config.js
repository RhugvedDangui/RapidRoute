/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Pure Monochrome Palette
        'pure-black': '#000000',
        'pure-white': '#ffffff',
        'bg-primary': '#000000',
        'bg-secondary': '#09090b',
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1aa',
        'border': '#27272a',
        'border-light': '#3f3f46',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
}
