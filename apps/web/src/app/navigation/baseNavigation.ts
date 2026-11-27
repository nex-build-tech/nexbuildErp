import { NavigationTree } from "@/@types/navigation";

/**
 * Object containing the base navigation items for the application.
 * This object serves as a centralized configuration for main navigation elements.
 */
export const baseNavigationObj: Record<string, NavigationTree> = {
  superAdmin: {
    id: "superAdmin",
    type: "item",
    path: "/super-admin/tenants",
    title: "SaaS Platform",
    transKey: "nav.superAdmin.superAdmin",
    icon: "superAdmin",
  },
  dashboards: {
    id: "dashboards",
    type: "item",
    path: "/dashboards",
    title: "Dashboards",
    transKey: "nav.dashboards.dashboards",
    icon: "dashboards",
  },
  masters: {
    id: "masters",
    type: "item",
    path: "/masters/items",
    title: "Masters Data",
    transKey: "nav.masters.masters",
    icon: "masters",
  },
  procurement: {
    id: "procurement",
    type: "item",
    path: "/procurement/pos",
    title: "Procurement",
    transKey: "nav.procurement.procurement",
    icon: "procurement",
  },
  inventory: {
    id: "inventory",
    type: "item",
    path: "/inventory/stock",
    title: "Inventory & Stores",
    transKey: "nav.inventory.inventory",
    icon: "inventory",
  },
  contractors: {
    id: "contractors",
    type: "item",
    path: "/contractors/work-orders",
    title: "Contractors & Billing",
    transKey: "nav.contractors.contractors",
    icon: "contractors",
  },
  siteOperations: {
    id: "siteOperations",
    type: "item",
    path: "/site-operations/dpr",
    title: "Site Operations",
    transKey: "nav.siteOperations.siteOperations",
    icon: "siteOperations",
  },
  realtySales: {
    id: "realtySales",
    type: "item",
    path: "/realty/dashboard",
    title: "Realty Sales",
    transKey: "nav.realtySales.realtySales",
    icon: "realtySales",
  },
  realtyPostSales: {
    id: "realtyPostSales",
    type: "item",
    path: "/realty/post-sales",
    title: "Post-Sales",
    transKey: "nav.realtyPostSales.realtyPostSales",
    icon: "realtyPostSales",
  },
  realtySetup: {
    id: "realtySetup",
    type: "item",
    path: "/realty/setup/project",
    title: "Realty Setup",
    transKey: "nav.realtySetup.realtySetup",
    icon: "realtySetup",
  },
  realtyComingSoon: {
    id: "realtyComingSoon",
    type: "item",
    path: "/realty/coming-soon/customer-hub",
    title: "Coming Soon",
    transKey: "nav.realtyComingSoon.realtyComingSoon",
    icon: "realtyComingSoon",
  },
  cpPortal: {
    id: "cpPortal",
    type: "item",
    path: "/cp/dashboard",
    title: "Channel Partner Portal",
    transKey: "nav.cpPortal.cpPortal",
    icon: "realtySales",
  },
};

/**
 * Array of navigation items derived from baseNavigationObj.
 * This array format is used for rendering the navigation menu in the application.
 */
export const baseNavigation: NavigationTree[] = Array.from(
  Object.values(baseNavigationObj),
);
