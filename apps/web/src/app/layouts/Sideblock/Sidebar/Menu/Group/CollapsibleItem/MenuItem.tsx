// Import Dependencies
import clsx from "clsx";
import { NavLink, useRouteLoaderData } from "react-router";
import invariant from "tiny-invariant";

// Local Imports
import { Badge } from "@/components/ui";
import { useBreakpointsContext } from "@/app/contexts/breakpoint/context";
import { useSidebarContext } from "@/app/contexts/sidebar/context";
import { NavigationTree } from "@/@types/navigation";
import { getMenuTitle } from "@/utils/getMenuTitle";

// ----------------------------------------------------------------------

export function MenuItem({ data }: { data: NavigationTree }) {
  const { id, transKey, path, title: defaultTitle } = data;
  const { lgAndDown } = useBreakpointsContext();
  const { close } = useSidebarContext();

  invariant(path, `[MenuItem] Path is required for navigation item`);

  const label = getMenuTitle(transKey, defaultTitle, id);
  const info = useRouteLoaderData("root")?.[id]?.info;

  const handleMenuItemClick = () => lgAndDown && close();

  return (
    <div className="relative flex">
      <NavLink
        to={path}
        onClick={handleMenuItemClick}
        className={({ isActive }) =>
          clsx(
            "group min-w-0 flex-1 rounded-md px-3 py-2 font-medium outline-hidden transition-colors ease-in-out",
            isActive
              ? "text-primary-600 dark:text-primary-400"
              : "text-gray-800 hover:bg-gray-100 hover:text-gray-950 focus:bg-gray-100 focus:text-gray-950 dark:text-dark-200 dark:hover:bg-dark-300/10 dark:hover:text-dark-50 dark:focus:bg-dark-300/10",
          )
        }
      >
        {({ isActive }) => (
          <div
            data-menu-active={isActive}
            className="flex min-w-0 items-center justify-between gap-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={clsx(
                  isActive
                    ? "bg-primary-600 dark:bg-primary-400 border-primary-600 dark:border-primary-400"
                    : "border-gray-300 dark:border-dark-450",
                  "size-2 rounded-full border transition-colors",
                )}
              />
              <span className="truncate text-xs-plus">{label}</span>
            </div>
            {info && info.val && (
              <Badge
                color={info.color}
                variant="soft"
                className="h-4.5 min-w-[1rem] shrink-0 p-[5px] text-tiny-plus"
              >
                {info.val}
              </Badge>
            )}
          </div>
        )}
      </NavLink>
    </div>
  );
}
