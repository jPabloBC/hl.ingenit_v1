import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Colores INGENIT
        blue1: "#001a33",
        blue2: "#001e40",
        blue3: "#00264d",
        blue4: "#003c80",
        blue5: "#003366",
        blue6: "#005abf",
        blue7: "#335c85",
        blue8: "#0078ff",
        blue9: "#6685a3",
        blue10: "#3393ff",
        blue11: "#99adc2",
        blue12: "#66aeff",
        blue13: "#ccd6e0",
        blue14: "#99c9ff",
        blue15: "#cce4ff",
        black: "#000000",
        gray1: "#1a1a1a",
        gray2: "#333333",
        gray3: "#4d4d4d",
        gray4: "#666666",
        gray5: "#808080",
        gray6: "#999999",
        gray7: "#b3b3b3",
        gray8: "#cccccc",
        gray9: "#e6e6e6",
        gray10: "#f2f2f2",
        white: "#ffffff",
        gold: "#372908",
        gold1: "#6d5310",
        gold2: "#a37c18",
        gold3: "#daa520",
        gold4: "#e1b74d",
        gold5: "#e9c979",
        gold6: "#f0dba6",
        gold7: "#f8edd2",
        
        // Variables CSS para componentes UI
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        title: ["var(--font-archivo)"],
        body: ["var(--font-sansation)"],
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
