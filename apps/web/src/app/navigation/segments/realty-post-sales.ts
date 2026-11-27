import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT = "/realty";

const path = (root: string, item: string) => `${root}${item}`;

export const realtyPostSales: NavigationTree = {
  ...baseNavigationObj["realtyPostSales"],
  type: "root",
  permission: "realty.booking.view",
  childs: [
    {
      id: "realtyPostSales.dashboard",
      path: path(ROOT, "/post-sales"),
      type: "item",
      title: "Post-Sales Dashboard",
      transKey: "nav.realtyPostSales.dashboard",
      icon: "realtyPostSales.dashboard",
    },
    {
      id: "realtyPostSales.bookings",
      path: path(ROOT, "/bookings"),
      type: "item",
      title: "Bookings",
      transKey: "nav.realtyPostSales.bookings",
      icon: "realtyPostSales.bookings",
    },
    {
      id: "realtyPostSales.demands",
      path: path(ROOT, "/demands"),
      type: "item",
      title: "Stages & Demands",
      transKey: "nav.realtyPostSales.demands",
      icon: "realtyPostSales.demands",
    },
    {
      id: "realtyPostSales.receipts",
      path: path(ROOT, "/receipts"),
      type: "item",
      title: "Receipts",
      transKey: "nav.realtyPostSales.receipts",
      icon: "realtyPostSales.receipts",
    },
    {
      id: "realtyPostSales.ledger",
      path: path(ROOT, "/ledger"),
      type: "item",
      title: "Customer Ledger",
      transKey: "nav.realtyPostSales.ledger",
      icon: "realtyPostSales.ledger",
    },
    {
      id: "realtyPostSales.letters",
      path: path(ROOT, "/letters"),
      type: "item",
      title: "Letters",
      transKey: "nav.realtyPostSales.letters",
      icon: "realtyPostSales.letters",
    },
    {
      id: "realtyPostSales.cancellations",
      path: path(ROOT, "/cancellations"),
      type: "item",
      title: "Cancellation & Transfer",
      transKey: "nav.realtyPostSales.cancellations",
      icon: "realtyPostSales.cancellations",
    },
    {
      id: "realtyPostSales.reports",
      path: path(ROOT, "/reports"),
      type: "item",
      title: "Reports",
      transKey: "nav.realtyPostSales.reports",
      icon: "realtyPostSales.reports",
    },
  ],
};
