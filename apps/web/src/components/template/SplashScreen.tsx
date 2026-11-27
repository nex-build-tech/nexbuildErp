import NexBuildIcon from "@/assets/nexbuildLogo.svg?react";
import NexBuildIconWhite from "@/assets/nexbuildLogo-white.svg?react";
import KingsIcon from "@/assets/kingsLogo.svg?react";
import { Progress } from "@/components/ui";

export function SplashScreen() {
  const activeTenantLogo =
    typeof window !== "undefined"
      ? localStorage.getItem("builderp_tenant_logo")
      : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-900 transition-colors">
      {/* Ambient Subtle Glow */}
      <div className="absolute size-72 rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center z-10">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3.5 mb-5">
          {/* NexBuild Product Icon (Option-A Tower-N) */}
          <div className="relative flex items-center justify-center size-14 rounded-2xl bg-white dark:bg-dark-800 shadow-md border border-slate-200/80 dark:border-dark-700/80">
            <NexBuildIcon className="size-9 drop-shadow-xs animate-pulse dark:hidden" />
            <NexBuildIconWhite className="size-9 drop-shadow-xs animate-pulse hidden dark:block" />
          </div>

          {/* Thin Divider */}
          <div className="h-8 w-px bg-slate-200 dark:bg-dark-700" />

          {/* Tenant Emblem (Custom Uploaded Logo or Default Kings Crest) */}
          <div
            title="Kings Builders & Developers"
            className="flex items-center justify-center size-14 rounded-2xl bg-amber-50/60 dark:bg-dark-800 shadow-md border border-amber-200/60 dark:border-dark-700/80"
          >
            {activeTenantLogo ? (
              <img
                src={activeTenantLogo}
                alt="Tenant Logo"
                className="size-9 max-h-9 max-w-9 object-contain drop-shadow-xs"
              />
            ) : (
              <KingsIcon className="size-9 drop-shadow-xs" />
            )}
          </div>
        </div>

        {/* Minimal Enterprise Brand Name */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="text-xl font-black tracking-tight text-[#12263F] dark:text-dark-50">
            NexBuild
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold text-[#E8A33D] border border-[#E8A33D] uppercase tracking-wider leading-none">
            ERP
          </span>
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-dark-400 mb-6">
          Kings Builders &amp; Developers
        </p>

        {/* Sleek Modern Indeterminate Loading Bar */}
        <div className="w-48 overflow-hidden rounded-full">
          <Progress
            color="primary"
            isIndeterminate
            animationDuration="1.2s"
            className="h-1 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
