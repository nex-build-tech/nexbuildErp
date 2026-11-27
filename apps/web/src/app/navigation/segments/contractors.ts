import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_CONTRACTORS = "/contractors";

const path = (root: string, item: string) => `${root}${item}`;

export const contractors: NavigationTree = {
  ...baseNavigationObj["contractors"],
  type: "root",
  childs: [
    {
      id: "contractors.work-orders",
      path: path(ROOT_CONTRACTORS, "/work-orders"),
      type: "item",
      title: "Work Orders (BOQ)",
      transKey: "nav.contractors.workOrders",
      icon: "contractors.workOrders",
    },
    {
      id: "contractors.ra-bills",
      path: path(ROOT_CONTRACTORS, "/ra-bills"),
      type: "item",
      title: "RA Bills & MB Sheets",
      transKey: "nav.contractors.raBills",
      icon: "contractors.raBills",
    },
  ],
};
