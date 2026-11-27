import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_MASTERS = "/masters";

const path = (root: string, item: string) => `${root}${item}`;

export const masters: NavigationTree = {
  ...baseNavigationObj["masters"],
  type: "root",
  childs: [
    {
      id: "masters.companies",
      path: path(ROOT_MASTERS, "/companies"),
      type: "item",
      title: "Companies & Legal Entities",
      transKey: "nav.masters.companies",
      icon: "realtySetup.companies",
    },
    {
      id: "masters.sites",
      path: path(ROOT_MASTERS, "/sites"),
      type: "item",
      title: "Sites & Geolocation",
      transKey: "nav.masters.sites",
      icon: "masters.sites",
    },
    {
      id: "masters.roles",
      path: path(ROOT_MASTERS, "/roles"),
      type: "item",
      title: "Roles & Permissions",
      transKey: "nav.masters.roles",
      icon: "settings",
    },
    {
      id: "masters.items",
      path: path(ROOT_MASTERS, "/items"),
      type: "item",
      title: "Items & Materials",
      transKey: "nav.masters.items",
      icon: "masters.items",
    },
    {
      id: "masters.vendors",
      path: path(ROOT_MASTERS, "/vendors"),
      type: "item",
      title: "Vendors & Contractors",
      transKey: "nav.masters.vendors",
      icon: "masters.vendors",
    },
  ],
};
