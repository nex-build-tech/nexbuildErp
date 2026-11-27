// ----------------------------------------------------------------------
// Tenant Configuration: Subdomain → Brand Identity
// Add more tenants here as they onboard.
// ----------------------------------------------------------------------

export interface TenantBrandConfig {
  slug: string;
  name: string;
  tagline: string;
  location: string;
  heroImage: string;        // URL or public path
  accentColor: string;      // Tailwind-safe hex
  accentColorDark: string;
  logoInitials: string;     // Fallback initials badge
  pattern: "grid" | "dots" | "diagonal" | "circuit" | "hexagon";
  stats: Array<{ label: string; value: string }>;
}

// Hardcoded tenant registry (extend as more tenants onboard)
export const TENANT_REGISTRY: Record<string, TenantBrandConfig> = {
  kings: {
    slug: "kings",
    name: "Kings Builders & Developers",
    tagline: "Crafting Landmark Residences Since 1998",
    location: "Pune, Maharashtra, India",
    // A royalty-themed high-rise cityscape from Unsplash (free license)
    heroImage:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80&fm=webp",
    accentColor: "#C5A04E",
    accentColorDark: "#A07A2A",
    logoInitials: "KB",
    pattern: "grid",
    stats: [
      { label: "Projects Delivered", value: "120+" },
      { label: "Happy Homeowners", value: "8,500+" },
      { label: "Years of Trust", value: "26 Yrs" },
    ],
  },

  greenvalley: {
    slug: "greenvalley",
    name: "Green Valley Realty",
    tagline: "Where Nature Meets Modern Living",
    location: "Bangalore, Karnataka, India",
    heroImage:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80&fm=webp",
    accentColor: "#2F855A",
    accentColorDark: "#1C5E3D",
    logoInitials: "GV",
    pattern: "dots",
    stats: [
      { label: "Green Certifications", value: "18" },
      { label: "Acres Developed", value: "340+" },
      { label: "Happy Families", value: "5,200+" },
    ],
  },

  skyline: {
    slug: "skyline",
    name: "Skyline Infrastructure Pvt Ltd",
    tagline: "Engineering Tomorrow's Skylines",
    location: "Mumbai, Maharashtra, India",
    heroImage:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80&fm=webp",
    accentColor: "#2B6CB0",
    accentColorDark: "#1A4F8A",
    logoInitials: "SL",
    pattern: "diagonal",
    stats: [
      { label: "High-Rises Built", value: "45+" },
      { label: "Floors Constructed", value: "1,800+" },
      { label: "City Footprint", value: "Mumbai" },
    ],
  },

  // Default fallback for unknown tenants
  default: {
    slug: "default",
    name: "NexBuild ERP Platform",
    tagline: "Enterprise Construction & Realty Management",
    location: "India",
    heroImage:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80&fm=webp",
    accentColor: "#3B82F6",
    accentColorDark: "#1D4ED8",
    logoInitials: "NB",
    pattern: "circuit",
    stats: [
      { label: "Active Tenants", value: "50+" },
      { label: "Modules", value: "12+" },
      { label: "Uptime", value: "99.9%" },
    ],
  },
};

/**
 * Detect tenant slug from the browser subdomain.
 * e.g.  kings.builderp.com  → "kings"
 *       localhost            → "kings" (dev default, change as needed)
 */
export function detectTenantSlug(): string {
  if (typeof window === "undefined") return "default";

  const hostname = window.location.hostname; // e.g. "kings.builderp.com"
  const parts = hostname.split(".");

  // localhost / IP → use dev default
  if (parts.length <= 1 || hostname === "localhost" || /^\d+\.\d+/.test(hostname)) {
    return "kings"; // ← dev default tenant
  }

  const sub = parts[0].toLowerCase();

  // Strip common www / app prefixes
  if (sub === "www" || sub === "app") return "default";

  return sub;
}

export function getTenantConfig(slug?: string): TenantBrandConfig {
  const key = (slug ?? detectTenantSlug()).toLowerCase();
  return TENANT_REGISTRY[key] ?? TENANT_REGISTRY["default"];
}
