/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FBF9F6",
        surface: "#FBF9F6",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F5F3F0",
        "surface-container": "#EFEEEB",
        "surface-container-high": "#EAE8E5",
        "surface-container-highest": "#E4E2DF",
        "surface-variant": "#E4E2DF",
        "surface-dim": "#DBDAD7",
        "surface-tint": "#79545B",

        primary: "#55343B",
        "primary-container": "#6F4B52",
        "on-primary": "#FFFFFF",
        "on-primary-container": "#EDBEC6",
        "primary-fixed": "#FFD9DF",
        "primary-fixed-dim": "#EABAC2",

        secondary: "#5F5F4E",
        "secondary-container": "#E5E4CE",
        "on-secondary": "#FFFFFF",
        "on-secondary-container": "#656554",
        "secondary-fixed": "#E5E4CE",
        "secondary-fixed-dim": "#C9C8B2",

        tertiary: "#5A3239",
        "tertiary-container": "#74494F",
        "on-tertiary": "#FFFFFF",
        "on-tertiary-container": "#F4BBC3",

        "on-surface": "#1B1C1A",
        "on-surface-variant": "#504446",
        "on-background": "#1B1C1A",

        outline: "#827475",
        "outline-variant": "#D3C2C4",

        "inverse-surface": "#30312F",
        "inverse-on-surface": "#F2F0ED",
        "inverse-primary": "#EABAC2",

        error: "#BA1A1A",
        "error-container": "#FFDAD6",
        "on-error": "#FFFFFF",
        "on-error-container": "#93000A",

        "rank-up": "#547C65",
        "rank-down": "#8B5D5D",
        "new-entry": "#8B6C3F",

        // ink / shorts darks
        ink: "#14110F",
        "ink-soft": "#1B1C1A",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["Newsreader_500Medium"],
        "headline-italic": ["Newsreader_500Medium_Italic"],
        display: ["Newsreader_600SemiBold"],
        "display-italic": ["Newsreader_600SemiBold_Italic"],
        serif: ["CormorantGaramond_500Medium"],
        "serif-italic": ["CormorantGaramond_500Medium_Italic"],
        body: ["Inter_400Regular"],
        "body-medium": ["Inter_500Medium"],
        label: ["Inter_500Medium"],
        "label-semibold": ["Inter_600SemiBold"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.02em",
        tight: "-0.01em",
        wider: "0.04em",
        widest: "0.12em",
        ultrawide: "0.18em",
      },
    },
  },
  plugins: [],
};
