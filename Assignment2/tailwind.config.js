export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          dark: "#1a1a1a", // Dark background color
          lightdark: "#2a2a2a", // Dark background color
          red: "#b71c1c", // Deep red for accents
          gold: "#ffcc00", // Gold for highlights
          gray: "#D3D3D3", // Subtle gray for text or borders
        },
      },
    },
  },
  plugins: [],
}