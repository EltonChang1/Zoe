/**
 * The Modern Curator — design tokens.
 * Mirrors tailwind.config.js so JS/TS code (shadows, gradients, animations)
 * can reach the same colors without string duplication.
 * Source of truth: PRD/Zoe_Visual_Direction_Kit.md §13.
 */

export const colors = {
  background: "#FBF9F6",
  surface: "#FBF9F6",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F5F3F0",
  surfaceContainer: "#EFEEEB",
  surfaceContainerHigh: "#EAE8E5",
  surfaceContainerHighest: "#E4E2DF",

  primary: "#55343B",
  primaryContainer: "#6F4B52",
  onPrimary: "#FFFFFF",
  onPrimaryContainer: "#EDBEC6",

  secondary: "#5F5F4E",
  secondaryContainer: "#E5E4CE",

  tertiary: "#5A3239",

  onSurface: "#1B1C1A",
  onSurfaceVariant: "#504446",

  outline: "#827475",
  outlineVariant: "#D3C2C4",

  rankUp: "#547C65",
  rankDown: "#8B5D5D",
  newEntry: "#8B6C3F",

  ink: "#14110F",
  inkSoft: "#1B1C1A",

  // shorts / dark overlays
  overlayTop: "rgba(0,0,0,0.30)",
  overlayBottom: "rgba(0,0,0,0.80)",
} as const;

export const gradients = {
  primaryCTA: [colors.primary, colors.primaryContainer] as [string, string],
  shortsTop: ["rgba(0,0,0,0.30)", "rgba(0,0,0,0)"] as [string, string],
  shortsBottom: ["rgba(0,0,0,0)", "rgba(0,0,0,0.80)"] as [string, string],
  rankSpine: [colors.primary, colors.primaryContainer] as [string, string],
} as const;

export const radii = {
  none: 0,
  sharp: 2, // DEFAULT
  lg: 4,
  xl: 8,
  xxl: 12, // "full" in Modern Curator (max card radius)
  pill: 9999,
} as const;

export const shadows = {
  ambientCard: {
    shadowColor: "#1B1C1A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  lifted: {
    shadowColor: "#1B1C1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  tabBar: {
    shadowColor: "#1B1C1A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaDark: {
    shadowColor: "#55343B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 4,
  },
} as const;

export const spacing = {
  hairline: 1,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type ColorToken = keyof typeof colors;
