// Import Dependencies
import { useMemo } from "react";
import { useLocation } from "react-router";
import clsx from "clsx";
import invariant from "tiny-invariant";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

// Local Imports
import { NavigationTree } from "@/@types/navigation";
import { Collapse } from "@/components/ui";
import { useDisclosure, useDidUpdate } from "@/hooks";
import { useThemeContext } from "@/app/contexts/theme/context";
import { isRouteActive } from "@/utils/isRouteActive";
import { MenuItem } from "./MenuItem";
import { CollapsibleItem } from "./CollapsibleItem";
import { getMenuTitle } from "@/utils/getMenuTitle";

// ----------------------------------------------------------------------

export function Group({ data }: { data: NavigationTree }) {
  const { pathname } = useLocation();
  const { cardSkin } = useThemeContext();

  invariant(
    data.childs && data.childs.length > 0,
    "[Group] Group menu must have at least one child",
  );

  const isGroupActive = useMemo(() => {
    if (data.path && isRouteActive(data.path, pathname)) return true;
    return (
      data.childs?.some((item) => {
        if (item.path && isRouteActive(item.path, pathname)) return true;
        return item.childs?.some(
          (sub) => sub.path && isRouteActive(sub.path, pathname),
        );
      }) ?? false
    );
  }, [data, pathname]);

  const [isOpened, { toggle, open }] = useDisclosure(isGroupActive);

  useDidUpdate(() => {
    if (isGroupActive) {
      open();
    }
  }, [isGroupActive]);

  const title = getMenuTitle(data.transKey, data.title, data.id);

  return (
    <div className="pt-2">
      <div
        className={clsx(
          "sticky top-0 z-10 bg-white px-5",
          cardSkin === "bordered" ? "dark:bg-dark-900" : "dark:bg-dark-750",
        )}
      >
        <button
          onClick={toggle}
          className="group dark:text-dark-300 dark:hover:text-dark-50 dark:focus:text-dark-50 mb-1.5 flex w-full cursor-pointer items-center justify-between py-1.5 text-xs font-bold tracking-wider text-gray-500 uppercase outline-hidden hover:text-gray-900 focus:text-gray-900 transition-colors"
        >
          <span>{title}</span>
          <ChevronDownIcon
            className={clsx(
              "size-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-dark-100 transition-transform duration-200",
              isOpened && "rotate-180"
            )}
          />
        </button>
        <div
          className={clsx(
            "pointer-events-none absolute inset-x-0 -bottom-3 h-3 bg-linear-to-b from-white to-transparent",
            cardSkin === "bordered"
              ? "dark:from-dark-900"
              : "dark:from-dark-750",
          )}
        ></div>
      </div>
      {data.childs && data.childs.length > 0 && (
        <Collapse in={isOpened}>
          <div className="space-y-1 pt-1 pb-1">
            {data.childs.map((item) =>
              item.childs && item.childs.length > 0 ? (
                <CollapsibleItem key={item.id || item.path} data={item} />
              ) : (
                <MenuItem key={item.id || item.path} data={item} />
              ),
            )}
          </div>
        </Collapse>
      )}
    </div>
  );
}
