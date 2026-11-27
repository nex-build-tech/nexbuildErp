import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  BriefcaseIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSite, setFilterSite] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // View modal state
  const [selectedWo, setSelectedWo] = useState<any | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Create WO modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWo, setNewWo] = useState({
    contractorId: "",
    siteId: "",
    title: "",
    contractType: "item_rate",
    retentionPercent: "5.00",
    tdsPercent: "1.00",
    startDate: new Date().toISOString().split("T")[0],
    completionDate: "",
    scopeOfWork: "",
    terms: "Retention: 5% released post 6 months DLP. TDS 1% u/s 194C deducted on gross bills.",
    items: [
      { itemCode: "BOQ-01", description: "M25 Grade Ready Mix Concrete with pumping", unitCode: "CUM", estimatedQty: 50, rate: 2150 },
    ],
  });

  useEffect(() => {
    fetchWorkOrders();
    fetchMetadata();
  }, []);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/contractors-billing/work-orders");
      setWorkOrders(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching work orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [cRes, sRes, uRes] = await Promise.all([
        axios.get("/masters/contractors"),
        axios.get("/masters/sites"),
        axios.get("/masters/units"),
      ]);
      const fetchedContractors = cRes.data?.data || [];
      const fetchedSites = sRes.data?.data || [];
      setContractors(fetchedContractors);
      setSites(fetchedSites);
      setUnits(uRes.data?.data || []);
      if (fetchedContractors.length > 0) {
        setNewWo((prev) => ({ ...prev, contractorId: String(fetchedContractors[0].id) }));
      }
      if (fetchedSites.length > 0) {
        setNewWo((prev) => ({ ...prev, siteId: String(fetchedSites[0].id) }));
      }
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  };

  const openViewModal = async (id: number) => {
    try {
      const res = await axios.get(`/contractors-billing/work-orders/${id}`);
      setSelectedWo(res.data?.data);
      setShowViewModal(true);
    } catch (err) {
      console.error("Error loading WO details:", err);
    }
  };

  const addBoqItem = () => {
    const nextIdx = newWo.items.length + 1;
    setNewWo({
      ...newWo,
      items: [
        ...newWo.items,
        {
          itemCode: `BOQ-${String(nextIdx).padStart(2, "0")}`,
          description: "",
          unitCode: "SQFT",
          estimatedQty: 100,
          rate: 50,
        },
      ],
    });
  };

  const removeBoqItem = (idx: number) => {
    if (newWo.items.length <= 1) return;
    setNewWo({
      ...newWo,
      items: newWo.items.filter((_, i) => i !== idx),
    });
  };

  const updateBoqItem = (idx: number, field: string, val: any) => {
    const updated = [...newWo.items];
    updated[idx] = { ...updated[idx], [field]: val };
    setNewWo({ ...newWo, items: updated });
  };

  const calculateTotalContractValue = () => {
    return newWo.items.reduce((acc, it) => acc + (Number(it.estimatedQty) || 0) * (Number(it.rate) || 0), 0);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWo.contractorId || !newWo.siteId || !newWo.title) {
      alert("Please fill in contractor, project site and work order title.");
      return;
    }
    setCreating(true);
    try {
      await axios.post("/contractors-billing/work-orders", {
        contractorId: Number(newWo.contractorId),
        siteId: Number(newWo.siteId),
        title: newWo.title,
        contractType: newWo.contractType,
        contractValue: calculateTotalContractValue(),
        retentionPercent: Number(newWo.retentionPercent) || 5,
        tdsPercent: Number(newWo.tdsPercent) || 1,
        startDate: newWo.startDate,
        completionDate: newWo.completionDate || null,
        scopeOfWork: newWo.scopeOfWork,
        terms: newWo.terms,
        items: newWo.items.map((it) => ({
          itemCode: it.itemCode,
          description: it.description,
          unitCode: it.unitCode,
          estimatedQty: Number(it.estimatedQty) || 0,
          rate: Number(it.rate) || 0,
        })),
      });
      setShowCreateModal(false);
      fetchWorkOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create work order.");
    } finally {
      setCreating(false);
    }
  };

  // Filtered list
  const filteredWos = workOrders.filter((wo) => {
    const matchSearch =
      wo.woNumber?.toLowerCase().includes(search.toLowerCase()) ||
      wo.title?.toLowerCase().includes(search.toLowerCase()) ||
      wo.contractorName?.toLowerCase().includes(search.toLowerCase()) ||
      wo.siteName?.toLowerCase().includes(search.toLowerCase());
    const matchSite = filterSite === "ALL" || String(wo.siteId) === filterSite;
    const matchStatus = filterStatus === "ALL" || wo.status === filterStatus;
    return matchSearch && matchSite && matchStatus;
  });

  const totalContractSum = workOrders.reduce((sum, wo) => sum + (Number(wo.contractValue) || 0), 0);
  const activeWosCount = workOrders.filter((wo) => wo.status === "active").length;

  return (
    <Page title="Work Orders & Subcontracts">
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <BriefcaseIcon className="size-6 text-[#c5a04e]" />
              Subcontract Work Orders (BOQ)
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Issue item-rate or lump-sum subcontracts to civil, electrical, plumbing &amp; finishing trade contractors with standardized retention and TDS rules.
            </p>
          </div>
          <Button
            color="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium shadow-sm transition"
          >
            <PlusIcon className="size-5" />
            Issue Work Order
          </Button>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Contract Value</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-dark-100 mt-1">
                ₹{totalContractSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Approved Subcontracts</p>
            </div>
            <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-[#c5a04e]">
              <CurrencyRupeeIcon className="size-6" />
            </div>
          </Card>

          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Contracts</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-dark-100 mt-1">{activeWosCount}</h3>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Under site execution</p>
            </div>
            <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <ClipboardDocumentCheckIcon className="size-6" />
            </div>
          </Card>

          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Default Retention</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-dark-100 mt-1">5.00%</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Defect liability hold</p>
            </div>
            <div className="size-11 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
              <ClockIcon className="size-6" />
            </div>
          </Card>

          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TDS Section</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-dark-100 mt-1">194C (1.00%)</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Statutory compliance</p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <CheckCircleIcon className="size-6" />
            </div>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by WO #, title, contractor, or project site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border-slate-300 dark:border-dark-600"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-slate-700 dark:text-dark-200"
              >
                <option value="ALL">All Project Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-slate-700 dark:text-dark-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Work Orders Table */}
        <Card className="rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-dark-300">
              <thead className="bg-slate-50 dark:bg-dark-900 border-b border-slate-200 dark:border-dark-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">WO Number</th>
                  <th className="py-3 px-4">Title &amp; Scope</th>
                  <th className="py-3 px-4">Contractor</th>
                  <th className="py-3 px-4">Project Site</th>
                  <th className="py-3 px-4 text-right">Contract Value</th>
                  <th className="py-3 px-4 text-center">Retention / TDS</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading subcontract work orders...
                    </td>
                  </tr>
                ) : filteredWos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No subcontract work orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredWos.map((wo) => (
                    <tr key={wo.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-dark-100">
                        {wo.woNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-dark-100">{wo.title}</div>
                        <div className="text-xs text-slate-400 capitalize">{wo.contractType?.replace("_", " ")} &bull; {wo.itemCount || 0} BOQ Lines</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-dark-100">{wo.contractorName}</div>
                        <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300 font-medium capitalize mt-0.5">
                          {wo.contractorType || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-dark-200 flex items-center gap-1.5 pt-4">
                        <BuildingOfficeIcon className="size-4 text-slate-400" />
                        {wo.siteName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-dark-100">
                        ₹{Number(wo.contractValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs">
                        <span className="text-purple-600 font-medium">Ret: {Number(wo.retentionPercent)}%</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-emerald-600 font-medium">TDS: {Number(wo.tdsPercent)}%</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            wo.status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : wo.status === "completed"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                              : "bg-slate-100 text-slate-700 dark:bg-dark-700 dark:text-dark-300"
                          }`}
                        >
                          {wo.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          onClick={() => openViewModal(wo.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-slate-700 dark:text-dark-200 inline-flex items-center gap-1.5"
                        >
                          <EyeIcon className="size-3.5" />
                          View BOQ
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* MODAL 1: VIEW WORK ORDER & BOQ ITEMS */}
        {showViewModal && selectedWo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-dark-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-700 flex items-center justify-between bg-slate-50 dark:bg-dark-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-[#c5a04e]">
                    <BriefcaseIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-dark-100 text-lg">
                      {selectedWo.woNumber} &mdash; {selectedWo.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Contractor: <span className="font-semibold text-slate-800 dark:text-dark-200">{selectedWo.contractorName}</span> (PAN: {selectedWo.contractorPan || "N/A"}) &bull; Project: {selectedWo.siteName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                {/* Contract Summary Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-dark-750 border border-slate-200 dark:border-dark-700">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Total Contract Value</span>
                    <p className="text-base font-black text-slate-900 dark:text-dark-100 mt-0.5">
                      ₹{Number(selectedWo.contractValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Contract Type</span>
                    <p className="text-base font-bold text-slate-800 dark:text-dark-200 mt-0.5 capitalize">
                      {selectedWo.contractType?.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Retention Hold</span>
                    <p className="text-base font-bold text-purple-600 mt-0.5">
                      {Number(selectedWo.retentionPercent)}% of Gross
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">TDS u/s 194C</span>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">
                      {Number(selectedWo.tdsPercent)}% on Gross
                    </p>
                  </div>
                </div>

                {/* Scope of Work & Terms */}
                {selectedWo.scopeOfWork && (
                  <div>
                    <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-1">Scope of Work</h4>
                    <p className="p-3 bg-slate-50 dark:bg-dark-750 rounded-lg text-slate-700 dark:text-dark-300 text-xs leading-relaxed">
                      {selectedWo.scopeOfWork}
                    </p>
                  </div>
                )}

                {/* BOQ Schedule Items Table */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-dark-100 text-base mb-3 flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="size-5 text-[#c5a04e]" />
                    Bill of Quantities (BOQ Items)
                  </h4>
                  <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-dark-900 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-dark-700">
                        <tr>
                          <th className="py-2.5 px-3">Item Code</th>
                          <th className="py-2.5 px-3">Item Description / Work Schedule</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">Est. Qty</th>
                          <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right">Executed Qty</th>
                          <th className="py-2.5 px-3 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-dark-700">
                        {(selectedWo.items || []).map((it: any) => (
                          <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-dark-200">
                              {it.itemCode}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-dark-100">
                              {it.description}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-600 dark:text-dark-300">
                              {it.unitCode}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold">
                              {Number(it.estimatedQty).toLocaleString("en-IN", { minimumFractionDigits: 3 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium">
                              ₹{Number(it.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-blue-600">
                              {Number(it.executedQty).toLocaleString("en-IN", { minimumFractionDigits: 3 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-dark-100">
                              ₹{Number(it.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Terms and Signatures */}
                {selectedWo.terms && (
                  <div>
                    <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-1">Contract Terms &amp; Conditions</h4>
                    <p className="p-3 bg-slate-50 dark:bg-dark-750 rounded-lg text-slate-600 dark:text-dark-400 text-xs leading-relaxed">
                      {selectedWo.terms}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 flex justify-end">
                <Button
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2 text-sm rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-dark-700 text-slate-800 dark:text-dark-200 font-medium"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: ISSUE NEW WORK ORDER */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-dark-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-700 flex items-center justify-between bg-slate-50 dark:bg-dark-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-[#c5a04e]">
                    <PlusIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-dark-100 text-lg">
                      Issue Subcontract Work Order
                    </h3>
                    <p className="text-xs text-slate-500">
                      Generate official work order contract with BOQ items, retention percentage, and Section 194C TDS rules.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Subcontractor <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newWo.contractorId}
                      onChange={(e) => setNewWo({ ...newWo, contractorId: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-100"
                    >
                      {contractors.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name} ({c.trade || "Civil"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Project Site <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newWo.siteId}
                      onChange={(e) => setNewWo({ ...newWo, siteId: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-100"
                    >
                      {sites.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Contract Type
                    </label>
                    <select
                      value={newWo.contractType}
                      onChange={(e) => setNewWo({ ...newWo, contractType: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-100"
                    >
                      <option value="item_rate">Item Rate Contract (BOQ)</option>
                      <option value="lump_sum">Lump Sum Contract</option>
                      <option value="cost_plus">Cost Plus Contract</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                    Work Order Title / Package Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. RCC Structure & Civil Works Package for Tower A"
                    value={newWo.title}
                    onChange={(e) => setNewWo({ ...newWo, title: e.target.value })}
                    required
                    className="w-full text-sm rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Retention Rate (%)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newWo.retentionPercent}
                      onChange={(e) => setNewWo({ ...newWo, retentionPercent: e.target.value })}
                      className="w-full text-sm rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      TDS Rate u/s 194C (%)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newWo.tdsPercent}
                      onChange={(e) => setNewWo({ ...newWo, tdsPercent: e.target.value })}
                      className="w-full text-sm rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={newWo.startDate}
                      onChange={(e) => setNewWo({ ...newWo, startDate: e.target.value })}
                      className="w-full text-sm rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Target Completion Date
                    </label>
                    <Input
                      type="date"
                      value={newWo.completionDate}
                      onChange={(e) => setNewWo({ ...newWo, completionDate: e.target.value })}
                      className="w-full text-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* BOQ Items Builder */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-900 dark:text-dark-100 flex items-center gap-1.5">
                      <ClipboardDocumentCheckIcon className="size-4 text-[#c5a04e]" />
                      BOQ Work Items Schedule
                    </label>
                    <button
                      type="button"
                      onClick={addBoqItem}
                      className="text-xs font-semibold text-[#c5a04e] hover:underline flex items-center gap-1"
                    >
                      <PlusIcon className="size-3.5" />
                      Add Item
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-dark-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-dark-700">
                        <tr>
                          <th className="py-2 px-3 w-24">Item Code</th>
                          <th className="py-2 px-3">Description of Work</th>
                          <th className="py-2 px-3 w-24">Unit</th>
                          <th className="py-2 px-3 w-28 text-right">Est. Qty</th>
                          <th className="py-2 px-3 w-28 text-right">Rate (₹)</th>
                          <th className="py-2 px-3 w-32 text-right">Amount (₹)</th>
                          <th className="py-2 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-dark-700">
                        {newWo.items.map((it, idx) => {
                          const lineAmt = (Number(it.estimatedQty) || 0) * (Number(it.rate) || 0);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50">
                              <td className="p-2">
                                <Input
                                  type="text"
                                  value={it.itemCode}
                                  onChange={(e) => updateBoqItem(idx, "itemCode", e.target.value)}
                                  className="w-full text-xs font-mono py-1 px-2"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="text"
                                  placeholder="Work item description"
                                  value={it.description}
                                  onChange={(e) => updateBoqItem(idx, "description", e.target.value)}
                                  className="w-full text-xs py-1 px-2"
                                  required
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={it.unitCode}
                                  onChange={(e) => updateBoqItem(idx, "unitCode", e.target.value)}
                                  className="w-full py-1 px-2 text-xs rounded border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800"
                                >
                                  {units.map((u) => (
                                    <option key={u.id} value={u.code}>
                                      {u.code}
                                    </option>
                                  ))}
                                  {units.length === 0 && (
                                    <>
                                      <option value="CUM">CUM</option>
                                      <option value="SQFT">SQFT</option>
                                      <option value="MT">MT</option>
                                      <option value="NOS">NOS</option>
                                      <option value="RFT">RFT</option>
                                    </>
                                  )}
                                </select>
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={it.estimatedQty}
                                  onChange={(e) => updateBoqItem(idx, "estimatedQty", e.target.value)}
                                  className="w-full text-xs text-right py-1 px-2"
                                  required
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={it.rate}
                                  onChange={(e) => updateBoqItem(idx, "rate", e.target.value)}
                                  className="w-full text-xs text-right py-1 px-2"
                                  required
                                />
                              </td>
                              <td className="p-2 text-right font-bold text-slate-800 dark:text-dark-100">
                                ₹{lineAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeBoqItem(idx)}
                                  disabled={newWo.items.length <= 1}
                                  className="text-slate-400 hover:text-rose-500 disabled:opacity-30"
                                >
                                  <XMarkIcon className="size-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-3">
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-4 py-2 rounded-xl flex items-center gap-3">
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Total Contract Value:</span>
                      <span className="text-base font-black text-amber-900 dark:text-amber-200">
                        ₹{calculateTotalContractValue().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-700">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-dark-200 font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 text-sm rounded-xl bg-[#c5a04e] hover:bg-[#b08d3e] text-white font-medium shadow-sm transition"
                  >
                    {creating ? "Issuing..." : "Issue Work Order"}
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
