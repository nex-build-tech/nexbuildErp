import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { useAuthContext } from "@/app/contexts/auth/context";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input, Badge } from "@/components/ui";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import {
  BuildingOfficeIcon,
  PlusIcon,
  PaintBrushIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  SparklesIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon,
  MapPinIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import {
  THEME_PRESETS,
  applyThemePalette,
  generateShades,
} from "@/utils/themePalette";

interface TenantItem {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  status: "active" | "trial" | "suspended" | "cancelled";
  plan: string;
  gstin?: string | null;
  stateCode?: string | null;
  address?: string | null;
  primaryColor: string;
  logoUrl?: string | null;
  tagline?: string | null;
  createdAt: string;
  metrics: {
    sitesCount: number;
    usersCount: number;
    posCount: number;
  };
  modules?: { moduleCode: string; enabled: boolean }[];
}

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);

  // Module Switch Modal State
  const [modulesModalOpen, setModulesModalOpen] = useState(false);
  const [tenantModulesState, setTenantModulesState] = useState<Record<string, boolean>>({
    REALTY_SALES: true,
    REALTY_CP_PORTAL: false,
    ATTENDANCE: false,
    CONSTRUCTION_ERP: false,
  });
  const [savingModules, setSavingModules] = useState(false);

  // Palette Customizer Modal State
  const [paletteModalOpen, setPaletteModalOpen] = useState(false);
  const [activeColor, setActiveColor] = useState<string>("#c5a04e");
  const [savingPalette, setSavingPalette] = useState(false);

  // New Tenant Onboarding Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    name: "",
    slug: "",
    plan: "enterprise",
    gstin: "27AABCM9876K1Z9",
    stateCode: "27",
    primaryColor: "#2563eb",
    tagline: "Premier Infrastructure & Commercial EPC",
    adminUsername: "director",
    adminEmail: "director@builderp.in",
    adminPassword: "Password123!",
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/super-admin/tenants");
      const list = res.data?.data || [];
      setTenants(list);
      if (list.length > 0 && !selectedTenant) {
        setSelectedTenant(list[0]);
        setActiveColor(list[0].primaryColor || "#c5a04e");
      }
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaletteModal = (tenant: TenantItem) => {
    setSelectedTenant(tenant);
    setActiveColor(tenant.primaryColor || "#c5a04e");
    setPaletteModalOpen(true);
  };

  const handleSavePalette = async () => {
    if (!selectedTenant) return;
    setSavingPalette(true);
    try {
      await axios.patch(`/super-admin/tenants/${selectedTenant.id}/branding`, {
        primaryColor: activeColor,
      });

      // Immediately apply to DOM
      applyThemePalette(activeColor);

      // Update local state
      setTenants((prev) =>
        prev.map((t) =>
          t.id === selectedTenant.id ? { ...t, primaryColor: activeColor } : t
        )
      );

      setPaletteModalOpen(false);
      alert(`✅ Theme palette updated for ${selectedTenant.name}! Applied everywhere.`);
    } catch {
      alert("Failed to update theme palette.");
    } finally {
      setSavingPalette(false);
    }
  };

  const handleOpenModulesModal = (tenant: TenantItem) => {
    setSelectedTenant(tenant);
    const modMap: Record<string, boolean> = {
      REALTY_SALES: true,
      REALTY_CP_PORTAL: false,
      ATTENDANCE: false,
      CONSTRUCTION_ERP: false,
    };
    if (tenant.modules && tenant.modules.length > 0) {
      tenant.modules.forEach((m) => {
        modMap[m.moduleCode] = m.enabled;
      });
    }
    setTenantModulesState(modMap);
    setModulesModalOpen(true);
  };

  const handleSaveModules = async () => {
    if (!selectedTenant) return;
    setSavingModules(true);
    try {
      const payload = Object.entries(tenantModulesState).map(([moduleCode, enabled]) => ({
        moduleCode,
        enabled,
      }));
      await axios.patch(`/super-admin/tenants/${selectedTenant.id}/modules`, {
        modules: payload,
      });
      setTenants((prev) =>
        prev.map((t) =>
          t.id === selectedTenant.id
            ? {
                ...t,
                modules: payload,
              }
            : t
        )
      );
      setModulesModalOpen(false);
      alert(`✅ Feature modules updated for ${selectedTenant.name}!`);
    } catch {
      alert("Failed to update modules.");
    } finally {
      setSavingModules(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantData.name || !newTenantData.slug || !newTenantData.adminUsername) {
      alert("Please fill in company name, slug, and director username.");
      return;
    }
    setCreatingTenant(true);
    try {
      await axios.post("/super-admin/tenants", newTenantData);
      setCreateModalOpen(false);
      setNewTenantData({
        name: "",
        slug: "",
        plan: "enterprise",
        gstin: "27AABCM9876K1Z9",
        stateCode: "27",
        primaryColor: "#2563eb",
        tagline: "Premier Infrastructure & Commercial EPC",
        adminUsername: "director",
        adminEmail: "director@builderp.in",
        adminPassword: "Password123!",
      });
      fetchTenants();
      alert("🎉 New tenant successfully provisioned with roles, masters, and admin account!");
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to create tenant.");
    } finally {
      setCreatingTenant(false);
    }
  };

  const handleImpersonate = async (tenantId: number) => {
    try {
      const res = await axios.post(`/super-admin/tenants/${tenantId}/impersonate`);
      const token = res.data?.data?.accessToken;
      const targetTenant = res.data?.data?.tenant;

      if (token) {
        window.localStorage.setItem("authToken", token);
        if (targetTenant?.primaryColor) {
          applyThemePalette(targetTenant.primaryColor);
        }
        window.location.href = "/dashboards";
      }
    } catch {
      alert("Failed to switch workspace.");
    }
  };

  const previewShades = generateShades(activeColor);
  const { user } = useAuthContext();
  const roleCode = typeof user?.role === "string" ? user.role : user?.role?.code;
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name || user?.role?.code;
  const isSuperAdmin = roleCode === "super_admin";

  if (!loading && !isSuperAdmin) {
    return (
      <Page title="SuperAdmin Access Required">
        <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-sm max-w-lg mx-auto text-center space-y-4 my-12">
          <div className="size-16 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <BuildingOfficeIcon className="size-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-dark-100">
            Platform SuperAdmin Access Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-dark-400 leading-relaxed">
            You are currently signed in as <strong>{user?.fullName}</strong> with role{" "}
            <span className="font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
              {roleName}
            </span>. The tenant management and brand theming console is restricted to SaaS Platform Super Administrators.
          </p>
          <div className="pt-3 border-t border-slate-100 dark:border-dark-700 flex flex-col gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Login as superadmin / superadmin123 to access this portal
            </span>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="SaaS SuperAdmin & Theming Engine">
      <div className="flex flex-col gap-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                Master Platform Control
              </span>
              <span className="text-xs text-slate-400 font-mono">BuildERP v1.4</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-dark-100 mt-1">
              Multi-Tenant Organizations &amp; Palettes
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
              Manage developer tenants, configure customized brand colors, and control tenant workspace settings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTenants}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-dark-200 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-700 transition"
              title="Refresh Tenants"
            >
              <ArrowPathIcon className="size-5" />
            </button>
            <Button
              color="primary"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md"
            >
              <PlusIcon className="size-4" /> Onboard Developer Tenant
            </Button>
          </div>
        </div>

        {/* Global Platform Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tenants</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-dark-100 mt-1">
                {tenants.length}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <BuildingOfficeIcon className="size-5" />
            </div>
          </Card>

          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Construction Sites</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-dark-100 mt-1">
                {tenants.reduce((acc, t) => acc + (t.metrics?.sitesCount || 0), 0)}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPinIcon className="size-5" />
            </div>
          </Card>

          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Provisioned Users</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-dark-100 mt-1">
                {tenants.reduce((acc, t) => acc + (t.metrics?.usersCount || 0), 0)}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <UserGroupIcon className="size-5" />
            </div>
          </Card>

          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Orders Issued</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-dark-100 mt-1">
                {tenants.reduce((acc, t) => acc + (t.metrics?.posCount || 0), 0)}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DocumentCheckIcon className="size-5" />
            </div>
          </Card>
        </div>

        {/* Tenant Cards List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-dark-100 uppercase tracking-wider">
              Onboarded Builder Organizations ({tenants.length})
            </h3>
            <span className="text-xs text-slate-400">
              Click &quot;Theme &amp; Palette&quot; to change brand colors in real time
            </span>
          </div>

          {loading ? (
            <TableSkeleton rows={3} columns={5} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="size-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-sm shrink-0"
                        style={{ backgroundColor: tenant.primaryColor || "#c5a04e" }}
                      >
                        {tenant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-slate-900 dark:text-dark-100">
                            {tenant.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {tenant.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
                          {tenant.tagline || "Builders & Developers"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded">
                            <GlobeAltIcon className="size-3.5" />
                            {tenant.slug}.builderp.in
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded uppercase">
                            GSTIN: {tenant.gstin || "URP"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge color="primary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                      {tenant.plan}
                    </Badge>
                  </div>

                  {/* Brand Color Swatch Preview */}
                  <div className="p-3 bg-slate-50 dark:bg-dark-750 rounded-xl border border-slate-100 dark:border-dark-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-7 rounded-xl shadow-inner border border-white dark:border-dark-600 shrink-0"
                        style={{ backgroundColor: tenant.primaryColor }}
                      />
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-dark-200 block text-xs">
                          Brand Theme Color
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {tenant.primaryColor}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-dark-100">
                          {tenant.metrics?.sitesCount || 0}
                        </span>{" "}
                        Sites
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-dark-100">
                          {tenant.metrics?.usersCount || 0}
                        </span>{" "}
                        Users
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-dark-100">
                          {tenant.metrics?.posCount || 0}
                        </span>{" "}
                        POs
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-dark-700">
                    <Button
                      onClick={() => handleOpenModulesModal(tenant)}
                      variant="outlined"
                      className="text-xs flex items-center gap-1.5 py-1.5 px-3"
                    >
                      <SparklesIcon className="size-4" /> Modules
                    </Button>
                    <Button
                      onClick={() => handleOpenPaletteModal(tenant)}
                      variant="outlined"
                      className="text-xs flex items-center gap-1.5 py-1.5 px-3"
                    >
                      <PaintBrushIcon className="size-4" /> Theme &amp; Palette
                    </Button>
                    <Button
                      color="primary"
                      onClick={() => handleImpersonate(tenant.id)}
                      className="text-xs flex items-center gap-1.5 py-1.5 px-3 font-semibold"
                      title="Switch to this tenant workspace"
                    >
                      <ArrowTopRightOnSquareIcon className="size-4" /> Open Workspace
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Modules Switch Modal */}
        {modulesModalOpen && selectedTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-6">
              <div className="flex items-start justify-between border-b pb-4 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                    <SparklesIcon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                      Feature Modules: {selectedTenant.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-dark-400">
                      Enable or disable application modules for this tenant organization.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModulesModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    code: "REALTY_SALES",
                    name: "Realty Sales & CRM",
                    desc: "Lead pipeline, site visits, booking forms, receipts entry, RERA cost sheets & sales masters.",
                  },
                  {
                    code: "REALTY_CP_PORTAL",
                    name: "Partner Portal (Channel Partners)",
                    desc: "Dedicated Channel Partner portal, protected leads tracking, commission ledgers & broker inventory access.",
                  },
                  {
                    code: "ATTENDANCE",
                    name: "Labour & Staff Attendance",
                    desc: "Biometric & geo-tagged daily attendance muster roll, contractor labour counts & wage logs.",
                  },
                  {
                    code: "CONSTRUCTION_ERP",
                    name: "Construction & Material ERP",
                    desc: "Material procurement, PO, GRN, store inventories, BoQ tracking, and contractor billing.",
                  },
                ].map((mod) => (
                  <div
                    key={mod.code}
                    className="flex items-start justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-750 gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-dark-100">
                        {mod.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
                        {mod.desc}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400 uppercase mt-1 inline-block">
                        {mod.code}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={tenantModulesState[mod.code] ?? true}
                        onChange={(e) =>
                          setTenantModulesState((prev) => ({
                            ...prev,
                            [mod.code]: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-dark-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-dark-700">
                <Button
                  variant="outlined"
                  onClick={() => setModulesModalOpen(false)}
                  disabled={savingModules}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onClick={handleSaveModules}
                  disabled={savingModules}
                >
                  {savingModules ? "Saving Changes..." : "Save Module Configuration"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Live Color Palette Customizer Modal */}
        {paletteModalOpen && selectedTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-2xl shadow-2xl overflow-hidden p-6 space-y-6">
              <div className="flex items-start justify-between border-b pb-4 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-2xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: activeColor }}
                  >
                    <PaintBrushIcon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                      Configure Theme Palette: {selectedTenant.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-dark-400">
                      Select a curated architectural preset or define a custom primary brand hex.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPaletteModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
                >
                  &times;
                </button>
              </div>

              {/* Curated Presets Grid */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-dark-300 uppercase tracking-wider block">
                  Curated Developer Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = activeColor.toLowerCase() === preset.primaryColor.toLowerCase();
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setActiveColor(preset.primaryColor)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                          isSelected
                            ? "border-slate-900 dark:border-white ring-2 ring-primary-500 bg-slate-50 dark:bg-dark-700"
                            : "border-slate-200 dark:border-dark-700 hover:border-slate-400"
                        }`}
                      >
                        <div
                          className="size-6 rounded-lg shadow-sm shrink-0"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-dark-100 truncate">
                            {preset.name}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {preset.primaryColor}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Hex Picker Input */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-750 border border-slate-200 dark:border-dark-700 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-dark-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Custom Primary Color</span>
                  <span className="font-mono text-slate-400">{activeColor}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => setActiveColor(e.target.value)}
                    className="size-11 rounded-xl cursor-pointer border border-slate-300 dark:border-dark-600 bg-transparent"
                  />
                  <Input
                    value={activeColor}
                    onChange={(e) => setActiveColor(e.target.value)}
                    placeholder="#c5a04e"
                    className="font-mono text-sm uppercase flex-1"
                  />
                </div>
              </div>

              {/* Live Real-Time Component Preview */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-dark-300 uppercase tracking-wider flex items-center gap-1.5">
                    <SparklesIcon className="size-4 text-amber-500" /> Live Component Preview
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Instant rendering check
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-dark-800 rounded-xl">
                  {/* Primary Button Preview */}
                  <button
                    className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-md transition flex items-center gap-1.5"
                    style={{ backgroundColor: previewShades[600] }}
                  >
                    <PlusIcon className="size-4" /> Add Item
                  </button>

                  {/* Outlined Button Preview */}
                  <button
                    className="px-4 py-2 text-xs font-bold rounded-lg border transition"
                    style={{
                      borderColor: previewShades[600],
                      color: previewShades[600],
                    }}
                  >
                    Outlined Button
                  </button>

                  {/* Badge Preview */}
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: previewShades[100],
                      color: previewShades[800],
                    }}
                  >
                    Status: Active Site
                  </span>

                  {/* Active Tab Preview */}
                  <div
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: previewShades[700] }}
                  >
                    Active Tab
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-dark-700">
                <Button
                  variant="outlined"
                  onClick={() => setPaletteModalOpen(false)}
                  disabled={savingPalette}
                >
                  Cancel
                </Button>
                <button
                  onClick={handleSavePalette}
                  disabled={savingPalette}
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition flex items-center gap-1.5"
                  style={{ backgroundColor: previewShades[600] }}
                >
                  <CheckBadgeIcon className="size-4" />
                  {savingPalette ? "Applying Palette..." : "Save & Apply Everywhere"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onboard New Tenant Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-xl shadow-2xl overflow-hidden p-6 space-y-5">
              <div className="flex items-start justify-between border-b pb-3 dark:border-dark-700">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                    <BuildingOfficeIcon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                      Onboard New Developer Organization
                    </h3>
                    <p className="text-xs text-slate-500">
                      Provisions dedicated tenant schema, roles, and administrative login.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-dark-200 mb-1 block">
                      Company Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Apex Infrastructure Developers"
                      value={newTenantData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const autoSlug = name
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "")
                          .slice(0, 15);
                        setNewTenantData({
                          ...newTenantData,
                          name,
                          slug: newTenantData.slug || autoSlug,
                        });
                      }}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-dark-200 mb-1 block">
                      Subdomain Slug *
                    </label>
                    <div className="flex items-center">
                      <Input
                        required
                        placeholder="apex"
                        value={newTenantData.slug}
                        onChange={(e) =>
                          setNewTenantData({
                            ...newTenantData,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                          })
                        }
                        className="font-mono"
                      />
                      <span className="text-[11px] text-slate-400 font-mono ml-2">.builderp.in</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-dark-200 mb-1 block">
                      GSTIN (Optional)
                    </label>
                    <Input
                      placeholder="27AABCM9876K1Z9"
                      value={newTenantData.gstin}
                      onChange={(e) => setNewTenantData({ ...newTenantData, gstin: e.target.value })}
                      className="font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-dark-200 mb-1 block">
                      Subscription Plan
                    </label>
                    <select
                      value={newTenantData.plan}
                      onChange={(e) => setNewTenantData({ ...newTenantData, plan: e.target.value })}
                      className="w-full text-xs rounded-xl border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2.5 font-medium"
                    >
                      <option value="enterprise">Enterprise Tier (Unlimited Sites &amp; Users)</option>
                      <option value="growth">Growth Tier (Up to 10 Sites)</option>
                      <option value="starter">Starter Tier (Up to 2 Sites)</option>
                    </select>
                  </div>
                </div>

                {/* Primary Theme Picker */}
                <div className="text-xs space-y-2">
                  <label className="font-bold text-slate-700 dark:text-dark-200 block">
                    Brand Theme Palette
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newTenantData.primaryColor}
                      onChange={(e) =>
                        setNewTenantData({ ...newTenantData, primaryColor: e.target.value })
                      }
                      className="size-10 rounded-xl cursor-pointer border bg-transparent"
                    />
                    <Input
                      value={newTenantData.primaryColor}
                      onChange={(e) =>
                        setNewTenantData({ ...newTenantData, primaryColor: e.target.value })
                      }
                      placeholder="#2563eb"
                      className="font-mono text-xs uppercase w-32"
                    />
                    <div className="flex items-center gap-2">
                      {THEME_PRESETS.slice(0, 4).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setNewTenantData({ ...newTenantData, primaryColor: p.primaryColor })
                          }
                          className="size-6 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: p.primaryColor }}
                          title={p.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Director Login Details */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-750 border border-slate-200 dark:border-dark-700 space-y-3 text-xs">
                  <span className="font-bold text-slate-700 dark:text-dark-200 uppercase tracking-wider block">
                    Initial Director Credentials
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 mb-1 block">Director Username *</label>
                      <Input
                        required
                        placeholder="director"
                        value={newTenantData.adminUsername}
                        onChange={(e) =>
                          setNewTenantData({ ...newTenantData, adminUsername: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 mb-1 block">Director Email *</label>
                      <Input
                        required
                        type="email"
                        placeholder="director@company.com"
                        value={newTenantData.adminEmail}
                        onChange={(e) =>
                          setNewTenantData({ ...newTenantData, adminEmail: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-500 mb-1 block">Temporary Password</label>
                    <Input
                      required
                      type="password"
                      value={newTenantData.adminPassword}
                      onChange={(e) =>
                        setNewTenantData({ ...newTenantData, adminPassword: e.target.value })
                      }
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-dark-700">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={creatingTenant}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={creatingTenant}
                    className="font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                  >
                    {creatingTenant ? "Provisioning..." : "Provision Tenant"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
