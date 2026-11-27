import { dashboards } from "./segments/dashboards";
import { masters } from "./segments/masters";
import { procurement } from "./segments/procurement";
import { inventory } from "./segments/inventory";
import { contractors } from "./segments/contractors";
import { siteOperations } from "./segments/site-operations";
import { superAdmin } from "./segments/super-admin";
import { settings } from "./segments/settings";
import { realtySales } from "./segments/realty-sales";
import { realtyPostSales } from "./segments/realty-post-sales";
import { realtySetup } from "./segments/realty-setup";
import { realtyComingSoon } from "./segments/realty-coming-soon";
import { cpPortal } from "./segments/cp-portal";
import { trushiftAttendance } from "./segments/trushift";
import { NavigationTree } from "@/@types/navigation";

export {
  dashboards,
  masters,
  procurement,
  inventory,
  contractors,
  siteOperations,
  superAdmin,
  settings,
  realtySales,
  realtyPostSales,
  realtySetup,
  realtyComingSoon,
  cpPortal,
  trushiftAttendance,
};

export const navigation: NavigationTree[] = [
  dashboards,
  masters,
  procurement,
  inventory,
  contractors,
  siteOperations,
  realtySales,
  realtyPostSales,
  cpPortal,
  realtySetup,
  trushiftAttendance,
  realtyComingSoon,
];

/**
 * Extracts normalized lowercase role code from user object or string
 */
export function getRoleCode(role?: string | { code?: string } | null): string {
  if (!role) return "";
  if (typeof role === "object") return (role.code || "").toLowerCase();
  return String(role).toLowerCase();
}

/**
 * Checks if the given role is a sales or pre-sales role
 */
export function isSalesRole(role?: string | { code?: string } | null): boolean {
  const code = getRoleCode(role);
  return (
    code === "sales_head" ||
    code === "sales_exec" ||
    code === "presales" ||
    code === "sales" ||
    code.includes("sales") ||
    code.includes("presale")
  );
}

/**
 * Helper to check whether Channel Partner Portal is enabled for the tenant
 */
export function isCpPortalEnabled(
  tenantModules?: Array<{ moduleCode: string; enabled: boolean }> | string[] | null
): boolean {
  if (!tenantModules) return false;
  if (Array.isArray(tenantModules)) {
    const match = tenantModules.find((m: any) =>
      (typeof m === "string" ? m : m?.moduleCode) === "REALTY_CP_PORTAL"
    );
    if (!match) return false;
    return typeof match === "string" ? true : Boolean(match.enabled);
  }
  return false;
}

/**
 * Helper to check whether Attendance (Trushift) is enabled for the tenant
 */
export function isAttendanceEnabled(
  tenantModules?: Array<{ moduleCode: string; enabled: boolean }> | string[] | null
): boolean {
  if (!tenantModules) return false;
  if (Array.isArray(tenantModules)) {
    const match = tenantModules.find((m: any) => {
      const code = (typeof m === "string" ? m : m?.moduleCode || "").toUpperCase();
      return code === "ATTENDANCE" || code === "TRUSHIFT" || code === "HR_ATTENDANCE";
    });
    if (!match) return false;
    return typeof match === "string" ? true : Boolean(match.enabled);
  }
  return false;
}

/**
 * Returns role-tailored navigation segments.
 * For sales roles, returns strictly sales-related modules.
 * Partner Portal is configurable: only shown if REALTY_CP_PORTAL module is enabled for the tenant.
 * Trushift Attendance is configurable: shown for Admin when ATTENDANCE module is enabled.
 */
export function getNavigationForRole(
  role?: string | { code?: string } | null,
  tenantModules?: Array<{ moduleCode: string; enabled: boolean }> | string[] | null
): NavigationTree[] {
  const code = getRoleCode(role);
  const showCpPortal = isCpPortalEnabled(tenantModules);
  const showAttendance = isAttendanceEnabled(tenantModules);

  // Platform Super Admin
  if (code === "super_admin") {
    return [
      superAdmin,
      ...(showAttendance ? [trushiftAttendance] : []),
      ...navigation.filter((item) => {
        if (item.id === "cpPortal") return showCpPortal;
        if (item.id === "trushiftAttendance") return showAttendance;
        return true;
      }),
    ];
  }

  // Tenant Admin: Full Realty, Sales, Setup, and Trushift Attendance (if enabled)
  if (code === "admin") {
    return [
      realtySales,
      ...(showCpPortal ? [cpPortal] : []),
      realtyPostSales,
      realtySetup,
      ...(showAttendance ? [trushiftAttendance] : []),
    ];
  }

  // Head of Sales: Sales execution, CP Desk, Project/Pricing setup, and Sales Masters
  if (code === "sales_head") {
    return [
      realtySales,
      ...(showCpPortal ? [cpPortal] : []),
      realtySetup,
    ];
  }

  // Direct Sales Closers & Pre-Sales Executives: Strictly sales related modules
  if (isSalesRole(code)) {
    return [
      realtySales,
      ...(showCpPortal ? [cpPortal] : []),
    ];
  }

  // Channel Partner Portal
  if (code === "channel_partner" || code.includes("partner")) {
    return showCpPortal ? [cpPortal] : [];
  }

  // CRM & Post-Sales
  if (code.includes("crm") || code.includes("collection")) {
    return [realtyPostSales];
  }

  // Site Operations & Construction
  if (code === "site_engineer" || code === "site") {
    return [siteOperations, inventory, contractors];
  }

  // Procurement & Stores
  if (code === "procurement_mgr" || code === "purchase") {
    return [procurement, inventory, masters];
  }

  // Contractors & Billing
  if (code === "contractor_lead" || code === "contractor") {
    return [contractors, siteOperations];
  }

  // Default: Full ERP navigation (Executive, Owner, Admin)
  return navigation.filter((item) => {
    if (item.id === "cpPortal") {
      return showCpPortal;
    }
    if (item.id === "trushiftAttendance") {
      return showAttendance;
    }
    return true;
  });
}
