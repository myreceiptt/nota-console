/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        kali: "url('./assets/prof-nota-v.1.20.jpg')",
      },
      colors: {
        "kali-text-muted": "#7a7a7a",
        "nota-text-muted": "#747474",
        
        "kali-black": "#1F2229",
        "nota-black": "#111111",

        "kali-gray": "#E6E6E6",
        "nota-gray": "#a7a7a7",

        "kali-gray-dark": "#13141a",
        "nota-gray-dark": "#13141a",

        "kali-border": "#272a34",
        "nota-border": "#272a34",
        
        "kali-white": "#FFFFFF",
        "nota-white": "#FFFFFF",
        
        "kali-red": "#EC0101",
        "nota-red": "#EC0101",

        "kali-red-dark": "#D41919",
        "nota-red-dark": "#770101",
        
        "kali-pink": "#D71655",
        "nota-pink": "#FF1E8E",

        "kali-pink-dark": "#BF2E5D",
        "nota-pink-dark": "#a70053",

        "kali-yellow": "#FF8A18",
        "nota-yellow": "#FDED02",

        "kali-yellow-dark": "#FEA44C",
        "nota-yellow-dark": "#fd7002",
        
        "kali-green": "#47D4B9",
        "nota-green": "#7fff00",

        "kali-green-dark": "#5EBDAB",
        "nota-green-dark": "#448900",

        "kali-cyan": "#05A1F7",
        "nota-cyan": "#05def7",

        "kali-cyan-dark": "#49AEE6",
        "nota-cyan-dark": "#49AEE6",

        "kali-blue": "#277FFF",
        "nota-blue": "#277FFF",

        "kali-blue-dark": "#367BF0",
        "nota-blue-dark": "#115fe2",
        
        "kali-blue-bg": "#2471f3",
        "nota-dark-bg": "#000000",
        
        "kali-purple": "#8C42AB",
        "nota-purple": "#bb00bb",
      },
      fontFamily: {
        "fira-code": ["Fira Code", "monospace"],
        segoe: "Segoe UI",
      },
      keyframes: {
        blink: {
          "0%": { opacity: 1 },
          "48%": { opacity: 1 },
          "50%": { opacity: 0 },
          "99%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      animation: {
        blink: "blink 1.5s linear infinite",
      },
      boxShadow: {
        "5xl": "0 10px 30px 0 rgba(0, 0, 0, 0.75)",
        terminal: "0 0 0 2px rgba(0, 0, 0, 0.16)",
      },
    },
  },
  plugins: [],
};
