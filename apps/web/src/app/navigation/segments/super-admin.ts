import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

export const superAdmin: NavigationTree = {
  ...baseNavigationObj["superAdmin"],
  type: "root",
  childs: [
    {
      id: "superAdmin.tenants",
      path: "/super-admin/tenants",
      type: "item",
      title: "Tenants & Palettes",
      transKey: "nav.superAdmin.tenants",
      icon: "superAdmin.tenants",
    },
    {
      id: "superAdmin.reports",
      path: "/dashboards/reports",
      type: "item",
      title: "Platform Analytics",
      transKey: "nav.superAdmin.reports",
      icon: "superAdmin.reports",
    },
    {
      id: "superAdmin.security",
      path: "/settings/security",
      type: "item",
      title: "Global Security & 2FA",
      transKey: "nav.superAdmin.security",
      icon: "superAdmin.security",
    },
  ],
};
