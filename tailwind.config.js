/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",           // Busca en la raíz (App.tsx, index.tsx, etc.)
    "./components/**/*.{js,ts,jsx,tsx}", // Busca en la carpeta components
    "./services/**/*.{js,ts,jsx,tsx}",   // Busca en services por si acaso
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        padel: {
          blue: '#3b82f6',
          yellow: '#facc15',
        }
      }
    },
  },
  plugins: [],
}
