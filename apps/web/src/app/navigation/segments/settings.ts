import { NavigationTree } from "@/@types/navigation";

export const settings: NavigationTree = {
  id: "settings",
  type: "item",
  path: "/settings",
  title: "Settings",
  transKey: "nav.settings.settings",
  icon: "settings",
  childs: [
    {
      id: "general",
      type: "item",
      path: "/settings/general",
      title: "General",
      transKey: "nav.settings.general",
      icon: "settings.general",
    },
    {
      id: "appearance",
      type: "item",
      path: "/settings/appearance",
      title: "Appearance",
      transKey: "nav.settings.appearance",
      icon: "settings.appearance",
    },
    {
      id: "security",
      type: "item",
      path: "/settings/security",
      title: "Security & 2FA",
      transKey: "nav.settings.security",
      icon: "settings.security",
    },
    {
      id: "tenants",
      type: "item",
      path: "/super-admin/tenants",
      title: "Tenants & Palettes",
      transKey: "nav.settings.tenants",
      icon: "settings.tenants",
    },
  ],
};
