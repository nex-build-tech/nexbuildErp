import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT = "/realty/setup";

const path = (root: string, item: string) => `${root}${item}`;

export const realtySetup: NavigationTree = {
  ...baseNavigationObj["realtySetup"],
  type: "root",
  permission: "realty.settings.manage",
  childs: [
    {
      id: "realtySetup.companies",
      path: path(ROOT, "/companies"),
      type: "item",
      title: "Companies & Firms",
      transKey: "nav.realtySetup.companies",
      icon: "realtySetup.companies",
    },
    {
      id: "realtySetup.sites",
      path: "/masters/sites",
      type: "item",
      title: "Site & Geofence Config",
      transKey: "nav.realtySetup.sites",
      icon: "masters.sites",
    },
    {
      id: "realtySetup.roles",
      path: "/masters/roles",
      type: "item",
      title: "Roles & Security Master",
      transKey: "nav.realtySetup.roles",
      icon: "settings",
    },
    {
      id: "realtySetup.project",
      path: path(ROOT, "/project"),
      type: "item",
      title: "Project Setup Wizard",
      transKey: "nav.realtySetup.project",
      icon: "realtySetup.project",
    },
    {
      id: "realtySetup.plans",
      path: path(ROOT, "/plans"),
      type: "item",
      title: "Payment Plans",
      transKey: "nav.realtySetup.plans",
      icon: "realtySetup.plans",
    },
    {
      id: "realtySetup.charges",
      path: path(ROOT, "/charges"),
      type: "item",
      title: "Charge Heads & Price List",
      transKey: "nav.realtySetup.charges",
      icon: "realtySetup.charges",
    },
    {
      id: "realtySetup.letters",
      path: path(ROOT, "/letters"),
      type: "item",
      title: "Letter Templates",
      transKey: "nav.realtySetup.letters",
      icon: "realtySetup.letters",
    },
    {
      id: "realtySetup.routing",
      path: path(ROOT, "/routing"),
      type: "item",
      title: "Routing Rules",
      transKey: "nav.realtySetup.routing",
      icon: "realtySetup.routing",
    },
    {
      id: "realtySetup.masters",
      path: path(ROOT, "/masters"),
      type: "item",
      title: "Sales Dropdown Masters",
      transKey: "nav.realtySetup.masters",
      icon: "realtySetup.masters",
    },
  ],
};
