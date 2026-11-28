import { Navigate, Outlet, RouteObject } from "react-router";

import AuthGuard from "@/middleware/AuthGuard";
import { DynamicLayout } from "../layouts/DynamicLayout";
import { AppLayout } from "../layouts/AppLayout";
import { useAuthContext } from "@/app/contexts/auth/context";
import { getRoleCode, isCpPortalEnabled, isAttendanceEnabled } from "@/app/navigation";

function SmartRedirect() {
  const { user, tenant } = useAuthContext();
  const roleCode = getRoleCode(user?.role);

  if (roleCode === "super_admin") {
    return <Navigate to="/super-admin/tenants" replace />;
  }
  if (roleCode === "channel_partner" || roleCode.includes("partner")) {
    if (isCpPortalEnabled(tenant?.modules)) {
      return <Navigate to="/cp/dashboard" replace />;
    }
    return <Navigate to="/realty/dashboard" replace />;
  }
  if (roleCode.includes("crm") || roleCode.includes("collection")) {
    return <Navigate to="/realty/post-sales" replace />;
  }
  return <Navigate to="/realty/dashboard" replace />;
}

function CpPortalGuard() {
  const { tenant } = useAuthContext();
  const cpEnabled = isCpPortalEnabled(tenant?.modules);
  if (!cpEnabled) {
    return <Navigate to="/realty/dashboard" replace />;
  }
  return <Outlet />;
}

function AttendanceGuard() {
  const { tenant, user } = useAuthContext();
  const attendanceEnabled = isAttendanceEnabled(tenant?.modules);
  const roleCode = getRoleCode(user?.role);
  if (!attendanceEnabled && roleCode !== "super_admin") {
    return <Navigate to="/realty/dashboard" replace />;
  }
  return <Outlet />;
}

/**
 * Protected routes configuration
 * These routes require authentication to access
 * Uses AuthGuard middleware to verify user authentication
 */
