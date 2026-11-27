import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT = "/cp";

const path = (root: string, item: string) => `${root}${item}`;

export const cpPortal: NavigationTree = {
  ...baseNavigationObj["cpPortal"],
  id: "cpPortal",
  type: "root",
  title: "Partner Portal",
  childs: [
    {
      id: "cpPortal.dashboard",
      path: path(ROOT, "/dashboard"),
      type: "item",
      title: "Command Center",
      transKey: "nav.cpPortal.dashboard",
      icon: "realtySales.dashboard",
    },
    {
      id: "cpPortal.leads",
      path: path(ROOT, "/leads"),
      type: "item",
      title: "My Protected Leads",
      transKey: "nav.cpPortal.leads",
      icon: "realtySales.leads",
    },
    {
      id: "cpPortal.inventory",
      path: path(ROOT, "/inventory"),
      type: "item",
      title: "Live Inventory",
      transKey: "nav.cpPortal.inventory",
      icon: "inventory",
    },
    {
      id: "cpPortal.brokerage",
      path: path(ROOT, "/brokerage"),
      type: "item",
      title: "Commission Ledger",
      transKey: "nav.cpPortal.brokerage",
      icon: "realtyPostSales.receipts",
    },
  ],
};
