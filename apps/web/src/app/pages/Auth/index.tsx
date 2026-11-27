// Import Dependencies
import { useState, useMemo } from "react";
import {
  UserIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";

// Local Imports
import { useAuthContext } from "@/app/contexts/auth/context";
import { AuthFormValues, schema } from "./schema";
import { Page } from "@/components/shared/Page";
import NexBuildIcon from "@/assets/nexbuildLogo.svg?react";
import NexBuildIconWhite from "@/assets/nexbuildLogo-white.svg?react";
import { getTenantConfig, type TenantBrandConfig } from "./tenantConfig";

// ----------------------------------------------------------------------

export interface DemoUser {
  category: "exec" | "sales";
  roleTitle: string;
  name: string;
  username: string;
  password: string;
  color: string;
  badge: string;
  scopeTag: string;
  scopeDesc: string;
}

const ALL_DEMO_USERS: DemoUser[] = [
  {
    category: "exec",
    roleTitle: "SaaS Super Administrator",
    name: "Platform Root Admin",
    username: "superadmin",
    password: "superadmin123",
    color: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    badge: "🛡️ Super Admin",
    scopeTag: "Platform Only",
    scopeDesc: "SaaS platform configuration, onboarding tenants & enabling modules (Sales, Attendance, ERP)",
  },
  {
    category: "exec",
    roleTitle: "Tenant Administrator",
    name: "Rajesh Sharma",
    username: "admin",
    password: "admin123",
    color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    badge: "⚙️ Admin",
    scopeTag: "All Tenant Modules",
    scopeDesc: "Tenant admin: manage companies, projects, users, bookings, receipts & settings",
  },
  {
    category: "sales",
    roleTitle: "VP & Head of Sales",
    name: "Vikram Malhotra",
    username: "saleshead",
    password: "sales123",
    color: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    badge: "🎯 Sales Head",
    scopeTag: "Sales & Masters",
    scopeDesc: "Sales pipeline, cost sheets, booking approvals, receipt management, sales masters & reports",
  },
  {
    category: "sales",
    roleTitle: "Sales Executive",
    name: "Rahul Deshmukh",
    username: "salesexec",
    password: "exec123",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    badge: "🤝 Sales Exec",
    scopeTag: "Full Sales Flow",
    scopeDesc: "Pre-sales leads, site visits, inventory, cost sheets, add booking forms & receipt entry",
  },
];

type TabKey = "all" | "exec" | "sales";

// ─────────────────────────────────────────────
// SVG Background Patterns
// ─────────────────────────────────────────────

function PatternGrid({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

function PatternDots({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.10]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

function PatternDiagonal({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="diag" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke={color} strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#diag)" />
    </svg>
  );
}

function PatternCircuit({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="circuit" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path
            d="M10 10 H 40 V 40 H 70 M 40 10 V 40 M 10 40 H 10 M 70 10 V 70 M 10 70 H 70"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeLinecap="round"
          />
          <circle cx="10" cy="10" r="3" fill={color} />
          <circle cx="40" cy="40" r="3" fill={color} />
          <circle cx="70" cy="70" r="3" fill={color} />
          <circle cx="70" cy="10" r="3" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit)" />
    </svg>
  );
}

function PatternHexagon({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.06]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hex" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
          <polygon
            points="28,2 54,16 54,44 28,58 2,44 2,16"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
          <polygon
            points="28,52 54,66 54,94 28,108 2,94 2,66"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

function TenantPattern({
  pattern,
  color,
}: {
  pattern: TenantBrandConfig["pattern"];
  color: string;
}) {
  switch (pattern) {
    case "dots":
      return <PatternDots color={color} />;
    case "diagonal":
      return <PatternDiagonal color={color} />;
    case "circuit":
      return <PatternCircuit color={color} />;
    case "hexagon":
      return <PatternHexagon color={color} />;
    default:
      return <PatternGrid color={color} />;
  }
}

// ─────────────────────────────────────────────
// Hero Left Panel
// ─────────────────────────────────────────────

function HeroPanel({ tenant }: { tenant: TenantBrandConfig }) {
  return (
    <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col">
      {/* Hero Photograph */}
      <img
        src={tenant.heroImage}
        alt={tenant.name}
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="eager"
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, ${tenant.accentColor}99 0%, ${tenant.accentColorDark}77 45%, rgba(0,0,0,0.80) 100%)`,
        }}
      />

      {/* SVG Texture Pattern */}
      <TenantPattern pattern={tenant.pattern} color="#ffffff" />

      {/* Content on top */}
      <div className="relative z-10 flex flex-col h-full px-10 py-10">
        {/* Top: NexBuild Product Identity */}
        <div className="flex items-center gap-3">
          {/* Dark glass pill so icon is always readable over any tinted overlay */}
          <div
            className="rounded-xl p-2.5 flex items-center justify-center shrink-0 shadow-lg"
            style={{
              background: "rgba(0,0,0,0.42)",
              border: "1px solid rgba(255,255,255,0.20)",
              backdropFilter: "blur(8px)",
            }}
          >
            <NexBuildIconWhite className="size-7 drop-shadow" />
          </div>
          <div style={{ textShadow: "0 1px 8px rgba(0,0,0,0.70)" }}>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black text-lg tracking-tight leading-none">
                NexBuild
              </span>
              {/* White badge � always visible regardless of accent overlay */}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-widest uppercase leading-none border border-white/70 text-white bg-white/15">
                ERP
              </span>
            </div>
            <p className="text-white/80 text-[11px] mt-0.5 font-medium">
              Construction &amp; Realty Platform
            </p>
          </div>
        </div>

        {/* Middle: Tenant Brand */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Tenant initials badge */}
          <div
            className="w-16 h-16 rounded-2xl border-2 border-white/30 flex items-center justify-center mb-6 text-2xl font-black text-white backdrop-blur-sm"
            style={{ backgroundColor: `${tenant.accentColor}55` }}
          >
            {tenant.logoInitials}
          </div>

          <h1 className="text-white font-black text-3xl xl:text-4xl leading-tight tracking-tight mb-3">
            {tenant.name}
          </h1>

          <p className="text-white/80 text-base font-medium mb-2 leading-relaxed max-w-xs">
            {tenant.tagline}
          </p>

          <div className="flex items-center gap-1.5 text-white/60 text-sm mb-10">
            <MapPinIcon className="size-4 shrink-0" />
            <span>{tenant.location}</span>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {tenant.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm p-3.5"
              >
                <div className="text-white font-black text-xl leading-none mb-1">
                  {stat.value}
                </div>
                <div className="text-white/60 text-[11px] font-medium leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Trust badges */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/15">
          <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
            <ShieldCheckIcon className="size-4 text-emerald-400" />
            <span>ISO 27001 Certified</span>
          </div>
          <div className="text-white/30 text-xs">•</div>
          <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
            <ChartBarIcon className="size-4 text-blue-400" />
            <span>99.9% Uptime SLA</span>
          </div>
          <div className="text-white/30 text-xs">•</div>
          <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
            <BuildingOffice2Icon className="size-4 text-amber-400" />
            <span>MahaRERA Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Login Page
// ─────────────────────────────────────────────

export default function SignIn() {
  const { login, errorMessage, isLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  // Detect tenant from subdomain
  const tenant = useMemo(() => getTenantConfig(), []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "boss",
      password: "boss123",
    },
  });

  const onSubmit = (data: AuthFormValues) => {
    login({ username: data.username, password: data.password });
  };

  const handleDemoLogin = (username: string, pass: string) => {
    setValue("username", username);
    setValue("password", pass);
    login({ username, password: pass });
  };

  const displayedUsers =
    activeTab === "all"
      ? ALL_DEMO_USERS
      : ALL_DEMO_USERS.filter((u) => u.category === activeTab);

  const tabs: Array<{ id: TabKey; label: string; count: number }> = [
    { id: "all", label: "All Roles", count: ALL_DEMO_USERS.length },
    {
      id: "exec",
      label: "Admin & Platform",
      count: ALL_DEMO_USERS.filter((u) => u.category === "exec").length,
    },
    {
      id: "sales",
      label: "Sales Team",
      count: ALL_DEMO_USERS.filter((u) => u.category === "sales").length,
    },
  ];

  return (
    <Page title={`${tenant.name} — NexBuild ERP Login`}>
      <div className="min-h-screen flex bg-white dark:bg-dark-900">
        {/* ── Left: Hero Panel ── */}
        <HeroPanel tenant={tenant} />

        {/* ── Right: Auth Panel ── */}
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
          {/* Subtle pattern on the right side too */}
          <div className="absolute inset-0 pointer-events-none">
            <TenantPattern pattern={tenant.pattern} color={tenant.accentColor} />
          </div>

          <div className="relative z-10 flex flex-col flex-1 px-6 sm:px-10 md:px-14 py-10">
            {/* Mobile: NexBuild logo + Tenant name (visible only on small) */}
            <div className="flex items-center gap-3 mb-10 lg:mb-0 lg:invisible">
              <div className="bg-slate-100 dark:bg-dark-800 rounded-xl p-2 flex items-center">
                <NexBuildIcon className="size-6 dark:hidden" />
                <NexBuildIconWhite className="size-6 hidden dark:block" />
              </div>
              <div>
                <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                  NexBuild ERP
                </span>
                <p className="text-xs text-slate-400 leading-none mt-0.5">
                  {tenant.name}
                </p>
              </div>
            </div>

            {/* Center the form vertically */}
            <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
              {/* Greeting */}
              <div className="mb-8">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-4 border"
                  style={{
                    color: tenant.accentColor,
                    borderColor: `${tenant.accentColor}50`,
                    backgroundColor: `${tenant.accentColor}10`,
                  }}
                >
                  <span className="size-1.5 rounded-full bg-current animate-pulse" />
                  {tenant.slug.toUpperCase()} · Secure Portal
                </div>

                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Welcome back
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  Sign in to your {tenant.name} workspace
                </p>
              </div>

              {/* Login Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                autoComplete="off"
                className="space-y-4"
              >
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <UserIcon className="size-4 text-slate-400" strokeWidth="1.5" />
                    </span>
                    <input
                      {...register("username")}
                      type="text"
                      placeholder="Enter your username"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all"
                      style={
                        {
                          "--tw-ring-color": `${tenant.accentColor}80`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  {errors?.username && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <LockClosedIcon
                        className="size-4 text-slate-400"
                        strokeWidth="1.5"
                      />
                    </span>
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-11 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all"
                      style={
                        {
                          "--tw-ring-color": `${tenant.accentColor}80`,
                        } as React.CSSProperties
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="size-4" strokeWidth="1.5" />
                      ) : (
                        <EyeIcon className="size-4" strokeWidth="1.5" />
                      )}
                    </button>
                  </div>
                  {errors?.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {errorMessage}
                  </div>
                )}

                {/* Remember me + Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-slate-300 dark:border-dark-600 accent-current"
                      style={{ accentColor: tenant.accentColor }}
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold transition-colors"
                    style={{ color: tenant.accentColor }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{
                    background: `linear-gradient(135deg, ${tenant.accentColor} 0%, ${tenant.accentColorDark} 100%)`,
                    boxShadow: `0 4px 20px ${tenant.accentColor}50`,
                  }}
                >
                  {isLoading ? (
                    <>
                      <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon className="size-4" strokeWidth="2" />
                    </>
                  )}
                </button>
              </form>

              {/* Security note */}
              <div className="mt-6 rounded-xl border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/50 px-4 py-3 flex items-start gap-2.5">
                <ShieldCheckIcon className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Role-Based Access Control
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Menus and dashboards auto-adapt to your assigned role. All
                    sessions are JWT-secured and audit-logged.
                  </p>
                </div>
              </div>

              {/* Demo Access Toggle */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowDemoPanel((v) => !v)}
                  className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-200 dark:border-dark-600 rounded-xl transition-colors hover:border-slate-400"
                >
                  {showDemoPanel ? "▲ Hide" : "▼ Show"} demo role quick-login
                </button>

                {showDemoPanel && (
                  <div className="mt-3 border border-slate-200 dark:border-dark-700 rounded-2xl overflow-hidden bg-white dark:bg-dark-800 shadow-sm">
                    {/* Tab strip */}
                    <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-dark-900/60 flex-wrap border-b border-slate-200 dark:border-dark-700">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              isActive
                                ? "bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            {tab.label}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                isActive
                                  ? "text-white"
                                  : "bg-slate-200 dark:bg-dark-600 text-slate-500"
                              }`}
                              style={
                                isActive
                                  ? { backgroundColor: tenant.accentColor }
                                  : {}
                              }
                            >
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Role cards */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-700">
                      {displayedUsers.map((user) => (
                        <button
                          key={user.username}
                          type="button"
                          onClick={() =>
                            handleDemoLogin(user.username, user.password)
                          }
                          className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-dark-700/50 transition-colors flex items-center gap-3 group"
                        >
                          <span
                            className={`text-[10px] font-bold px-1.5 py-1 rounded-md border shrink-0 leading-none ${user.color}`}
                          >
                            {user.badge}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {user.name}
                              </span>
                              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-dark-600 shrink-0">
                                {user.scopeTag}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {user.roleTitle}
                            </p>
                          </div>
                          <div className="text-right shrink-0 hidden sm:block">
                            <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                              {user.username}
                            </span>
                          </div>
                          <div
                            className="size-7 rounded-lg flex items-center justify-center shrink-0 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: tenant.accentColor }}
                          >
                            <ArrowRightIcon className="size-3.5" strokeWidth="2.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-[11px] text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} {tenant.name} &bull; Powered by{" "}
              <span className="font-bold text-slate-600 dark:text-slate-300">
                NexBuild ERP
              </span>{" "}
              &bull; All rights reserved
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
