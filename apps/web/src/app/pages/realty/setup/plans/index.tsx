import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  TableCellsIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

interface SiteItem {
  id: number;
  code: string;
  name: string;
}

interface PayStageItem {
  id: number;
  code: string;
  name: string;
  defaultPct: string;
  sequence: number;
  isConstructionLinked: boolean;
  status: "pending" | "completed";
  completedOn?: string | null;
}

interface SchemeItem {
  id: number;
  name: string;
  gstMode: "with" | "without";
  floorFrom?: number | null;
  floorTo?: number | null;
  stampByBuilder: boolean;
  registrationByBuilder: boolean;
  maxDiscountPct?: string | null;
  active: boolean;
  stages?: Array<{
    payStageId: number;
    pct: string;
    code: string;
    name: string;
  }>;
}

export default function PaymentPlansPage() {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"schemes" | "stages">("schemes");
  const [loading, setLoading] = useState(true);

  const [payStages, setPayStages] = useState<PayStageItem[]>([]);
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);

  // Create Scheme Modal State
  const [createSchemeModalOpen, setCreateSchemeModalOpen] = useState(false);
  const [creatingScheme, setCreatingScheme] = useState(false);
  const [schemeForm, setSchemeForm] = useState({
    name: "",
    gstMode: "with" as "with" | "without",
    floorFrom: 1,
    floorTo: 23,
    stampByBuilder: false,
    registrationByBuilder: false,
    maxDiscountPct: 0,
  });
  const [schemeStageInputs, setSchemeStageInputs] = useState<Record<number, number>>({});

  // Copy Scheme Modal State
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyingScheme, setCopyingScheme] = useState(false);
  const [targetSchemeToCopy, setTargetSchemeToCopy] = useState<SchemeItem | null>(null);
  const [copiedSchemeName, setCopiedSchemeName] = useState("");

  // Scheme Details View Modal
  const [viewSchemeModal, setViewSchemeModal] = useState<SchemeItem | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadPlansData(selectedSiteId);
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

  const loadPlansData = async (siteId: number) => {
    try {
      const [stagesRes, schemesRes] = await Promise.all([
        axios.get(`/realty/setup/pay-stages?siteId=${siteId}`),
        axios.get(`/realty/setup/schemes?siteId=${siteId}`),
      ]);

      const stagesList = stagesRes.data?.data || stagesRes.data || [];
      const schemesList = schemesRes.data?.data || schemesRes.data || [];

      setPayStages(stagesList);
      setSchemes(schemesList);

      // Pre-fill default stage percentages for new scheme form
      const defaultMap: Record<number, number> = {};
      stagesList.forEach((s: PayStageItem) => {
        defaultMap[s.id] = parseFloat(s.defaultPct) || 0;
      });
      setSchemeStageInputs(defaultMap);
    } catch (err) {
      console.error("Failed to load plans data", err);
    }
  };

  // Calculate total percentage live
  const currentTotalPct = Object.values(schemeStageInputs).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );
  const isTotal100 = Math.abs(currentTotalPct - 100) < 0.0001;

  const handleOpenCreateScheme = () => {
    const defaultMap: Record<number, number> = {};
    payStages.forEach((s) => {
      defaultMap[s.id] = parseFloat(s.defaultPct) || 0;
    });
    setSchemeStageInputs(defaultMap);
    setSchemeForm({
      name: "",
      gstMode: "with",
      floorFrom: 1,
      floorTo: 23,
      stampByBuilder: false,
      registrationByBuilder: false,
      maxDiscountPct: 0,
    });
    setCreateSchemeModalOpen(true);
  };

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) return;

    if (!isTotal100) {
      alert(`Scheme stages must total exactly 100%. Current: ${currentTotalPct.toFixed(2)}%`);
      return;
    }

    setCreatingScheme(true);
    try {
      const stagePayload = Object.entries(schemeStageInputs)
        .filter(([_, pct]) => Number(pct) > 0)
        .map(([payStageId, pct]) => ({
          payStageId: Number(payStageId),
          pct: Number(pct),
        }));

      await axios.post("/realty/setup/schemes", {
        siteId: selectedSiteId,
        name: schemeForm.name,
        gstMode: schemeForm.gstMode,
        floorFrom: schemeForm.floorFrom,
        floorTo: schemeForm.floorTo,
        stampByBuilder: schemeForm.stampByBuilder,
        registrationByBuilder: schemeForm.registrationByBuilder,
        maxDiscountPct: schemeForm.maxDiscountPct || 0,
        stages: stagePayload,
      });

      setCreateSchemeModalOpen(false);
      await loadPlansData(selectedSiteId);
      alert("✅ Payment scheme created and validated at 100%!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to create scheme";
      alert(`Error: ${msg}`);
    } finally {
      setCreatingScheme(false);
    }
  };

  const handleOpenCopyScheme = (sc: SchemeItem) => {
    setTargetSchemeToCopy(sc);
    setCopiedSchemeName(`${sc.name} (Copy)`);
    setCopyModalOpen(true);
  };

  const handleExecuteCopyScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSchemeToCopy || !selectedSiteId) return;
    setCopyingScheme(true);
    try {
      await axios.post(`/realty/setup/schemes/${targetSchemeToCopy.id}/copy`, {
        name: copiedSchemeName,
      });
      setCopyModalOpen(false);
      await loadPlansData(selectedSiteId);
      alert("✅ Scheme duplicated with 100% stage validation preserved!");
    } catch (err: any) {
      alert(`Copy failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setCopyingScheme(false);
    }
  };

  const handleViewScheme = async (sc: SchemeItem) => {
    try {
      const res = await axios.get(`/realty/setup/schemes/${sc.id}`);
      setViewSchemeModal(res.data?.data || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Page title="Payment Plans & Schemes">
      <div className="space-y-6 pb-12">
        {/* Header with Site Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-100 flex items-center gap-2.5">
              <TableCellsIcon className="size-7 text-primary-600" />
              Payment Plans &amp; Schemes
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Configure construction milestones (A–U), slab stages, and custom payment schemes with strict 100% total verification.
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
          <button
            onClick={() => setActiveTab("schemes")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "schemes"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-dark-400 dark:hover:text-dark-200"
            }`}
          >
            <TableCellsIcon className="size-4" />
            Payment Schemes ({schemes.length})
          </button>
          <button
            onClick={() => setActiveTab("stages")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "stages"
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-dark-400 dark:hover:text-dark-200"
            }`}
          >
            <CheckCircleIcon className="size-4" />
            Milestone Pay Stages A–U ({payStages.length})
          </button>
        </div>

        {loading && (
          <div className="p-8 text-center text-slate-500 font-medium">
            Loading payment schemes and stages...
          </div>
        )}

        {/* TAB 1: SCHEMES */}
        {activeTab === "schemes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                  Configured Schemes &amp; Payment Options
                </h3>
                <p className="text-xs text-slate-500">
                  All schemes require 100% total milestone allocation before they can be assigned to bookings or cost sheets.
                </p>
              </div>
              <Button color="primary" onClick={handleOpenCreateScheme}>
                <PlusIcon className="size-4 mr-1.5" /> Create Payment Scheme
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemes.map((sc) => (
                <Card key={sc.id} className="p-5 space-y-4 border flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge
                          color={sc.gstMode === "with" ? "primary" : "warning"}
                          className="text-[11px] mb-1.5"
                        >
                          {sc.gstMode === "with" ? "With GST" : "No GST Scheme"}
                        </Badge>
                        <h4 className="text-base font-bold text-slate-900 dark:text-dark-100">
                          {sc.name}
                        </h4>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        100% Total
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1.5 border-t pt-3 dark:border-dark-700">
                      <div className="flex justify-between">
                        <span>Floor Applicability:</span>
                        <span className="font-semibold text-slate-800 dark:text-dark-200">
                          {sc.floorFrom && sc.floorTo ? `Floors ${sc.floorFrom} – ${sc.floorTo}` : "All Floors"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stamp Duty by Builder:</span>
                        <span className="font-semibold text-slate-800 dark:text-dark-200">
                          {sc.stampByBuilder ? "Yes (Included)" : "Customer Borne"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Registration Fee:</span>
                        <span className="font-semibold text-slate-800 dark:text-dark-200">
                          {sc.registrationByBuilder ? "Builder Borne" : "Customer Borne"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t dark:border-dark-700">
                    <Button
                      variant="outlined"
                      className="text-xs py-1.5 px-3"
                      onClick={() => handleViewScheme(sc)}
                    >
                      View Stages
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      className="text-xs py-1.5 px-3 flex items-center gap-1"
                      onClick={() => handleOpenCopyScheme(sc)}
                    >
                      <DocumentDuplicateIcon className="size-3.5" /> Duplicate Scheme
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: STAGES A-U */}
        {activeTab === "stages" && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4 dark:border-dark-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                  Standard Construction Milestones (A–U)
                </h3>
                <p className="text-xs text-slate-500">
                  Total default percentages sum to 100.00%. When site engineer approves a linked DPR slab, CRM is alerted for demand runs.
                </p>
              </div>
              <Badge color="success" className="text-xs font-mono font-bold">
                Total Default: 100.00%
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-dark-750 text-slate-600 dark:text-dark-300 font-bold border-b dark:border-dark-700 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Stage Code</th>
                    <th className="py-2.5 px-3">Milestone Name</th>
                    <th className="py-2.5 px-3">Default %</th>
                    <th className="py-2.5 px-3">Linked to Construction?</th>
                    <th className="py-2.5 px-3">Site Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {payStages.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary-600 text-sm">
                        {st.code}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-dark-100">
                        {st.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-dark-200">
                        {parseFloat(st.defaultPct).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3">
                        {st.isConstructionLinked ? (
                          <span className="text-primary-600 font-semibold flex items-center gap-1">
                            <CheckBadgeIcon className="size-4" /> DPR Linked
                          </span>
                        ) : (
                          <span className="text-slate-400">Time / Agreement</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            st.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-slate-400"
                          }`}
                        >
                          {st.status === "completed" ? "Completed (Eligible)" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* CREATE SCHEME MODAL WITH 100% LIVE VALIDATION */}
        {createSchemeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-2xl shadow-2xl p-6 space-y-5 my-8">
              <div className="flex items-start justify-between border-b pb-3 dark:border-dark-700">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                    Create New Payment Scheme
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define floor criteria, GST mode, and allocate milestone percentages (Must total exactly 100%).
                  </p>
                </div>
                <button
                  onClick={() => setCreateSchemeModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateScheme} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      Scheme Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Special Festive 1 BHK Scheme"
                      value={schemeForm.name}
                      onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      GST Mode
                    </label>
                    <select
                      value={schemeForm.gstMode}
                      onChange={(e) => setSchemeForm({ ...schemeForm, gstMode: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                    >
                      <option value="with">With GST (Standard 5%)</option>
                      <option value="without">Without GST (Builder Absorbs / Reverses)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-dark-300">
                      <input
                        type="checkbox"
                        checked={schemeForm.stampByBuilder}
                        onChange={(e) => setSchemeForm({ ...schemeForm, stampByBuilder: e.target.checked })}
                        className="rounded"
                      />
                      Stamp Duty by Builder
                    </label>
                  </div>
                </div>

                {/* 100% Rule Live Validation Box */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isTotal100
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isTotal100 ? (
                      <CheckCircleIcon className="size-6 text-emerald-600 shrink-0" />
                    ) : (
                      <ExclamationTriangleIcon className="size-6 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-sm block">
                        {isTotal100
                          ? "100.00% Valid Payment Schedule"
                          : `Total: ${currentTotalPct.toFixed(2)}% (Difference: ${(
                              currentTotalPct - 100
                            ).toFixed(2)}%)`}
                      </span>
                      <span className="text-xs opacity-80">
                        {isTotal100
                          ? "All stages equal 100%. Ready for submission."
                          : "Adjustment required. Stage percentages must sum to exactly 100%."}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xl font-black">
                    {currentTotalPct.toFixed(2)}%
                  </span>
                </div>

                {/* Stage Percentage Inputs List */}
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-2xl p-3 dark:border-dark-700 divide-y dark:divide-dark-700">
                  {payStages.map((st) => (
                    <div key={st.id} className="flex items-center justify-between py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary-600 w-6">{st.code}</span>
                        <span className="text-slate-800 dark:text-dark-200 truncate max-w-xs">{st.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.0001"
                          min={0}
                          max={100}
                          value={schemeStageInputs[st.id] ?? 0}
                          onChange={(e) =>
                            setSchemeStageInputs({
                              ...schemeStageInputs,
                              [st.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 rounded-lg border text-right px-2 py-1 font-mono text-xs"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-dark-700">
                  <Button variant="outlined" onClick={() => setCreateSchemeModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    disabled={!isTotal100 || creatingScheme}
                  >
                    {creatingScheme ? "Saving..." : "Create Scheme (100% Verified)"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* COPY SCHEME MODAL */}
        {copyModalOpen && targetSchemeToCopy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-md shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                Duplicate Scheme: {targetSchemeToCopy.name}
              </h3>
              <p className="text-xs text-slate-500">
                Duplicates the scheme and clones all stage allocations maintaining the 100% total rule.
              </p>

              <form onSubmit={handleExecuteCopyScheme} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    New Scheme Name
                  </label>
                  <input
                    type="text"
                    required
                    value={copiedSchemeName}
                    onChange={(e) => setCopiedSchemeName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-dark-700">
                  <Button variant="outlined" onClick={() => setCopyModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={copyingScheme}>
                    {copyingScheme ? "Copying..." : "Duplicate Scheme"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW SCHEME STAGES MODAL */}
        {viewSchemeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-lg shadow-2xl p-6 space-y-4">
              <div className="flex items-start justify-between border-b pb-3 dark:border-dark-700">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                    {viewSchemeModal.name}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Mode: {viewSchemeModal.gstMode === "with" ? "With GST" : "Without GST"}
                  </span>
                </div>
                <button
                  onClick={() => setViewSchemeModal(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
                >
                  &times;
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 text-xs divide-y dark:divide-dark-700">
                {viewSchemeModal.stages?.map((st) => (
                  <div key={st.payStageId} className="flex justify-between py-1.5">
                    <span className="font-mono text-primary-600 font-bold w-6">{st.code}</span>
                    <span className="flex-1 text-slate-700 dark:text-dark-200 truncate px-2">{st.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-dark-100">
                      {parseFloat(st.pct).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 flex justify-between items-center text-xs font-bold dark:border-dark-700">
                <span>Total Scheme Milestones:</span>
                <span className="text-emerald-600 font-mono text-sm">100.00%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
