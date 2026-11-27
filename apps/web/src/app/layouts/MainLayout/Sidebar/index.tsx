// Import Dependencies
import { useMemo, useState } from "react";
import { useLocation } from "react-router";

// Local Imports
import { useBreakpointsContext } from "@/app/contexts/breakpoint/context";
import { useSidebarContext } from "@/app/contexts/sidebar/context";
import { useAuthContext } from "@/app/contexts/auth/context";
import {
  getNavigationForRole,
} from "@/app/navigation";
import { useDidUpdate } from "@/hooks";
import { isRouteActive } from "@/utils/isRouteActive";
import { MainPanel } from "./MainPanel";
import { PrimePanel } from "./PrimePanel";

// ----------------------------------------------------------------------

export type SegmentPath = string | undefined;

export function Sidebar() {
  const { pathname } = useLocation();
  const { name, lgAndDown } = useBreakpointsContext();
  const { isExpanded, close } = useSidebarContext();
  const { user, tenant } = useAuthContext();

  // Role-tailored navigation (Sales roles receive only sales modules, Partner Portal only if configured)
  const filteredNav = useMemo(() => {
    return getNavigationForRole(user?.role, tenant?.modules);
  }, [user?.role, tenant?.modules]);

  const initialSegment = useMemo(
    () => filteredNav.find((item) => isRouteActive(item.path, pathname)) || filteredNav[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredNav],
  );

  const [activeSegmentPath, setActiveSegmentPath] = useState<SegmentPath>(
    initialSegment?.path,
  );

  const currentSegment = useMemo(() => {
    return filteredNav.find((item) => item.path === activeSegmentPath) || filteredNav[0];
  }, [activeSegmentPath, filteredNav]);

  useDidUpdate(() => {
    const activePath = filteredNav.find((item) =>
      isRouteActive(item.path, pathname),
    )?.path;

    if (activePath) {
      setActiveSegmentPath(activePath);
    }
  }, [pathname, filteredNav]);

  useDidUpdate(() => {
    if (lgAndDown && isExpanded) close();
  }, [name]);

  return (
    <>
      <MainPanel
        nav={filteredNav}
        activeSegmentPath={activeSegmentPath}
        setActiveSegmentPath={setActiveSegmentPath}
      />
      <PrimePanel
        close={close}
        currentSegment={currentSegment}
        pathname={pathname}
      />
    </>
  );
}
