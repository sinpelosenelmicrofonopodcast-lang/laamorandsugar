import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./actions/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        lg: "2rem",
        xl: "2.5rem"
      },
      screens: {
        "2xl": "1320px"
      }
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        bakery: {
          blush: "#f8d9dd",
          rose: "#d86d92",
          gold: "#c59b45",
          cream: "#fffaf6",
          champagne: "#f6eee5",
          espresso: "#5f4a41"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        serif: ["var(--font-display)", ...defaultTheme.fontFamily.serif],
        sans: ["var(--font-body)", ...defaultTheme.fontFamily.sans]
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(255, 247, 238, 0.94) 0%, rgba(255, 247, 238, 0.58) 35%, rgba(255,255,255,0) 72%)",
        "gold-ribbon":
          "linear-gradient(115deg, rgba(197,155,69,0.08) 0%, rgba(255,255,255,0.45) 40%, rgba(197,155,69,0.16) 100%)"
      },
      boxShadow: {
        glow: "0 20px 70px rgba(216, 109, 146, 0.18)",
        card: "0 20px 45px rgba(102, 72, 76, 0.08)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 7s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
