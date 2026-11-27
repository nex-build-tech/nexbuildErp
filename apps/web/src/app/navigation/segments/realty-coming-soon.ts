import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT = "/realty/coming-soon";

const path = (root: string, item: string) => `${root}${item}`;

export const realtyComingSoon: NavigationTree = {
  ...baseNavigationObj["realtyComingSoon"],
  type: "root",
  permission: "realty.lead.view",
  childs: [
    {
      id: "realtyComingSoon.customerHub",
      path: path(ROOT, "/customer-hub"),
      type: "item",
      title: "Customer Hub",
      transKey: "nav.realtyComingSoon.customerHub",
      icon: "realtyComingSoon.customerHub",
      badge: "soon",
    },
    {
      id: "realtyComingSoon.commHub",
      path: path(ROOT, "/communication-hub"),
      type: "item",
      title: "Communication Hub",
      transKey: "nav.realtyComingSoon.commHub",
      icon: "realtyComingSoon.commHub",
      badge: "soon",
    },
    {
      id: "realtyComingSoon.ai",
      path: path(ROOT, "/ai-intelligence"),
      type: "item",
      title: "AI Intelligence",
      transKey: "nav.realtyComingSoon.ai",
      icon: "realtyComingSoon.ai",
      badge: "soon",
    },
    {
      id: "realtyComingSoon.analytics",
      path: path(ROOT, "/analytics"),
      type: "item",
      title: "Advanced Analytics",
      transKey: "nav.realtyComingSoon.analytics",
      icon: "realtyComingSoon.analytics",
      badge: "soon",
    },
    {
      id: "realtyComingSoon.integrations",
      path: path(ROOT, "/integrations"),
      type: "item",
      title: "Integrations",
      transKey: "nav.realtyComingSoon.integrations",
      icon: "realtyComingSoon.integrations",
      badge: "soon",
    },
  ],
};
