import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  Squares2X2Icon,
  TruckIcon,
  PlusIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface SiteItem {
  id: number;
  code: string;
  name: string;
}

interface PhaseItem {
  id: number;
  name: string;
  siteId: number;
}

interface WingItem {
  id: number;
  phaseId: number;
  name: string;
  totalFloors: number;
}

interface FloorItem {
  id: number;
  wingId: number;
  name: string;
  levelNo: number;
}

interface UnitItem {
  id: number;
  unitNo: string;
  status: string;
  carpetArea?: string;
  baseRate?: string;
  floorRiseRate?: string;
  plcAmount?: string;
}

interface ParkingSlotItem {
  id: number;
  slotNo: string;
  type: string;
  price: string;
  status: string;
}

interface UnitTypeItem {
  id: number;
  code: string;
  name: string;
  category: "RES" | "COM";
  defaultCarpetArea?: string | number;
}

export default function ProjectSetupWizardPage() {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"params" | "structure" | "units" | "parking" | "unitTypes">("params");
  const [loading, setLoading] = useState(true);

  // Settings State
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsData, setSettingsData] = useState({
    reraNo: "",
    launchDate: "",
    possessionDate: "",
    stampDutyPct: "6.0000",
    metroCessPct: "1.0000",
    registrationPct: "1.0000",
    registrationCap: "30000.00",
    interestRatePa: "12.0000",
    interestGraceDays: 10,
    gstRateUnderConstruction: "5.0000",
    holdHoursDefault: 48,
    cpTagValidityDays: 60,
    letterheadHtml: "",
    bankDetailsText: "",
  });

  // Structure Data
  const [phases, setPhases] = useState<PhaseItem[]>([]);
  const [wings, setWings] = useState<WingItem[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlotItem[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitTypeItem[]>([]);

  // Unit Type Modal
  const [unitTypeModalOpen, setUnitTypeModalOpen] = useState(false);
  const [creatingUnitType, setCreatingUnitType] = useState(false);
  const [unitTypeForm, setUnitTypeForm] = useState({
    code: "",
    name: "",
    category: "RES" as "RES" | "COM",
    defaultCarpetArea: 650,
  });

  // Structure Generator Modal
  const [bulkStructureModalOpen, setBulkStructureModalOpen] = useState(false);
  const [generatingStructure, setGeneratingStructure] = useState(false);
  const [structureForm, setStructureForm] = useState({
    phaseName: "Building 2",
    wingName: "Wing B",
    totalFloors: 23,
    groundFloor: true,
  });

  // Parking Generator Modal
  const [parkingModalOpen, setParkingModalOpen] = useState(false);
  const [generatingParking, setGeneratingParking] = useState(false);
  const [parkingForm, setParkingForm] = useState({
    type: "stilt" as const,
    prefix: "P-ST",
    from: 1,
    to: 20,
    price: 500000,
  });

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadSiteSetupData(selectedSiteId);
    }
  }, [selectedSiteId]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/masters/sites");
      const list = res.data?.data || res.data || [];
      setSites(list);
      if (list.length > 0) {
        setSelectedSiteId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load sites", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSiteSetupData = async (siteId: number) => {
    try {
      // 1. Settings
      try {
        const sRes = await axios.get(`/realty/setup/project-settings?siteId=${siteId}`);
        const data = sRes.data?.data?.settings || sRes.data?.settings;
        if (data) {
          setSettingsData({
            reraNo: data.reraNo || "",
            launchDate: data.launchDate ? data.launchDate.split("T")[0] : "",
            possessionDate: data.possessionDate ? data.possessionDate.split("T")[0] : "",
            stampDutyPct: data.stampDutyPct || "6.0000",
            metroCessPct: data.metroCessPct || "1.0000",
            registrationPct: data.registrationPct || "1.0000",
            registrationCap: data.registrationCap || "30000.00",
            interestRatePa: data.interestRatePa || "12.0000",
            interestGraceDays: data.interestGraceDays ?? 10,
            gstRateUnderConstruction: data.gstRateUnderConstruction || "5.0000",
            holdHoursDefault: data.holdHoursDefault ?? 48,
            cpTagValidityDays: data.cpTagValidityDays ?? 60,
            letterheadHtml: data.letterheadHtml || "",
            bankDetailsText: data.bankDetailsText || "",
          });
        }
      } catch {
        // If not found yet, keep default form
      }

      // 2. Phases & Wings & Floors
      const pRes = await axios.get(`/realty/setup/phases?siteId=${siteId}`);
      const pList = pRes.data?.data || pRes.data || [];
      setPhases(pList);

      const wRes = await axios.get("/realty/setup/wings");
      const wList = wRes.data?.data || wRes.data || [];
      setWings(wList);

      const flRes = await axios.get("/realty/setup/floors");
      setFloors(flRes.data?.data || flRes.data || []);

      // 3. Units
      const uRes = await axios.get(`/realty/setup/units?siteId=${siteId}`);
      setUnits(uRes.data?.data || uRes.data || []);

      // 4. Parking
      const pkRes = await axios.get(`/realty/setup/parking-slots?siteId=${siteId}`);
      setParkingSlots(pkRes.data?.data || pkRes.data || []);

      // 5. Unit Configurations Master
      try {
        const utRes = await axios.get("/realty/setup/unit-types");
        const utList = utRes.data?.data || utRes.data || [];
        setUnitTypes(Array.isArray(utList) ? utList : []);
      } catch (e) {
        console.error("Failed to load unit types", e);
      }
    } catch (err) {
      console.error("Error loading setup data", err);
    }
  };

  const handleCreateUnitType = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUnitType(true);
    try {
      await axios.post("/realty/setup/unit-types", unitTypeForm);
      setUnitTypeModalOpen(false);
      setUnitTypeForm({ code: "", name: "", category: "RES", defaultCarpetArea: 650 });
      const utRes = await axios.get("/realty/setup/unit-types");
      const utList = utRes.data?.data || utRes.data || [];
      setUnitTypes(Array.isArray(utList) ? utList : []);
      alert("✅ Unit Configuration created successfully!");
    } catch (err: any) {
      console.error("Failed to create unit configuration", err);
      alert(err.response?.data?.message || "Failed to create unit configuration");
    } finally {
      setCreatingUnitType(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) return;
    setSavingSettings(true);
    try {
      await axios.post("/realty/setup/project-settings", {
        siteId: selectedSiteId,
        ...settingsData,
        launchDate: settingsData.launchDate ? new Date(settingsData.launchDate) : null,
        possessionDate: settingsData.possessionDate ? new Date(settingsData.possessionDate) : null,
      });
      alert("✅ Project settings saved successfully!");
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save project settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) return;
    setGeneratingStructure(true);
    try {
      await axios.post("/realty/setup/bulk-structure", {
        siteId: selectedSiteId,
        ...structureForm,
      });
      setBulkStructureModalOpen(false);
      await loadSiteSetupData(selectedSiteId);
      alert("✅ Phase, Wing, and Floors generated successfully!");
    } catch (err) {
      console.error("Failed to generate structure", err);
      alert("Failed to generate structure.");
    } finally {
      setGeneratingStructure(false);
    }
  };

  const handleGenerateParking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) return;
    setGeneratingParking(true);
    try {
      await axios.post("/realty/setup/bulk-parking-slots", {
        siteId: selectedSiteId,
        ...parkingForm,
      });
      setParkingModalOpen(false);
      await loadSiteSetupData(selectedSiteId);
      alert("✅ Parking slots created!");
    } catch (err) {
      console.error("Failed to generate parking", err);
      alert("Failed to generate parking slots.");
    } finally {
      setGeneratingParking(false);
    }
  };

  return (
    <Page title="Project Setup Wizard">
      <div className="space-y-6 pb-12">
        {/* Header with Site Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-100 flex items-center gap-2.5">
              <WrenchScrewdriverIcon className="size-7 text-primary-600" />
              Project Setup Wizard
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Configure RERA compliance, statutory tax parameters, wing elevations, inventory generator, and parking bays.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600 dark:text-dark-300 uppercase tracking-wider">
              Site / Project:
            </label>
            <select
              value={selectedSiteId || ""}
              onChange={(e) => setSelectedSiteId(Number(e.target.value))}
              className="rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-dark-100 shadow-xs focus:ring-2 focus:ring-primary-500"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-700">
          {[
            { id: "params", label: "Project & Tax Parameters", icon: BuildingOfficeIcon },
            { id: "structure", label: "Phases, Wings & Floors", icon: Squares2X2Icon },
            { id: "unitTypes", label: `Unit Configurations (${unitTypes.length})`, icon: TagIcon },
            { id: "units", label: `Units Inventory (${units.length})`, icon: Squares2X2Icon },
            { id: "parking", label: `Parking Slots (${parkingSlots.length})`, icon: TruckIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-dark-400 dark:hover:text-dark-200"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="p-8 text-center text-slate-500 font-medium">
            Loading project setup data...
          </div>
        )}

        {/* TAB 1: PARAMS */}
        {activeTab === "params" && (
          <Card className="p-6">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="border-b pb-3 dark:border-dark-700">
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                  RERA, Statutory Tax &amp; Calculation Rules
                </h3>
                <p className="text-xs text-slate-500 dark:text-dark-400">
                  These rates drive all auto-generated cost sheets, demands, receipts, and stamp duty calculations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    MahaRERA Registration No.
                  </label>
                  <input
                    type="text"
                    value={settingsData.reraNo}
                    onChange={(e) => setSettingsData({ ...settingsData, reraNo: e.target.value })}
                    placeholder="e.g. P51800028471"
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Official Launch Date
                  </label>
                  <input
                    type="date"
                    value={settingsData.launchDate}
                    onChange={(e) => setSettingsData({ ...settingsData, launchDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Target Possession Date
                  </label>
                  <input
                    type="date"
                    value={settingsData.possessionDate}
                    onChange={(e) => setSettingsData({ ...settingsData, possessionDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Stamp Duty (%)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settingsData.stampDutyPct}
                    onChange={(e) => setSettingsData({ ...settingsData, stampDutyPct: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Metro Cess (%)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settingsData.metroCessPct}
                    onChange={(e) => setSettingsData({ ...settingsData, metroCessPct: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Registration Cap (₹ Max)
                  </label>
                  <input
                    type="number"
                    value={settingsData.registrationCap}
                    onChange={(e) => setSettingsData({ ...settingsData, registrationCap: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Delayed Payment Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settingsData.interestRatePa}
                    onChange={(e) => setSettingsData({ ...settingsData, interestRatePa: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Interest Grace Days
                  </label>
                  <input
                    type="number"
                    value={settingsData.interestGraceDays}
                    onChange={(e) => setSettingsData({ ...settingsData, interestGraceDays: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    GST on Under-Construction (%)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={settingsData.gstRateUnderConstruction}
                    onChange={(e) => setSettingsData({ ...settingsData, gstRateUnderConstruction: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                  Bank Details for Demands &amp; Letters
                </label>
                <textarea
                  rows={2}
                  value={settingsData.bankDetailsText}
                  onChange={(e) => setSettingsData({ ...settingsData, bankDetailsText: e.target.value })}
                  placeholder="e.g. Kings Real Estate LLP - HDFC Bank A/C: 50200084729104, IFSC: HDFC0000128"
                  className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end pt-4 border-t dark:border-dark-700">
                <Button color="primary" type="submit" disabled={savingSettings}>
                  {savingSettings ? "Saving Settings..." : "Save Project Settings"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: STRUCTURE */}
        {activeTab === "structure" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-dark-100">
                  Phases, Wings &amp; Floor Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Manage the architectural hierarchy of this project site.
                </p>
              </div>
              <Button color="primary" onClick={() => setBulkStructureModalOpen(true)}>
                <PlusIcon className="size-4 mr-1.5" /> Bulk Structure Generator
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wings.map((w) => {
                const wingFloors = floors.filter((f) => f.wingId === w.id);
                return (
                  <Card key={w.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge color="primary" className="mb-1 text-[11px]">
                          {phases.find((p) => p.id === w.phaseId)?.name || "Phase Building"}
                        </Badge>
                        <h4 className="text-base font-bold text-slate-900 dark:text-dark-100">{w.name}</h4>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 dark:bg-dark-700 rounded-lg font-bold">
                        {w.totalFloors} Floors
                      </span>
                    </div>

                    <div className="border-t pt-3 dark:border-dark-700 text-xs text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Configured Floors:</span>
                        <span className="font-bold text-slate-900 dark:text-dark-100">{wingFloors.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ground Floor:</span>
                        <span className="font-semibold text-emerald-600">Yes (Level 0)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Units Linked:</span>
                        <span className="font-bold text-slate-900 dark:text-dark-100">
                          {units.filter((u: any) => u.wingId === w.id).length} units
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: UNIT TYPES MASTER */}
        {activeTab === "unitTypes" && (
          <Card className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 dark:border-dark-700">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                  <TagIcon className="size-5 text-primary-600" />
                  Unit Configurations Master ({unitTypes.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
                  Standard apartment types, commercial units, typologies, and baseline carpet areas.
                </p>
              </div>
              <Button color="primary" onClick={() => setUnitTypeModalOpen(true)}>
                <PlusIcon className="size-4 mr-1.5" /> Add Unit Configuration
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-dark-750 text-slate-600 dark:text-dark-300 font-bold border-b dark:border-dark-700 uppercase">
                  <tr>
                    <th className="py-3 px-4">Configuration Code</th>
                    <th className="py-3 px-4">Typology / Display Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Default Carpet Area</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {unitTypes.map((ut) => (
                    <tr key={ut.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-dark-100">
                        {ut.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-dark-200">
                        {ut.name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={ut.category === "RES" ? "primary" : "warning"}>
                          {ut.category === "RES" ? "Residential" : "Commercial"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {ut.defaultCarpetArea ? `${ut.defaultCarpetArea} sq ft` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Active Master
                        </span>
                      </td>
                    </tr>
                  ))}
                  {unitTypes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No unit configurations found. Click &quot;Add Unit Configuration&quot; above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: UNITS */}
        {activeTab === "units" && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4 dark:border-dark-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                  Inventory Units Master
                </h3>
                <p className="text-xs text-slate-500">
                  Total {units.length} units configured for this site.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color="success">
                  {units.filter((u) => u.status === "available").length} Available
                </Badge>
                <Badge color="warning">
                  {units.filter((u) => u.status === "hold").length} On Hold
                </Badge>
                <Badge color="primary">
                  {units.filter((u) => u.status === "booked").length} Booked
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-dark-750 text-slate-600 dark:text-dark-300 font-bold border-b dark:border-dark-700 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Unit No</th>
                    <th className="py-2.5 px-3">Carpet Area</th>
                    <th className="py-2.5 px-3">Base Rate</th>
                    <th className="py-2.5 px-3">Floor Rise</th>
                    <th className="py-2.5 px-3">PLC</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {units.slice(0, 30).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-dark-100">
                        {u.unitNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{u.carpetArea || "—"} sq ft</td>
                      <td className="py-2.5 px-3 font-mono">₹{u.baseRate || "26,250"}</td>
                      <td className="py-2.5 px-3 font-mono">₹{u.floorRiseRate || "0"}</td>
                      <td className="py-2.5 px-3 font-mono">₹{u.plcAmount || "0"}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.status === "available"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : u.status === "hold"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {units.length > 30 && (
                <p className="text-center text-xs text-slate-400 py-3 border-t dark:border-dark-700">
                  Showing first 30 of {units.length} total units. View complete inventory in the elevation grid.
                </p>
              )}
            </div>
          </Card>
        )}

        {/* TAB 4: PARKING */}
        {activeTab === "parking" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-dark-100">
                  Parking Bays ({parkingSlots.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Configured stilt, open, and podium parking bays.
                </p>
              </div>
              <Button color="primary" onClick={() => setParkingModalOpen(true)}>
                <PlusIcon className="size-4 mr-1.5" /> Batch Generate Parking
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {parkingSlots.map((pk) => (
                <Card key={pk.id} className="p-3.5 text-center space-y-1.5 border">
                  <span className="font-mono text-sm font-bold block text-slate-900 dark:text-dark-100">
                    {pk.slotNo}
                  </span>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">{pk.type}</span>
                  <span className="font-mono text-xs font-semibold text-slate-600 dark:text-dark-300 block">
                    ₹{(Number(pk.price) / 100000).toFixed(1)} Lakh
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      pk.status === "available"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {pk.status}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Structure Generator Modal */}
        {bulkStructureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-md shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                Bulk Structure Generator
              </h3>
              <p className="text-xs text-slate-500">
                Quickly create Phase, Wing, and auto-generate Ground + N floors.
              </p>

              <form onSubmit={handleCreateStructure} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Phase Name
                  </label>
                  <input
                    type="text"
                    required
                    value={structureForm.phaseName}
                    onChange={(e) => setStructureForm({ ...structureForm, phaseName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Wing Name
                  </label>
                  <input
                    type="text"
                    required
                    value={structureForm.wingName}
                    onChange={(e) => setStructureForm({ ...structureForm, wingName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Total Residential Floors
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={structureForm.totalFloors}
                    onChange={(e) => setStructureForm({ ...structureForm, totalFloors: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-dark-700">
                  <Button variant="outlined" onClick={() => setBulkStructureModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={generatingStructure}>
                    {generatingStructure ? "Generating..." : "Generate Structure"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Parking Generator Modal */}
        {parkingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-md shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                Batch Generate Parking Bays
              </h3>
              <form onSubmit={handleGenerateParking} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Parking Type
                  </label>
                  <select
                    value={parkingForm.type}
                    onChange={(e) => setParkingForm({ ...parkingForm, type: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                  >
                    <option value="stilt">Stilt Parking</option>
                    <option value="open">Open Parking</option>
                    <option value="podium">Podium Parking</option>
                    <option value="basement">Basement Parking</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      Prefix
                    </label>
                    <input
                      type="text"
                      value={parkingForm.prefix}
                      onChange={(e) => setParkingForm({ ...parkingForm, prefix: e.target.value })}
                      className="w-full rounded-xl border px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      From #
                    </label>
                    <input
                      type="number"
                      value={parkingForm.from}
                      onChange={(e) => setParkingForm({ ...parkingForm, from: Number(e.target.value) })}
                      className="w-full rounded-xl border px-3 py-1.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      To #
                    </label>
                    <input
                      type="number"
                      value={parkingForm.to}
                      onChange={(e) => setParkingForm({ ...parkingForm, to: Number(e.target.value) })}
                      className="w-full rounded-xl border px-3 py-1.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Standard Price (₹)
                  </label>
                  <input
                    type="number"
                    value={parkingForm.price}
                    onChange={(e) => setParkingForm({ ...parkingForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border px-3 py-2 text-sm font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-dark-700">
                  <Button variant="outlined" onClick={() => setParkingModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={generatingParking}>
                    {generatingParking ? "Creating..." : "Create Parking Slots"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Unit Type Create Modal */}
        {unitTypeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-md shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-dark-700">
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                  <TagIcon className="size-5 text-primary-600" />
                  Add Unit Configuration Master
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Define standard unit typology used across inventory, pricing, cost sheets, and floor plans.
              </p>

              <form onSubmit={handleCreateUnitType} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Configuration Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2BHK-720 or 3BHK-LUX"
                    value={unitTypeForm.code}
                    onChange={(e) => setUnitTypeForm({ ...unitTypeForm, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 BHK Premium East Facing"
                    value={unitTypeForm.name}
                    onChange={(e) => setUnitTypeForm({ ...unitTypeForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      Category
                    </label>
                    <select
                      value={unitTypeForm.category}
                      onChange={(e) => setUnitTypeForm({ ...unitTypeForm, category: e.target.value as "RES" | "COM" })}
                      className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-sm"
                    >
                      <option value="RES">Residential</option>
                      <option value="COM">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      Carpet Area (sq ft)
                    </label>
                    <input
                      type="number"
                      required
                      min={50}
                      step="0.01"
                      value={unitTypeForm.defaultCarpetArea}
                      onChange={(e) => setUnitTypeForm({ ...unitTypeForm, defaultCarpetArea: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-dark-700">
                  <Button variant="outlined" onClick={() => setUnitTypeModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={creatingUnitType}>
                    {creatingUnitType ? "Saving..." : "Save Configuration"}
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
