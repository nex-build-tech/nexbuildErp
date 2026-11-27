import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import axios from "@/utils/axios";
import {
  BuildingOfficeIcon,
  PlusIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  GlobeAmericasIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOffice2Icon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import {
  FormModal,
  FormSection,
  FormActions,
  FormInput,
  FormSelect,
  FormTextarea,
} from "../../realty/_shared/FormModal";

interface SiteItem {
  id: number;
  uuid: string;
  code: string;
  name: string;
  clientName?: string;
  companyId?: number | null;
  companyName?: string | null;
  companyCode?: string | null;
  address: string;
  city: string;
  stateCode: string;
  pincode?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  geofenceRadius?: number;
  status: "active" | "inactive" | "planning" | "on_hold" | "completed";
  startDate?: string;
  targetDate?: string;
  createdAt: string;
}

interface CompanyOption {
  id: number;
  name: string;
  code: string;
}

export default function SitesMaster() {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    companyId: "" as number | string,
    clientName: "",
    address: "",
    city: "Mumbai",
    stateCode: "27",
    pincode: "400051",
    latitude: "",
    longitude: "",
    geofenceRadius: 200,
    status: "active" as SiteItem["status"],
  });

  useEffect(() => {
    fetchSitesAndCompanies();
  }, []);

  const fetchSitesAndCompanies = async () => {
    setLoading(true);
    try {
      const [sitesRes, compRes] = await Promise.all([
        axios.get("/masters/sites"),
        axios.get("/realty/setup/companies").catch(() => ({ data: [] })),
      ]);

      const sList = sitesRes.data?.data || sitesRes.data || [];
      const cList = compRes.data?.data || compRes.data || [];

      setSites(Array.isArray(sList) ? sList : []);
      setCompanies(Array.isArray(cList) ? cList : []);
    } catch (err) {
      console.error("Failed to load sites & companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSite(null);
    setFormData({
      code: "",
      name: "",
      companyId: companies.length > 0 ? companies[0].id : "",
      clientName: "",
      address: "",
      city: "Mumbai",
      stateCode: "27",
      pincode: "400051",
      latitude: "",
      longitude: "",
      geofenceRadius: 200,
      status: "active",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (site: SiteItem) => {
    setEditingSite(site);
    setFormData({
      code: site.code,
      name: site.name,
      companyId: site.companyId || "",
      clientName: site.clientName || "",
      address: site.address || "",
      city: site.city || "Mumbai",
      stateCode: site.stateCode || "27",
      pincode: site.pincode || "",
      latitude: site.latitude ? String(site.latitude) : "",
      longitude: site.longitude ? String(site.longitude) : "",
      geofenceRadius: site.geofenceRadius || 200,
      status: site.status,
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (site: SiteItem) => {
    const nextStatus = site.status === "active" ? "inactive" : "active";
    try {
      await axios.patch(`/masters/sites/${site.id}`, { status: nextStatus });
      await fetchSitesAndCompanies();
    } catch (err: any) {
      alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        }));
        setDetectingGps(false);
      },
      (err) => {
        alert(`Could not fetch GPS location: ${err.message}`);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert("Site Name and Site Code are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        companyId: formData.companyId ? Number(formData.companyId) : null,
        clientName: formData.clientName.trim() || undefined,
        address: formData.address.trim(),
        city: formData.city,
        stateCode: formData.stateCode,
        pincode: formData.pincode,
        latitude: formData.latitude ? String(formData.latitude) : null,
        longitude: formData.longitude ? String(formData.longitude) : null,
        geofenceRadius: Number(formData.geofenceRadius) || 200,
        status: formData.status,
      };

      if (editingSite) {
        await axios.patch(`/masters/sites/${editingSite.id}`, payload);
      } else {
        await axios.post("/masters/sites", payload);
      }

      setModalOpen(false);
      await fetchSitesAndCompanies();
    } catch (err: any) {
      alert(`Save failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredSites = sites.filter((s) => {
    if (selectedCompanyId !== "all" && String(s.companyId) !== selectedCompanyId) {
      return false;
    }
    if (statusFilter !== "all" && s.status !== statusFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.companyName || "").toLowerCase().includes(q) ||
      (s.address || "").toLowerCase().includes(q) ||
      (s.city || "").toLowerCase().includes(q)
    );
  });

  const activeSitesCount = sites.filter((s) => s.status === "active").length;

  return (
    <Page title="Project Sites & Geofence Configuration">
      <div className="w-full space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-100 flex items-center gap-2.5">
              <BuildingOfficeIcon className="size-7 text-primary-600" />
              Project Sites & Geofence Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-400 mt-1">
              Configure construction projects, map them to parent operating companies, manage active status, and configure GPS geofence radiuses for Trushift attendance check-in.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Sites: {activeSitesCount} / {sites.length}
            </span>
            <Button
              variant="filled"
              color="primary"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 text-xs py-2"
            >
              <PlusIcon className="size-4" /> Add Site
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="size-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search site, code, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-100 font-medium"
              >
                <option value="all">🏢 All Parent Companies ({companies.length})</option>
                {companies.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-100 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="planning">Planning</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Sites Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              Loading projects and company mappings...
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              No project sites found matching criteria.
            </div>
          ) : (
            filteredSites.map((site) => {
              const hasGps = Boolean(site.latitude && site.longitude);
              return (
                <Card
                  key={site.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Code, Company Badge, Status Toggle */}
                    <div className="flex items-start justify-between gap-2 border-b pb-3 dark:border-dark-700">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            {site.code}
                          </span>
                          {site.companyName ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-900">
                              <BuildingOffice2Icon className="size-3" />
                              {site.companyName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No Company Mapped</span>
                          )}
                        </div>
                        <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-dark-100">
                          {site.name}
                        </h3>
                      </div>

                      {/* Status Badge */}
                      <button
                        onClick={() => handleToggleStatus(site)}
                        title="Click to toggle Active / Inactive"
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                          site.status === "active"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                            : "bg-slate-100 dark:bg-dark-700 text-slate-500 dark:text-dark-300 border-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {site.status === "active" ? (
                          <>
                            <CheckCircleIcon className="size-3.5 text-emerald-500" />
                            <span>ACTIVE</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="size-3.5 text-slate-400" />
                            <span className="uppercase">{site.status}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Address & City */}
                    <div className="text-xs text-slate-600 dark:text-dark-300 flex items-start gap-1.5">
                      <MapPinIcon className="size-4 shrink-0 text-slate-400 mt-0.5" />
                      <div>
                        <p className="line-clamp-2">{site.address || "Address pending"}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {site.city}, State: {site.stateCode} {site.pincode ? `• PIN: ${site.pincode}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Geofence & Location Box for Trushift Attendance */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-750 border border-slate-100 dark:border-dark-700">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-dark-200 flex items-center gap-1">
                          <GlobeAmericasIcon className="size-3.5 text-blue-500" />
                          Attendance Geofence
                        </span>
                        {hasGps ? (
                          <Badge color="info" className="text-[10px]">
                            {site.geofenceRadius || 200}m Radius
                          </Badge>
                        ) : (
                          <Badge color="warning" className="text-[10px]">
                            GPS Missing
                          </Badge>
                        )}
                      </div>

                      {hasGps ? (
                        <div className="text-[11px] font-mono text-slate-500 dark:text-dark-400 flex items-center justify-between">
                          <span>
                            {parseFloat(String(site.latitude)).toFixed(5)},{" "}
                            {parseFloat(String(site.longitude)).toFixed(5)}
                          </span>
                          <a
                            href={`https://maps.google.com/?q=${site.latitude},${site.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600 hover:underline inline-flex items-center gap-0.5 text-[10px]"
                          >
                            Map <ArrowTopRightOnSquareIcon className="size-2.5" />
                          </a>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                          Set latitude & longitude to enable geo-tagged employee attendance.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t dark:border-dark-700 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Site ID: #{site.id}
                    </span>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleOpenEdit(site)}
                      className="text-xs px-2.5 py-1 flex items-center gap-1"
                    >
                      <PencilSquareIcon className="size-3.5" /> Edit & Geofence
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal: Add or Edit Site */}
        {modalOpen && (
          <FormModal
            title={editingSite ? `Configure Site: ${editingSite.name}` : "Add Project Site"}
            subtitle="Map operating company, set active status, and define attendance geofence"
            icon={<BuildingOfficeIcon className="size-5" />}
            onClose={() => setModalOpen(false)}
            maxWidth="lg"
          >
            <form onSubmit={handleSave} className="space-y-5">
              <FormSection label="Company & Project Hierarchy">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="Parent Company / Legal Entity"
                    required
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  >
                    <option value="">-- Select Parent Company --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </FormSelect>

                  <FormSelect
                    label="Site Operational Status"
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as SiteItem["status"] })
                    }
                  >
                    <option value="active">Active (Attendance Open)</option>
                    <option value="inactive">Inactive</option>
                    <option value="planning">Planning</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </FormSelect>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Site / Project Name"
                    required
                    placeholder="e.g. Kings Nehru Nagar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <FormInput
                    label="Site Code (Unique)"
                    required
                    placeholder="e.g. SITE-KNN"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="font-mono uppercase"
                  />
                </div>
              </FormSection>

              <FormSection label="Address Details">
                <FormTextarea
                  label="Site Address"
                  rows={2}
                  placeholder="e.g. Nehru Nagar, Kurla East, Mumbai"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormInput
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <FormInput
                    label="State Code"
                    value={formData.stateCode}
                    onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  />
                  <FormInput
                    label="Pincode"
                    placeholder="400051"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
              </FormSection>

              <FormSection label="Trushift Attendance Geofence & GPS">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">GPS Coordinates for Attendance Radius:</span>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={detectingGps}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                    >
                      <MapPinIcon className="size-3.5" />
                      {detectingGps ? "Detecting GPS..." : "📍 Detect My Location"}
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                    When employees check in using the Trushift Attendance mobile app or portal, their device GPS is verified against this location within the set geofence radius.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormInput
                    label="Latitude (Decimal)"
                    type="number"
                    step="0.0000001"
                    placeholder="e.g. 19.0628000"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="font-mono text-xs"
                  />
                  <FormInput
                    label="Longitude (Decimal)"
                    type="number"
                    step="0.0000001"
                    placeholder="e.g. 72.8804000"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="font-mono text-xs"
                  />
                  <FormInput
                    label="Geofence Radius (Meters)"
                    type="number"
                    min="50"
                    max="5000"
                    placeholder="200"
                    value={formData.geofenceRadius}
                    onChange={(e) => setFormData({ ...formData, geofenceRadius: Number(e.target.value) })}
                    className="font-mono text-xs"
                  />
                </div>
              </FormSection>

              <FormActions>
                <Button variant="outlined" color="neutral" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="filled" color="primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingSite ? "Update Site Configuration" : "Create Site"}
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}
      </div>
    </Page>
  );
}
