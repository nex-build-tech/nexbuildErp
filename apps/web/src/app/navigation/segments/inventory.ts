import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_INVENTORY = "/inventory";

const path = (root: string, item: string) => `${root}${item}`;

export const inventory: NavigationTree = {
  ...baseNavigationObj["inventory"],
  type: "root",
  childs: [
    {
      id: "inventory.stock",
      path: path(ROOT_INVENTORY, "/stock"),
      type: "item",
      title: "Stock & Valuation",
      transKey: "nav.inventory.stock",
      icon: "inventory.stock",
    },
    {
      id: "inventory.grn",
      path: path(ROOT_INVENTORY, "/grn"),
      type: "item",
      title: "Store Inward (GRN)",
      transKey: "nav.inventory.grn",
      icon: "inventory.grn",
    },
    {
      id: "inventory.issues",
      path: path(ROOT_INVENTORY, "/issues"),
      type: "item",
      title: "Site Material Issues",
      transKey: "nav.inventory.issues",
      icon: "inventory.issues",
    },
    {
      id: "inventory.ledger",
      path: path(ROOT_INVENTORY, "/ledger"),
      type: "item",
      title: "Stock Ledger",
      transKey: "nav.inventory.ledger",
      icon: "inventory.ledger",
    },
    {
      id: "inventory.boqConsumption",
      path: path(ROOT_INVENTORY, "/boq-consumption"),
      type: "item",
      title: "Site Consumption vs BOQ",
      transKey: "nav.inventory.boqConsumption",
      icon: "inventory.boqConsumption",
    },
  ],
};
