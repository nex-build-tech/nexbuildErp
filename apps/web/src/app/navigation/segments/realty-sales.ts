import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT = "/realty";

const path = (root: string, item: string) => `${root}${item}`;

export const realtySales: NavigationTree = {
  ...baseNavigationObj["realtySales"],
  type: "root",
  permission: "realty.lead.view",
  childs: [
    {
      id: "realtySales.dashboard",
      path: path(ROOT, "/dashboard"),
      type: "item",
      title: "Sales Dashboard",
      transKey: "nav.realtySales.dashboard",
      icon: "realtySales.dashboard",
    },
    {
      id: "realtySales.leads",
      path: path(ROOT, "/leads"),
      type: "item",
      title: "Leads",
      transKey: "nav.realtySales.leads",
      icon: "realtySales.leads",
    },
    {
      id: "realtySales.followups",
      path: path(ROOT, "/followups"),
      type: "item",
      title: "Follow-ups",
      transKey: "nav.realtySales.followups",
      icon: "realtySales.followups",
    },
    {
      id: "realtySales.siteVisits",
      path: path(ROOT, "/site-visits"),
      type: "item",
      title: "Site Visits",
      transKey: "nav.realtySales.siteVisits",
      icon: "realtySales.siteVisits",
    },
    {
      id: "realtySales.campaigns",
      path: path(ROOT, "/campaigns"),
      type: "item",
      title: "Campaigns & Lead Capture",
      transKey: "nav.realtySales.campaigns",
      icon: "realtySales.campaigns",
    },
    {
      id: "realtySales.inventory",
      path: path(ROOT, "/inventory"),
      type: "item",
      title: "Inventory Grid",
      transKey: "nav.realtySales.inventory",
      icon: "realtySales.inventory",
    },
    {
      id: "realtySales.costSheets",
      path: path(ROOT, "/cost-sheets"),
      type: "item",
      title: "Cost Sheets",
      transKey: "nav.realtySales.costSheets",
      icon: "realtySales.costSheets",
    },
    {
      id: "realtySales.bookings",
      path: path(ROOT, "/bookings"),
      type: "item",
      title: "Bookings & Allotments",
      transKey: "nav.realtySales.bookings",
      icon: "realtySales.bookings",
    },
    {
      id: "realtySales.receipts",
      path: path(ROOT, "/receipts"),
      type: "item",
      title: "Receipt Entry",
      transKey: "nav.realtySales.receipts",
      icon: "realtySales.receipts",
    },
    {
      id: "realtySales.channelPartners",
      path: path(ROOT, "/channel-partners"),
      type: "item",
      title: "Channel Partners",
      transKey: "nav.realtySales.channelPartners",
      icon: "realtySales.channelPartners",
    },
    {
      id: "realtySales.masters",
      path: path(ROOT, "/masters"),
      type: "item",
      title: "Sales Masters",
      transKey: "nav.realtySales.masters",
      icon: "realtySales.masters",
    },
  ],
};
