import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_PROCUREMENT = "/procurement";

const path = (root: string, item: string) => `${root}${item}`;

export const procurement: NavigationTree = {
  ...baseNavigationObj["procurement"],
  type: "root",
  childs: [
    {
      id: "procurement.pos",
      path: path(ROOT_PROCUREMENT, "/pos"),
      type: "item",
      title: "Purchase Orders",
      transKey: "nav.procurement.pos",
      icon: "procurement.pos",
    },
    {
      id: "procurement.indents",
      path: path(ROOT_PROCUREMENT, "/indents"),
      type: "item",
      title: "Material Indents",
      transKey: "nav.procurement.indents",
      icon: "procurement.indents",
    },
    {
      id: "procurement.rfq",
      path: path(ROOT_PROCUREMENT, "/rfq"),
      type: "item",
      title: "RFQ & Comparisons",
      transKey: "nav.procurement.rfq",
      icon: "procurement.rfq",
    },
  ],
};
