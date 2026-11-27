import { Link } from "react-router";
import clsx from "clsx";
import NexBuildIcon from "@/assets/nexbuildLogo.svg?react";
import NexBuildIconWhite from "@/assets/nexbuildLogo-white.svg?react";
import KingsIcon from "@/assets/kingsLogo.svg?react";
import { useThemeContext } from "@/app/contexts/theme/context";

interface CoBrandLogoProps {
  variant?: "header" | "compact" | "auth";
  className?: string;
  to?: string;
}

export function CoBrandLogo({
  variant = "header",
  className,
  to = "/",
}: CoBrandLogoProps) {
  const { tenantLogo } = useThemeContext();
  const activeTenantLogo =
    tenantLogo ||
    (typeof window !== "undefined"
      ? localStorage.getItem("builderp_tenant_logo")
      : null);

  // 1. Compact Icon-Rail Mode: Clean Option-A Tower-N symbol
  if (variant === "compact") {
    return (
      <Link
        to={to}
        title="NexBuild ERP • Kings Builders & Developers"
        className={clsx(
          "flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors",
          className
        )}
      >
        <NexBuildIcon className="size-7.5 drop-shadow-xs dark:hidden" />
        <NexBuildIconWhite className="size-7.5 drop-shadow-xs hidden dark:block" />
      </Link>
    );
  }

  // 2. Auth / Login Screen: Clean enterprise lockup
  if (variant === "auth") {
    return (
      <div className={clsx("flex flex-col items-center text-center", className)}>
        {/* Clean Co-Brand Emblem Pair */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-xs flex items-center justify-center">
            <NexBuildIcon className="size-9 drop-shadow-xs dark:hidden" />
            <NexBuildIconWhite className="size-9 drop-shadow-xs hidden dark:block" />
          </div>
          <span className="text-slate-300 dark:text-dark-600 font-light text-base">&times;</span>
          <div
            title="Kings Builders & Developers"
            className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-dark-800 border border-amber-200/60 dark:border-dark-700 shadow-xs flex items-center justify-center"
          >
            {activeTenantLogo ? (
              <img
                src={activeTenantLogo}
                alt="Tenant Logo"
                className="size-9 max-h-9 max-w-9 object-contain"
              />
            ) : (
              <KingsIcon className="size-9" />
            )}
          </div>
        </div>

        {/* Minimal Enterprise Brand Name */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-black tracking-tight text-[#12263F] dark:text-dark-50">
            NexBuild
          </span>
          <span className="px-1.5 py-0.5 rounded text-[11px] font-extrabold text-[#E8A33D] border border-[#E8A33D] tracking-wider uppercase leading-none">
            ERP
          </span>
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-dark-400 mt-1.5">
          Kings Builders &amp; Developers &bull; Site: SITE-KH Kings Heights
        </p>
      </div>
    );
  }

  // 3. Default: Header / Sidebar Navigation Bar (Compact, Enterprise Standard)
  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center gap-2.5 select-none transition-opacity hover:opacity-90",
        className
      )}
    >
      {/* Product Mark + Clean Text (Option-A Tower-N) */}
      <div className="flex items-center gap-2 shrink-0">
        <NexBuildIcon className="size-6.5 shrink-0 drop-shadow-xs dark:hidden" />
        <NexBuildIconWhite className="size-6.5 shrink-0 drop-shadow-xs hidden dark:block" />
        <div className="flex items-center gap-1.5">
          <span className="font-black text-[15px] tracking-tight text-[#12263F] dark:text-dark-50 leading-none">
            NexBuild
          </span>
          <span className="px-1 py-0.2 rounded text-[10px] font-extrabold text-[#E8A33D] border border-[#E8A33D]/70 tracking-wider uppercase leading-none">
            ERP
          </span>
        </div>
      </div>

      {/* Subtle Vertical Divider */}
      <div className="h-4.5 w-px bg-slate-200 dark:bg-dark-700 mx-0.5 shrink-0" />

      {/* Tenant Logo ONLY (Clean Gold Emblem or Uploaded Custom Logo - No text) */}
      <div
        title="Kings Builders & Developers"
        className="flex items-center justify-center shrink-0 p-0.5 rounded-sm hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
      >
        {activeTenantLogo ? (
          <img
            src={activeTenantLogo}
            alt="Tenant Logo"
            className="size-6.5 max-h-6.5 max-w-6.5 object-contain shrink-0 drop-shadow-xs"
          />
        ) : (
          <KingsIcon className="size-6 shrink-0 drop-shadow-xs" />
        )}
      </div>
    </Link>
  );
}
