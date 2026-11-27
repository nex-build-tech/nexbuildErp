/**
 * Dynamic Multi-Tenant Theme Palette Engine for BuildERP
 * Generates Tailwind v4 compatible 50-950 color steps and injects into CSS root variables
 */

export interface ThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "royal-gold",
    name: "Royal Gold (Kings Default)",
    primaryColor: "#c5a04e",
    description: "Signature luxury real estate & EPC branding",
  },
  {
    id: "corporate-blue",
    name: "Corporate Sapphire",
    primaryColor: "#2563eb",
    description: "Trusted infrastructure & commercial developer tone",
  },
  {
    id: "emerald-infra",
    name: "Emerald Eco-Build",
    primaryColor: "#059669",
    description: "Sustainable green building & environmental projects",
  },
  {
    id: "amber-ochre",
    name: "Amber Terracotta",
    primaryColor: "#d97706",
    description: "Warm brick, earthwork & construction equipment vibe",
  },
  {
    id: "crimson-ruby",
    name: "Crimson Industrial",
    primaryColor: "#e11d48",
    description: "High-visibility modern industrial & steel EPC",
  },
  {
    id: "violet-steel",
    name: "Imperial Violet",
    primaryColor: "#7c3aed",
    description: "High-tech smart township & luxury architecture",
  },
  {
    id: "slate-dark",
    name: "Graphite Steel",
    primaryColor: "#334155",
    description: "Minimalist executive architectural palette",
  },
];

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const intVal = parseInt(clean, 16) || 0;
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
}

// Helper to mix color with white (tint) or black (shade)
function mixRgb(
  base: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  weight: number
): string {
  const r = Math.round(base.r + (target.r - base.r) * weight);
  const g = Math.round(base.g + (target.g - base.g) * weight);
  const b = Math.round(base.b + (target.b - base.b) * weight);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generates 11 full steps (50..950) from any primary brand hex
 */
export function generateShades(hex: string): Record<number, string> {
  const base = hexToRgb(hex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    50: mixRgb(base, white, 0.94),
    100: mixRgb(base, white, 0.86),
    200: mixRgb(base, white, 0.72),
    300: mixRgb(base, white, 0.54),
    400: mixRgb(base, white, 0.30),
    500: mixRgb(base, white, 0.12),
    600: `rgb(${base.r}, ${base.g}, ${base.b})`, // Main brand color
    700: mixRgb(base, black, 0.15),
    800: mixRgb(base, black, 0.32),
    900: mixRgb(base, black, 0.52),
    950: mixRgb(base, black, 0.72),
  };
}

/**
 * Injects dynamic theme CSS variables directly into document root
 */
export function applyThemePalette(primaryColor: string) {
  if (typeof document === "undefined") return;

  const hex = primaryColor && primaryColor.startsWith("#") ? primaryColor : "#c5a04e";
  const shades = generateShades(hex);
  const root = document.documentElement;

  // Set standard Tailwind v4 primary scale
  root.style.setProperty("--color-primary-50", shades[50]);
  root.style.setProperty("--color-primary-100", shades[100]);
  root.style.setProperty("--color-primary-200", shades[200]);
  root.style.setProperty("--color-primary-300", shades[300]);
  root.style.setProperty("--color-primary-400", shades[400]);
  root.style.setProperty("--color-primary-500", shades[500]);
  root.style.setProperty("--color-primary-600", shades[600]);
  root.style.setProperty("--color-primary-700", shades[700]);
  root.style.setProperty("--color-primary-800", shades[800]);
  root.style.setProperty("--color-primary-900", shades[900]);
  root.style.setProperty("--color-primary-950", shades[950]);

  // Set Tailux polymorphic button variables
  root.style.setProperty("--this", shades[600]);
  root.style.setProperty("--this-darker", shades[700]);
  root.style.setProperty("--this-light", shades[500]);
  root.style.setProperty("--this-lighter", shades[400]);

  // Save for immediate reload before API response
  try {
    localStorage.setItem("builderp_tenant_palette", hex);
  } catch {
    // ignore
  }
}

/**
 * Initializes theme on initial bundle load
 */
export function initializeSavedPalette() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem("builderp_tenant_palette");
  if (saved) {
    applyThemePalette(saved);
  }
}
