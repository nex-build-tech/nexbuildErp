import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  EyeIcon,
  PrinterIcon,
  XMarkIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface PayStage {
  id: number;
  name: string;
  stageOrder: number;
  defaultPercentage: string;
  status: "pending" | "completed";
  completedAt?: string | null;
}

interface EligibleBooking {
  bookingId: number;
  bookingNo: string;
  unitNo: string;
  customerName: string;
  agreementValue: number;
  stagePercentage: number;
  stageAmount: number;
  gstAmount: number;
  totalDemand: number;
}

interface DemandItem {
  id: number;
  demandNo: string;
  bookingId: number;
  stageId: number;
  demandDate: string;
  dueDate: string;
  amount: string;
  gstAmount: string;
  totalAmount: string;
  paidAmount: string;
  status: "pending" | "partially_paid" | "paid" | "overdue";
  bookingNo?: string;
  unitNo?: string;
  stageName?: string;
  customerName?: string;
}

export default function RealtyDemandsPage() {
  const [stages, setStages] = useState<PayStage[]>([]);
  const [demands, setDemands] = useState<DemandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<PayStage | null>(null);

  // Eligible bookings modal
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState<number[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [showEligibleModal, setShowEligibleModal] = useState(false);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [generating, setGenerating] = useState(false);

  // Complete stage modal
  const [completingStage, setCompletingStage] = useState<PayStage | null>(null);
  const [completionDate, setCompletionDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [certificateNo, setCertificateNo] = useState("");
  const [savingStage, setSavingStage] = useState(false);

  // View / Print Demand modal
  const [viewingDemand, setViewingDemand] = useState<DemandItem | null>(null);

  // Notification / message
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stagesRes, demandsRes] = await Promise.all([
        axios.get("/realty/setup/pay-stages"),
        axios.get("/realty/post-sales/demands"),
      ]);
      const sRaw = stagesRes.data?.data !== undefined ? stagesRes.data.data : stagesRes.data;
      const dRaw = demandsRes.data?.data !== undefined ? demandsRes.data.data : demandsRes.data;
      setStages(Array.isArray(sRaw) ? sRaw : []);
      setDemands(Array.isArray(dRaw) ? dRaw : []);
    } catch (err: any) {
      console.error("Failed to load demands data:", err);
      setToast({ type: "error", text: "Failed to load stages or demands data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCompleteModal = (stage: PayStage) => {
    setCompletingStage(stage);
    setCompletionDate(new Date().toISOString().split("T")[0]);
    setCertificateNo("");
  };

  const handleCompleteStage = async () => {
    if (!completingStage) return;
    try {
      setSavingStage(true);
      await axios.post(`/realty/post-sales/stages/${completingStage.id}/complete`, {
        siteId: 1,
        completionDate,
        certificateNo: certificateNo || undefined,
      });
      setToast({ type: "success", text: `Stage "${completingStage.name}" marked as completed!` });
      setCompletingStage(null);
      fetchData();
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to mark stage as completed.",
      });
    } finally {
      setSavingStage(false);
    }
  };

  const openEligibleModal = async (stage: PayStage) => {
    try {
      setSelectedStage(stage);
      setLoadingEligible(true);
      setShowEligibleModal(true);
      const res = await axios.get(
        `/realty/post-sales/stages/${stage.id}/eligible-bookings?siteId=1`
      );
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      const list: EligibleBooking[] = Array.isArray(raw) ? raw : [];
      setEligibleBookings(list);
      setSelectedBookingIds(list.map((b) => b.bookingId));
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to fetch eligible bookings.",
      });
      setShowEligibleModal(false);
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!selectedStage || selectedBookingIds.length === 0) return;
    try {
      setGenerating(true);
      const res = await axios.post("/realty/post-sales/demands/bulk-generate", {
        siteId: 1,
        stageId: selectedStage.id,
        dueDate,
        bookingIds: selectedBookingIds,
      });
      setToast({
        type: "success",
        text: `Successfully generated ${res.data?.count || selectedBookingIds.length} demands!`,
      });
      setShowEligibleModal(false);
      fetchData();
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to generate demands.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendDemand = async (demandId: number) => {
    try {
      await axios.post(`/realty/post-sales/demands/${demandId}/send`, {
        channels: ["whatsapp", "email"],
      });
      setToast({ type: "success", text: "Demand notice dispatched via WhatsApp & Email!" });
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to dispatch demand notice.",
      });
    }
  };

  const formatCurrency = (val: string | number) => {
    const n = Number(val) || 0;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  return (
    <Page title="Construction Stages & Demands Run">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <DocumentTextIcon className="size-7 text-primary-600" />
              Construction Stages &amp; Demands Run
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Manage civil milestone completions, calculate payment stage eligibility, and bulk-generate demand letters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={fetchData}
              disabled={loading}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ArrowPathIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {toast && (
          <div
            className={`p-4 rounded-lg flex items-center justify-between border ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" ? (
                <CheckCircleIcon className="size-5 text-emerald-600" />
              ) : (
                <ExclamationCircleIcon className="size-5 text-rose-600" />
              )}
              <span className="text-sm font-medium">{toast.text}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="size-5" />
            </button>
          </div>
        )}

        {/* 1. Construction Milestone Stages */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Construction Payment Stages (Kings Heights)
              </h3>
              <p className="text-xs text-slate-500">
                Stages linked to site engineer DPR milestones. Completing a stage activates demand generation.
              </p>
            </div>
            <Badge variant="outlined" color="primary">Linked to DPR Milestones</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stages.map((stage) => {
              const isCompleted = stage.status === "completed";
              return (
                <div
                  key={stage.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Stage {stage.stageOrder}
                    </span>
                    <Badge variant="soft" color={isCompleted ? "success" : "neutral"}>
                      {isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </div>

                  <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {stage.name}
                  </div>

                  <div className="text-xs text-slate-500 mb-3">
                    Default: <span className="font-semibold text-slate-700 dark:text-slate-300">{stage.defaultPercentage}%</span> of agreement
                    {stage.completedAt && (
                      <div className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Completed on: {new Date(stage.completedAt).toLocaleDateString("en-IN")}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {!isCompleted ? (
                      <Button
                        variant="outlined"
                        className="w-full text-xs py-1.5 flex items-center justify-center gap-1"
                        onClick={() => openCompleteModal(stage)}
                      >
                        <CheckCircleIcon className="size-3.5" />
                        Mark Stage Complete
                      </Button>
                    ) : (
                      <Button
                        color="primary"
                        className="w-full text-xs py-1.5 flex items-center justify-center gap-1"
                        onClick={() => openEligibleModal(stage)}
                      >
                        <DocumentTextIcon className="size-3.5" />
                        Run Demands
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 2. Demands Raised Register */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Demands Register
              </h3>
              <p className="text-xs text-slate-500">
                Invoices raised against construction milestones with statutory GST calculations.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Total {demands.length} Demands
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Demand No</th>
                  <th className="px-4 py-3">Booking / Unit</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">GST (5%)</th>
                  <th className="px-4 py-3 text-right">Total Demand</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {demands.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      No demands have been generated yet. Complete a milestone stage above and click "Run Demands".
                    </td>
                  </tr>
                ) : (
                  demands.map((demand) => {
                    const bal = Math.max(0, Number(demand.totalAmount) - Number(demand.paidAmount));
                    return (
                      <tr key={demand.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {demand.demandNo}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">
                            Unit {demand.unitNo || "-"}
                          </div>
                          <div className="text-xs text-slate-500">{demand.bookingNo || "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(demand.dueDate).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatCurrency(demand.amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatCurrency(demand.gstAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(demand.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">
                          {formatCurrency(bal)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="soft"
                            color={
                              demand.status === "paid"
                                ? "success"
                                : demand.status === "overdue"
                                ? "error"
                                : demand.status === "partially_paid"
                                ? "warning"
                                : "neutral"
                            }
                          >
                            {demand.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              title="View / Print Demand Notice"
                              onClick={() => setViewingDemand(demand)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <EyeIcon className="size-4" />
                            </button>
                            <button
                              title="Dispatch WhatsApp & Email"
                              onClick={() => handleSendDemand(demand.id)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              <PaperAirplaneIcon className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* MODAL 1: Mark Stage Complete */}
        {completingStage && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Complete Construction Stage
                </h3>
                <button onClick={() => setCompletingStage(null)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Stage</label>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {completingStage.name} (Stage {completingStage.stageOrder})
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Completion Date</label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Architect / Engineer Certificate #</label>
                  <input
                    type="text"
                    placeholder="e.g. ARCH-KH-2026-S5"
                    value={certificateNo}
                    onChange={(e) => setCertificateNo(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button variant="outlined" onClick={() => setCompletingStage(null)}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onClick={handleCompleteStage}
                  disabled={savingStage}
                >
                  {savingStage ? "Saving..." : "Confirm Stage Completion"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Run Bulk Demands for Stage */}
        {showEligibleModal && selectedStage && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Generate Demands: {selectedStage.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select eligible bookings to issue statutory milestone demand letters.
                  </p>
                </div>
                <button onClick={() => setShowEligibleModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-4 rounded-lg my-3">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Stage Percentage: <span className="font-bold">{selectedStage.defaultPercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Due Date:</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                {loadingEligible ? (
                  <div className="py-12 text-center text-slate-500">Calculating eligible bookings...</div>
                ) : eligibleBookings.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    All active bookings already have demands raised for this stage!
                  </div>
                ) : (
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-semibold">
                      <tr>
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedBookingIds.length === eligibleBookings.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBookingIds(eligibleBookings.map((b) => b.bookingId));
                              } else {
                                setSelectedBookingIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="p-3">Booking #</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3 text-right">Agreement Val</th>
                        <th className="p-3 text-right">Stage Amt</th>
                        <th className="p-3 text-right">GST (5%)</th>
                        <th className="p-3 text-right">Total Demand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {eligibleBookings.map((b) => {
                        const isChecked = selectedBookingIds.includes(b.bookingId);
                        return (
                          <tr
                            key={b.bookingId}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedBookingIds(selectedBookingIds.filter((id) => id !== b.bookingId));
                              } else {
                                setSelectedBookingIds([...selectedBookingIds, b.bookingId]);
                              }
                            }}
                            className={`cursor-pointer ${isChecked ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                          >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBookingIds([...selectedBookingIds, b.bookingId]);
                                  } else {
                                    setSelectedBookingIds(selectedBookingIds.filter((id) => id !== b.bookingId));
                                  }
                                }}
                              />
                            </td>
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">
                              {b.bookingNo}
                            </td>
                            <td className="p-3 font-medium">Unit {b.unitNo}</td>
                            <td className="p-3">{b.customerName}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(b.agreementValue)}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(b.stageAmount)}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(b.gstAmount)}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(b.totalDemand)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-3">
                <span className="text-xs text-slate-500">
                  {selectedBookingIds.length} of {eligibleBookings.length} bookings selected
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outlined" onClick={() => setShowEligibleModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onClick={handleBulkGenerate}
                    disabled={generating || selectedBookingIds.length === 0}
                  >
                    {generating ? "Generating..." : `Bulk Generate ${selectedBookingIds.length} Demands`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Printable Demand Notice Letter */}
        {viewingDemand && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 text-slate-900 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-blue-900">
                    KINGS BUILDERS &amp; DEVELOPERS
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kings Heights Tower A &amp; B, Kothrud, Pune - 411038 | MahaRERA: P52100012345
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outlined" onClick={() => window.print()} className="text-xs py-1.5 px-3 flex items-center gap-1">
                    <PrinterIcon className="size-4" />
                    Print
                  </Button>
                  <button onClick={() => setViewingDemand(null)} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="size-5" />
                  </button>
                </div>
              </div>

              <div className="text-center font-bold text-base underline uppercase mb-6 text-slate-800">
                DEMAND INTIMATION NOTICE
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div>
                  <p><span className="font-semibold">Demand No:</span> {viewingDemand.demandNo}</p>
                  <p><span className="font-semibold">Date of Issue:</span> {new Date(viewingDemand.demandDate).toLocaleDateString("en-IN")}</p>
                  <p><span className="font-semibold">Due Date:</span> {new Date(viewingDemand.dueDate).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-semibold">Booking Ref:</span> {viewingDemand.bookingNo || "-"}</p>
                  <p><span className="font-semibold">Unit Allotted:</span> Unit {viewingDemand.unitNo || "-"}</p>
                  <p><span className="font-semibold">Milestone:</span> {viewingDemand.stageName || "Construction Stage"}</p>
                </div>
              </div>

              <p className="text-xs mb-4">
                Dear Allottee,
                <br /><br />
                We are pleased to inform you that the work on the milestone <b>{viewingDemand.stageName || "prescribed construction stage"}</b> for your unit has been successfully completed in accordance with the registered agreement.
              </p>

              <table className="w-full text-xs border border-slate-300 mb-6">
                <thead className="bg-slate-100 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2">Installment / Milestone Base Amount</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(viewingDemand.amount)}</td>
                  </tr>
                  <tr>
                    <td className="p-2">CGST (2.5%) + SGST (2.5%)</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(viewingDemand.gstAmount)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2">Total Amount Payable</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(viewingDemand.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 mb-6">
                <b>Statutory TDS Notice (Section 194-IA):</b> If your total agreement value is ₹50,00,000 or above, you are required under Income Tax regulations to deduct 1% TDS on the base installment amount and remit the same using Form 26QB, providing Form 16B certificate to the developer.
              </div>

              <div className="border-t pt-4 text-xs text-slate-600">
                <p className="font-semibold mb-1">Bank Remittance Virtual Account Details:</p>
                <p>Account Name: Kings Heights Escrow RERA Account</p>
                <p>Bank: HDFC Bank Ltd | IFSC: HDFC0000123</p>
                <p>Account No: KINGS-ESC-0012938</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