const protectedRoutes: RouteObject = {
  id: "protected",
  Component: AuthGuard,
  children: [
    {
      path: "profile-setup",
      lazy: async () => ({
        Component: (await import("@/app/pages/Auth/ProfileSetup")).default,
      }),
    },
    // The dynamic layout supports both the main layout and the sideblock.
    {
      Component: DynamicLayout,
      children: [
        {
          index: true,
          element: <SmartRedirect />,
        },
        {
          path: "dashboards",
          children: [
            {
              index: true,
              element: <Navigate to="/dashboards/home" />,
            },
            {
              path: "home",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/home"))
                  .default,
              }),
            },
            {
              path: "reports",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/reports"))
                  .default,
              }),
            },
          ],
        },
        {
          path: "masters",
          children: [
            {
              index: true,
              element: <Navigate to="/masters/items" />,
            },
            {
              path: "companies",
              lazy: async () => ({
                Component: (await import("@/app/pages/masters/companies")).default,
              }),
            },
            {
              path: "roles",
              lazy: async () => ({
                Component: (await import("@/app/pages/masters/roles")).default,
              }),
            },
            {
              path: "items",
              lazy: async () => ({
                Component: (await import("@/app/pages/masters/items")).default,
              }),
            },
            {
              path: "sites",
              lazy: async () => ({
                Component: (await import("@/app/pages/masters/sites")).default,
              }),
            },
            {
              path: "vendors",
              lazy: async () => ({
                Component: (await import("@/app/pages/masters/vendors")).default,
              }),
            },
          ],
        },
        {
          path: "procurement",
          children: [
            {
              index: true,
              element: <Navigate to="/procurement/pos" />,
            },
            {
              path: "indents",
              lazy: async () => ({
                Component: (await import("@/app/pages/procurement/indents")).default,
              }),
            },
            {
              path: "rfq",
              lazy: async () => ({
                Component: (await import("@/app/pages/procurement/rfq")).default,
              }),
            },
            {
              path: "pos",
              lazy: async () => ({
                Component: (await import("@/app/pages/procurement/pos")).default,
              }),
            },
          ],
        },
        {
          path: "inventory",
          children: [
            {
              index: true,
              element: <Navigate to="/inventory/stock" />,
            },
            {
              path: "grn",
              lazy: async () => ({
                Component: (await import("@/app/pages/inventory/grn")).default,
              }),
            },
            {
              path: "stock",
              lazy: async () => ({
                Component: (await import("@/app/pages/inventory/stock")).default,
              }),
            },
            {
              path: "issues",
              lazy: async () => ({
                Component: (await import("@/app/pages/inventory/issues")).default,
              }),
            },
            {
              path: "ledger",
              lazy: async () => ({
                Component: (await import("@/app/pages/inventory/ledger")).default,
              }),
            },
            {
              path: "boq-consumption",
              lazy: async () => ({
                Component: (await import("@/app/pages/inventory/boq-consumption")).default,
              }),
            },
          ],
        },
        {
          path: "contractors",
          children: [
            {
              index: true,
              element: <Navigate to="/contractors/work-orders" />,
            },
            {
              path: "work-orders",
              lazy: async () => ({
                Component: (await import("@/app/pages/contractors/work-orders")).default,
              }),
            },
            {
              path: "ra-bills",
              lazy: async () => ({
                Component: (await import("@/app/pages/contractors/ra-bills")).default,
              }),
            },
          ],
        },
        {
          path: "site-operations",
          children: [
            {
              index: true,
              element: <Navigate to="/site-operations/dpr" />,
            },
            {
              path: "dpr",
              lazy: async () => ({
                Component: (await import("@/app/pages/site-operations/dpr")).default,
              }),
            },
            {
              path: "labour",
              lazy: async () => ({
                Component: (await import("@/app/pages/site-operations/labour")).default,
              }),
            },
          ],
        },
        {
          path: "super-admin",
          children: [
            {
              index: true,
              element: <Navigate to="/super-admin/tenants" />,
            },
            {
              path: "tenants",
              lazy: async () => ({
                Component: (await import("@/app/pages/super-admin/tenants")).default,
              }),
            },
          ],
        },
        {
          path: "realty",
          children: [
            {
              index: true,
              element: <Navigate to="/realty/dashboard" replace />,
            },
            {
              path: "dashboard",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/dashboard")).default,
              }),
            },
            {
              path: "leads",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/leads")).default,
                  }),
                },
                {
                  path: ":id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/leads/detail")).default,
                  }),
                },
              ],
            },
            {
              path: "followups",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/followups")).default,
              }),
            },
            {
              path: "site-visits",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/site-visits")).default,
              }),
            },
            {
              path: "campaigns",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/campaigns")).default,
              }),
            },
            {
              path: "inventory",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/inventory")).default,
              }),
            },
            {
              path: "cost-sheets",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/cost-sheets")).default,
              }),
            },
            {
              path: "channel-partners",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/channel-partners")).default,
              }),
            },
            {
              path: "masters",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/masters")).default,
              }),
            },
            {
              path: "post-sales",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/post-sales")).default,
              }),
            },
            {
              path: "bookings",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/bookings")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/bookings/new")).default,
                  }),
                },
                {
                  path: ":id",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/bookings/detail")).default,
                  }),
                },
              ],
            },
            {
              path: "demands",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/demands")).default,
              }),
            },
            {
              path: "receipts",
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/receipts")).default,
                  }),
                },
                {
                  path: "new",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/receipts/new")).default,
                  }),
                },
              ],
            },
            {
              path: "ledger",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/ledger")).default,
              }),
            },
            {
              path: "letters",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/letters")).default,
              }),
            },
            {
              path: "cancellations",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/cancellations")).default,
              }),
            },
            {
              path: "reports",
              lazy: async () => ({
                Component: (await import("@/app/pages/realty/reports")).default,
              }),
            },
            {
              path: "setup",
              children: [
                {
                  path: "companies",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/setup/companies")).default,
                  }),
                },
                {
                  path: "project",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/setup/project")).default,
                  }),
                },
                {
                  path: "plans",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/setup/plans")).default,
                  }),
                },
                {
                  path: "charges",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/setup/charges")).default,
                  }),
                },
                {
                  path: "letters",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/setup/letters")).default,
                  }),
                },
                {
                  path: "routing",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/setup/routing")).default,
                  }),
                },
                {
                  path: "masters",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/masters")).default,
                  }),
                },
              ],
            },
            {
              path: "coming-soon",
              children: [
                {
                  path: "customer-hub",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/coming-soon/customer-hub")).default,
                  }),
                },
                {
                  path: "communication-hub",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/coming-soon/communication-hub")).default,
                  }),
                },
                {
                  path: "ai-intelligence",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/coming-soon/ai-intelligence")).default,
                  }),
                },
                {
                  path: "analytics",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/coming-soon/analytics")).default,
                  }),
                },
                {
                  path: "integrations",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/realty/coming-soon/integrations")).default,
                  }),
                },
              ],
            },
          ],
        },
        {
          path: "cp",
          Component: CpPortalGuard,
          children: [
            {
              index: true,
              element: <Navigate to="/cp/dashboard" replace />,
            },
            {
              path: "dashboard",
              lazy: async () => ({
                Component: (await import("@/app/pages/cp-portal/dashboard")).default,
              }),
            },
            {
              path: "leads",
              lazy: async () => ({
                Component: (await import("@/app/pages/cp-portal/leads")).default,
              }),
            },
            {
              path: "inventory",
              lazy: async () => ({
                Component: (await import("@/app/pages/cp-portal/inventory")).default,
              }),
            },
            {
              path: "brokerage",
              lazy: async () => ({
                Component: (await import("@/app/pages/cp-portal/brokerage")).default,
              }),
            },
          ],
        },
        {
          path: "trushift",
          Component: AttendanceGuard,
          children: [
            {
              index: true,
              element: <Navigate to="/trushift/dashboard" replace />,
            },
            {
              path: "dashboard",
              lazy: async () => ({
                Component: (await import("@/app/pages/trushift/dashboard")).default,
              }),
            },
            {
              path: "muster-roll",
              lazy: async () => ({
                Component: (await import("@/app/pages/trushift/muster-roll")).default,
              }),
            },
            {
              path: "logs",
              lazy: async () => ({
                Component: (await import("@/app/pages/trushift/logs")).default,
              }),
            },
            {
              path: "staff",
              lazy: async () => ({
                Component: (await import("@/app/pages/trushift/staff")).default,
              }),
            },
            {
              path: "masters",
              children: [
                {
                  path: "shifts",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/trushift/masters/shifts")).default,
                  }),
                },
                {
                  path: "holidays",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/trushift/masters/holidays")).default,
                  }),
                },
                {
                  path: "leaves",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/trushift/masters/leaves")).default,
                  }),
                },
                {
                  path: "geofence",
                  lazy: async () => ({
                    Component: (await import("@/app/pages/trushift/masters/geofence")).default,
                  }),
                },
              ],
            },
            {
              path: "analytics",
              lazy: async () => ({
                Component: (await import("@/app/pages/trushift/analytics")).default,
              }),
            },
          ],
        },
        {
          path: "site-operations",
          children: [
            {
              index: true,
              element: <Navigate to="/site-operations/dpr" />,
            },
            {
              path: "dpr",
              lazy: async () => ({
                Component: (await import("@/app/pages/site-operations/dpr")).default,
              }),
            },
            {
              path: "labour",
              lazy: async () => ({
                Component: (await import("@/app/pages/site-operations/labour")).default,
              }),
            },
          ],
        },
      ],
    },
    // The app layout supports only the main layout. Avoid using it for other layouts.
    {
      Component: AppLayout,
      children: [
        {
          path: "settings",
          lazy: async () => ({
            Component: (await import("@/app/pages/settings/Layout")).default,
          }),
          children: [
            {
              index: true,
              element: <Navigate to="/settings/general" />,
            },
            {
              path: "general",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/settings/sections/General")
                ).default,
              }),
            },
            {
              path: "appearance",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/settings/sections/Appearance")
                ).default,
              }),
            },
            {
              path: "security",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/settings/sections/Security")
                ).default,
              }),
            },
            {
              path: "tenants",
              lazy: async () => ({
                Component: (await import("@/app/pages/super-admin/tenants")).default,
              }),
            },
          ],
        },
      ],
    },
  ],
};

export { protectedRoutes };
