import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_SITE = "/site-operations";

const path = (root: string, item: string) => `${root}${item}`;

export const siteOperations: NavigationTree = {
  ...baseNavigationObj["siteOperations"],
  type: "root",
  childs: [
    {
      id: "siteOperations.dpr",
      path: path(ROOT_SITE, "/dpr"),
      type: "item",
      title: "Daily Progress Report (DPR)",
      transKey: "nav.siteOperations.dpr",
      icon: "siteOperations.dpr",
    },
    {
      id: "siteOperations.labour",
      path: path(ROOT_SITE, "/labour"),
      type: "item",
      title: "Labour Attendance",
      transKey: "nav.siteOperations.labour",
      icon: "siteOperations.labour",
    },
  ],
};
