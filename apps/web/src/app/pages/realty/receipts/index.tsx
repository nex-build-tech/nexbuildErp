import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import axios from "@/utils/axios";
import { useAuthContext } from "@/app/contexts/auth/context";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  BanknotesIcon,
  PlusIcon,
  CheckBadgeIcon,
  XCircleIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface ReceiptItem {
  id: number;
  receiptNo: string;
  bookingId: number;
  receiptDate: string;
  amount: string;
  mode: string;
  instrumentNo?: string | null;
  instrumentDate?: string | null;
  drawnOnBank?: string | null;
  status: "pending_approval" | "passed" | "bounced" | "rejected";
  tdsApplicable?: boolean;
  tdsAmount?: string;
  narration?: string | null;
  bookingNo?: string;
  unitNo?: string;
  customerName?: string;
  agreementValue?: string;
}

interface BookingOption {
  id: number;
  bookingNo: string;
  unitNo: string;
  customerName: string;
  agreementValue: number;
}

export default function RealtyReceiptsPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuthContext();
  const roleCode = typeof user?.role === "string" 
    ? user.role.toLowerCase() 
    : (user?.role?.code || "").toLowerCase();
  const isSalesHead = ["sales_head", "super_admin", "boss", "admin"].includes(roleCode);

  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Approval Modal State
  const [approvingReceipt, setApprovingReceipt] = useState<ReceiptItem | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  // New Receipt Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [bookingOptions, setBookingOptions] = useState<BookingOption[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<number | "">("");
  const [receiptAmount, setReceiptAmount] = useState<string>("");
  const [receiptDate, setReceiptDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState<string>("neft");
  const [instrumentNo, setInstrumentNo] = useState<string>("");
  const [drawnOnBank, setDrawnOnBank] = useState<string>("");
  const [tdsApplicable, setTdsApplicable] = useState(false);
  const [tdsAmount, setTdsAmount] = useState<string>("0");
  const [narration, setNarration] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Receipt Modal State
  const [editingReceipt, setEditingReceipt] = useState<ReceiptItem | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMode, setEditMode] = useState("neft");
  const [editInstrumentNo, setEditInstrumentNo] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editBank, setEditBank] = useState("");
  const [editNarration, setEditNarration] = useState("");
  const [editTdsApplicable, setEditTdsApplicable] = useState(false);
  const [editTdsAmount, setEditTdsAmount] = useState("0");
  const [savingEdit, setSavingEdit] = useState(false);

  // Bounce Modal State
  const [bouncingReceipt, setBouncingReceipt] = useState<ReceiptItem | null>(null);
  const [bounceReason, setBounceReason] = useState("Insufficient funds");
  const [bounceCharges, setBounceCharges] = useState("590");
  const [bouncing, setBouncing] = useState(false);

  // Print Two-Copy Receipt Modal
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptItem | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/post-sales/receipts");
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      setReceipts(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      console.error("Failed to load receipts:", err);
      setToast({ type: "error", text: "Failed to load receipts." });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get("/realty/post-sales/bookings");
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      const rawList = Array.isArray(raw) ? raw : [];
      const list = rawList.map((b: any) => ({
        id: b.id,
        bookingNo: b.bookingNo,
        unitNo: b.unitNo,
        customerName: b.applicantFirstName
          ? `${b.applicantFirstName} ${b.applicantLastName || ""}`.trim()
          : "Customer",
        agreementValue: Number(b.agreementValue) || 0,
      }));
      setBookingOptions(list);
    } catch (err) {
      console.error("Failed to load bookings list:", err);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchBookings();
  }, []);

  // Workflow Step 3: Auto-trigger New Receipt if coming from Booking Approval
  useEffect(() => {
    const qBookingId = searchParams.get("bookingId");
    if (qBookingId && bookingOptions.length > 0) {
      const bId = Number(qBookingId);
      handleBookingSelect(bId);
      if (searchParams.get("amount")) {
        setReceiptAmount(searchParams.get("amount")!);
      }
      setShowNewModal(true);
    }
  }, [searchParams, bookingOptions]);

  const handleOpenEdit = (r: ReceiptItem) => {
    setEditingReceipt(r);
    setEditAmount(r.amount);
    setEditMode(r.mode);
    setEditInstrumentNo(r.instrumentNo || "");
    setEditDate(r.receiptDate ? r.receiptDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setEditBank(r.drawnOnBank || "");
    setEditNarration(r.narration || "");
    setEditTdsApplicable(!!r.tdsApplicable);
    setEditTdsAmount(r.tdsAmount || "0");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;
    setSavingEdit(true);
    try {
      await axios.patch(`/realty/post-sales/receipts/${editingReceipt.id}`, {
        amount: editAmount,
        mode: editMode,
        instrumentNo: editInstrumentNo,
        instrumentDate: editDate,
        drawnOnBank: editBank,
        narration: editNarration,
        tdsApplicable: editTdsApplicable,
        tdsAmount: editTdsAmount,
      });
      setToast({ type: "success", text: `Receipt ${editingReceipt.receiptNo} updated successfully.` });
      setEditingReceipt(null);
      fetchReceipts();
    } catch (err: any) {
      setToast({ type: "error", text: err.response?.data?.message || "Failed to update receipt." });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteReceipt = async (r: ReceiptItem) => {
    if (!confirm(`Are you sure you want to delete receipt ${r.receiptNo} for ${formatCurrency(r.amount)}?`)) return;
    try {
      await axios.delete(`/realty/post-sales/receipts/${r.id}`);
      setToast({ type: "success", text: `Receipt ${r.receiptNo} deleted.` });
      fetchReceipts();
    } catch (err: any) {
      setToast({ type: "error", text: err.response?.data?.message || "Failed to delete receipt." });
    }
  };

  const handleExportReceiptsCSV = () => {
    if (receiptsList.length === 0) {
      alert("No receipts to export.");
      return;
    }
    const headers = ["Receipt No", "Booking No", "Unit", "Customer", "Date", "Amount (INR)", "Mode", "Instrument / UTR", "Bank", "Status"];
    const rows = receiptsList.map((r) => [
      `"${r.receiptNo}"`,
      `"${r.bookingNo || ""}"`,
      `"${r.unitNo || ""}"`,
      `"${r.customerName || ""}"`,
      `"${r.receiptDate ? new Date(r.receiptDate).toLocaleDateString("en-IN") : ""}"`,
      `"${r.amount}"`,
      `"${r.mode.toUpperCase()}"`,
      `"${r.instrumentNo || ""}"`,
      `"${r.drawnOnBank || ""}"`,
      `"${r.status}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Receipts_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBookingSelect = (bId: number) => {
    setSelectedBookingId(bId);
    const bk = bookingOptions.find((b) => b.id === bId);
    if (bk && bk.agreementValue >= 5000000) {
      setTdsApplicable(true);
    } else {
      setTdsApplicable(false);
    }
  };

  useEffect(() => {
    if (tdsApplicable && receiptAmount) {
      const amt = Number(receiptAmount) || 0;
      setTdsAmount(Math.round(amt * 0.01).toString());
    } else {
      setTdsAmount("0");
    }
  }, [tdsApplicable, receiptAmount]);

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !receiptAmount || Number(receiptAmount) <= 0) {
      setToast({ type: "error", text: "Please enter a valid booking and amount." });
      return;
    }

    try {
      setSubmitting(true);
      await axios.post("/realty/post-sales/receipts", {
        bookingId: Number(selectedBookingId),
        amount: Number(receiptAmount),
        receiptDate,
        mode: paymentMode,
        instrumentNo: instrumentNo || undefined,
        drawnOnBank: drawnOnBank || undefined,
        tdsApplicable,
        narration: narration || undefined,
      });

      setToast({ type: "success", text: "Receipt recorded successfully with live FIFO allocation!" });
      setShowNewModal(false);
      setSelectedBookingId("");
      setReceiptAmount("");
      setInstrumentNo("");
      setDrawnOnBank("");
      setNarration("");
      fetchReceipts();
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to record receipt.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmApproveReceipt = async () => {
    if (!approvingReceipt) return;
    if (!approvalRemarks.trim()) {
      setApprovalError("Approval remarks are required.");
      return;
    }
    try {
      setApproving(true);
      setApprovalError("");
      await axios.post(`/realty/post-sales/receipts/${approvingReceipt.id}/approve`, {
        remarks: approvalRemarks.trim(),
      });
      setToast({ type: "success", text: "Receipt verified and passed into accounts ledger!" });
      setApprovingReceipt(null);
      setApprovalRemarks("");
      fetchReceipts();
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to approve receipt.",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleBounce = async () => {
    if (!bouncingReceipt) return;
    try {
      setBouncing(true);
      await axios.post(`/realty/post-sales/receipts/${bouncingReceipt.id}/bounce`, {
        reason: bounceReason,
        charges: Number(bounceCharges) || 590,
      });
      setToast({
        type: "success",
        text: `Receipt ${bouncingReceipt.receiptNo} marked bounced and ₹${bounceCharges} dishonour charges debited.`,
      });
      setBouncingReceipt(null);
      fetchReceipts();
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to bounce receipt.",
      });
    } finally {
      setBouncing(false);
    }
  };

  const handleExportTally = async (receiptId: number, receiptNo: string) => {
    try {
      const res = await axios.get(`/realty/post-sales/receipts/${receiptId}/export-tally`);
      const xmlBlob = new Blob([res.data], { type: "application/xml" });
      const url = URL.createObjectURL(xmlBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tally_Receipt_${receiptNo}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ type: "success", text: `Tally XML voucher downloaded for ${receiptNo}` });
    } catch (err: any) {
      setToast({ type: "error", text: "Failed to export receipt to Tally XML." });
    }
  };

  const numberToWordsINR = (amount: number): string => {
    if (amount <= 0) return "Zero Rupees Only";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const inWords = (num: number): string => {
      if (num === 0) return "";
      if (num < 20) return a[num];
      if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + a[num % 10] : "");
      if (num < 1000) return a[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " and " + inWords(num % 100) : "");
      if (num < 100000) return inWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + inWords(num % 1000) : "");
      if (num < 10000000) return inWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + inWords(num % 100000) : "");
      return inWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + inWords(num % 10000000) : "");
    };

    const whole = Math.floor(amount);
    return `Rupees ${inWords(whole).trim()} Only`;
  };

  const formatCurrency = (val: string | number) => {
    const n = Number(val) || 0;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  const receiptsList = Array.isArray(receipts) ? receipts : [];
  const filteredReceipts = receiptsList.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNo = r.receiptNo?.toLowerCase().includes(q);
      const matchBk = r.bookingNo?.toLowerCase().includes(q);
      const matchInst = r.instrumentNo?.toLowerCase().includes(q);
      return matchNo || matchBk || matchInst;
    }
    return true;
  });

  return (
    <Page title="Receipts & Collections Register">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <BanknotesIcon className="size-7 text-primary-600" />
              Receipts &amp; Collections Register
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Manage payment vouchers, maker-checker approvals, Section 194-IA TDS, bounce handling, and Tally ERP synchronization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlined" onClick={handleExportReceiptsCSV} className="text-xs py-2 px-3 flex items-center gap-1.5">
              <ArrowDownTrayIcon className="size-4 text-slate-500" />
              Export Register
            </Button>
            <Button variant="outlined" onClick={fetchReceipts} disabled={loading} className="text-xs py-2 px-3 flex items-center gap-1.5">
              <ArrowPathIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button color="primary" onClick={() => setShowNewModal(true)} className="text-xs py-2 px-3 flex items-center gap-1.5">
              <PlusIcon className="size-4" />
              New Receipt
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

        {/* Filter and Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                All Receipts
              </button>
              <button
                onClick={() => setStatusFilter("pending_approval")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === "pending_approval"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                Pending Approval (Maker-Checker)
              </button>
              <button
                onClick={() => setStatusFilter("passed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === "passed"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                Passed &amp; Verified
              </button>
              <button
                onClick={() => setStatusFilter("bounced")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === "bounced"
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                Bounced / Dishonoured
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <MagnifyingGlassIcon className="size-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt / booking / cheque..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </Card>

        {/* Receipts Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Booking / Unit</th>
                  <th className="px-4 py-3 text-right">Gross Amount</th>
                  <th className="px-4 py-3 text-right">TDS (194-IA)</th>
                  <th className="px-4 py-3">Mode &amp; Bank</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      No receipts found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r) => {
                    const gross = Number(r.amount) || 0;
                    const tds = Number(r.tdsAmount) || 0;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {r.receiptNo}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(r.receiptDate).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">
                            Unit {r.unitNo || "-"}
                          </div>
                          <div className="text-xs text-slate-500">{r.bookingNo || "-"}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(gross)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                          {tds > 0 ? formatCurrency(tds) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="uppercase font-medium text-xs text-slate-900 dark:text-white">
                            {r.mode}
                          </div>
                          <div className="text-xs text-slate-500">
                            {r.instrumentNo ? `#${r.instrumentNo}` : ""} {r.drawnOnBank || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="soft"
                            color={
                              r.status === "passed"
                                ? "success"
                                : r.status === "bounced"
                                ? "error"
                                : "warning"
                            }
                          >
                            {r.status === "pending_approval"
                              ? "Pending Approval"
                              : r.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {r.status === "pending_approval" && (
                              <>
                                {isSalesHead && (
                                  <button
                                    title="Maker-Checker: Approve Receipt (Sales Head only)"
                                    onClick={() => {
                                      setApprovingReceipt(r);
                                      setApprovalRemarks("");
                                      setApprovalError("");
                                    }}
                                    className="p-1.5 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                  >
                                    <CheckBadgeIcon className="size-4" />
                                  </button>
                                )}
                                <button
                                  title="Modify / Edit Receipt"
                                  onClick={() => handleOpenEdit(r)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-950"
                                >
                                  <PencilSquareIcon className="size-4" />
                                </button>
                                <button
                                  title="Delete / Void Receipt"
                                  onClick={() => handleDeleteReceipt(r)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950"
                                >
                                  <TrashIcon className="size-4" />
                                </button>
                                <button
                                  title="Dishonour / Bounce Cheque"
                                  onClick={() => setBouncingReceipt(r)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950"
                                >
                                  <XCircleIcon className="size-4" />
                                </button>
                              </>
                            )}
                            <button
                              title="Print Two-Copy Receipt (Office + Customer)"
                              onClick={() => setViewingReceipt(r)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <PrinterIcon className="size-4" />
                            </button>
                            {r.status === "passed" && (
                              <button
                                title="Export to Tally XML"
                                onClick={() => handleExportTally(r.id, r.receiptNo)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950"
                              >
                                <ArrowDownTrayIcon className="size-4" />
                              </button>
                            )}
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

        {/* MODAL 1: New Receipt */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Record Customer Collection Receipt
                  </h3>
                  <p className="text-xs text-slate-500">
                    Allocates principal first via FIFO against demands and clears overdue interest.
                  </p>
                </div>
                <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateReceipt} className="py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Select Booking / Unit *
                  </label>
                  <select
                    required
                    value={selectedBookingId}
                    onChange={(e) => handleBookingSelect(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose active booking --</option>
                    {bookingOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingNo} - Unit {b.unitNo} ({b.customerName}) - {formatCurrency(b.agreementValue)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Receipt Date *</label>
                    <input
                      type="date"
                      required
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Payment Mode *</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="neft">NEFT / RTGS</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI</option>
                      <option value="dd">Demand Draft</option>
                      <option value="imps">IMPS</option>
                      <option value="cash">Cash (Statutory limit ₹2L)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Amount Received (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 500000"
                      value={receiptAmount}
                      onChange={(e) => setReceiptAmount(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Instrument / UTR #</label>
                    <input
                      type="text"
                      placeholder="Cheque No / UTR Ref"
                      value={instrumentNo}
                      onChange={(e) => setInstrumentNo(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Drawn on Bank</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    value={drawnOnBank}
                    onChange={(e) => setDrawnOnBank(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Section 194-IA TDS Section */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tdsApplicable}
                      onChange={(e) => setTdsApplicable(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Buyer Deducted Section 194-IA TDS (1% for properties ≥ ₹50L)
                    </span>
                  </label>
                  {tdsApplicable && (
                    <div className="text-xs text-amber-800 dark:text-amber-300 pl-6">
                      Calculated 1% TDS: <span className="font-mono font-bold">₹{Number(tdsAmount).toLocaleString("en-IN")}</span>.
                      Net remittance credited: <span className="font-mono font-bold">₹{(Number(receiptAmount) - Number(tdsAmount)).toLocaleString("en-IN")}</span>.
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Narration / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Towards Slab 5 milestone demand"
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outlined" type="button" onClick={() => setShowNewModal(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={submitting}>
                    {submitting ? "Processing..." : "Record Receipt (FIFO Allocation)"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Dishonour / Cheque Bounce */}
        {bouncingReceipt && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-rose-600 flex items-center gap-2">
                  <XCircleIcon className="size-5" />
                  Mark Receipt Bounced
                </h3>
                <button onClick={() => setBouncingReceipt(null)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Dishonouring receipt <b>{bouncingReceipt.receiptNo}</b> will reverse payment allocations in customer ledger, reactivate the outstanding demand, and debit cheque return penalty.
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Bounce Reason</label>
                  <select
                    value={bounceReason}
                    onChange={(e) => setBounceReason(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Insufficient funds">Insufficient funds</option>
                    <option value="Signature mismatch">Signature mismatch</option>
                    <option value="Account frozen / blocked">Account frozen / blocked</option>
                    <option value="Stop payment by drawer">Stop payment by drawer</option>
                    <option value="Post-dated cheque presented early">Post-dated cheque presented early</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Bounce Penalty (₹)</label>
                  <input
                    type="number"
                    value={bounceCharges}
                    onChange={(e) => setBounceCharges(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Default: ₹500 + 18% GST = ₹590</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button variant="outlined" onClick={() => setBouncingReceipt(null)}>
                  Cancel
                </Button>
                <Button
                  color="error"
                  onClick={handleBounce}
                  disabled={bouncing}
                >
                  {bouncing ? "Bouncing..." : "Confirm Dishonour"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2B: Modify / Edit Receipt Details */}
        {editingReceipt && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <PencilSquareIcon className="size-5 text-blue-600" />
                  Modify Receipt #{editingReceipt.receiptNo}
                </h3>
                <button onClick={() => setEditingReceipt(null)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Receipt Date *</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Payment Mode *</label>
                    <select
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="neft">NEFT / RTGS</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI</option>
                      <option value="dd">Demand Draft</option>
                      <option value="imps">IMPS</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Amount Received (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Instrument / UTR #</label>
                    <input
                      type="text"
                      value={editInstrumentNo}
                      onChange={(e) => setEditInstrumentNo(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Drawn on Bank</label>
                  <input
                    type="text"
                    value={editBank}
                    onChange={(e) => setEditBank(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Narration / Notes</label>
                  <input
                    type="text"
                    value={editNarration}
                    onChange={(e) => setEditNarration(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outlined" type="button" onClick={() => setEditingReceipt(null)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={savingEdit}>
                    {savingEdit ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Two-Copy Printable Receipt (Office + Customer Copy) */}
        {viewingReceipt && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 text-slate-900 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 mb-4 border-b">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    OFFICIAL RECEIPT VOUCHER
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outlined" onClick={() => window.print()} className="text-xs py-1.5 px-3 flex items-center gap-1">
                    <PrinterIcon className="size-4" />
                    Print Both Copies
                  </Button>
                  <button onClick={() => setViewingReceipt(null)} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="size-5" />
                  </button>
                </div>
              </div>

              {/* Render COPY 1: CUSTOMER COPY */}
              <div className="border border-slate-300 rounded-lg p-5 mb-6 relative">
                <div className="absolute top-3 right-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  [ CUSTOMER COPY ]
                </div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-base text-blue-900">KINGS BUILDERS &amp; DEVELOPERS</h3>
                    <p className="text-[11px] text-slate-500">Kings Heights Tower A &amp; B, Pune | MahaRERA: P52100012345</p>
                  </div>
                  <div className="text-right text-xs">
                    <p><b>Receipt No:</b> {viewingReceipt.receiptNo}</p>
                    <p><b>Date:</b> {new Date(viewingReceipt.receiptDate).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 py-2 border-y border-dashed border-slate-300 my-2">
                  <p><b>Received from:</b> {viewingReceipt.customerName || "Customer"} (Unit {viewingReceipt.unitNo || "-"}, Ref: {viewingReceipt.bookingNo || "-"})</p>
                  <p><b>Amount (in numbers):</b> <span className="font-mono font-bold text-slate-900">{formatCurrency(viewingReceipt.amount)}</span></p>
                  <p><b>Amount (in words):</b> <span className="italic font-medium text-slate-800">{numberToWordsINR(Number(viewingReceipt.amount))}</span></p>
                  <p><b>Payment Mode:</b> {viewingReceipt.mode.toUpperCase()} {viewingReceipt.instrumentNo ? `(Ref: ${viewingReceipt.instrumentNo})` : ""} {viewingReceipt.drawnOnBank ? `Bank: ${viewingReceipt.drawnOnBank}` : ""}</p>
                  {viewingReceipt.tdsApplicable && (
                    <p className="text-emerald-700"><b>Section 194-IA TDS:</b> ₹{Number(viewingReceipt.tdsAmount || 0).toLocaleString("en-IN")} deducted by allottee.</p>
                  )}
                </div>

                <div className="flex justify-between items-end pt-3 text-[11px] text-slate-500">
                  <span>Subject to realization of payment instrument.</span>
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-400 mb-1" />
                    <span>Authorized Signatory</span>
                  </div>
                </div>
              </div>

              {/* Perforation Divider */}
              <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-dashed border-slate-400"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-400 uppercase font-mono">✂ Cut Here - Perforation Line ✂</span>
                <div className="flex-grow border-t border-dashed border-slate-400"></div>
              </div>

              {/* Render COPY 2: OFFICE COPY */}
              <div className="border border-slate-300 rounded-lg p-5 bg-slate-50 relative">
                <div className="absolute top-3 right-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  [ OFFICE / ACCOUNTS COPY ]
                </div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-base text-blue-900">KINGS BUILDERS &amp; DEVELOPERS</h3>
                    <p className="text-[11px] text-slate-500">Accounts &amp; Collections Section</p>
                  </div>
                  <div className="text-right text-xs">
                    <p><b>Receipt No:</b> {viewingReceipt.receiptNo}</p>
                    <p><b>Date:</b> {new Date(viewingReceipt.receiptDate).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 py-2 border-y border-dashed border-slate-300 my-2">
                  <p><b>Allottee:</b> {viewingReceipt.customerName || "Customer"} | Unit {viewingReceipt.unitNo || "-"} ({viewingReceipt.bookingNo || "-"})</p>
                  <p><b>Gross Amount:</b> <span className="font-mono font-bold text-slate-900">{formatCurrency(viewingReceipt.amount)}</span></p>
                  <p><b>Amount (in words):</b> <span className="italic font-medium text-slate-800">{numberToWordsINR(Number(viewingReceipt.amount))}</span></p>
                  <p><b>Instrument / Bank:</b> {viewingReceipt.mode.toUpperCase()} #{viewingReceipt.instrumentNo || "N/A"} - {viewingReceipt.drawnOnBank || "Direct"}</p>
                  <p><b>Narration:</b> {viewingReceipt.narration || "Towards milestone demand"}</p>
                </div>

                <div className="flex justify-between items-end pt-3 text-[11px] text-slate-500">
                  <span>Entered into BuildERP Ledger &amp; Tally Voucher.</span>
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-400 mb-1" />
                    <span>Receiver's Signature</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Approve Receipt Modal ──────────────────────────────────────── */}
        {approvingReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="max-w-lg w-full bg-white dark:bg-dark-750 border border-slate-200 dark:border-dark-600 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                    <CheckBadgeIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                      Approve Receipt #{approvingReceipt.receiptNo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-dark-300 mt-0.5">
                      Customer: {approvingReceipt.customerName || "Customer"} • Amount: ₹{Number(approvingReceipt.amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setApprovingReceipt(null);
                    setApprovalRemarks("");
                    setApprovalError("");
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 transition-colors"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/90 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed flex items-start gap-2.5">
                <CheckCircleIcon className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  Approving this voucher will mark it as <strong>PASSED</strong> and credit the customer's milestone schedule and project escrow ledger.
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-200">
                  Sales Head Approval Remarks <span className="text-rose-500 font-bold">* (Required)</span>
                </label>
                <textarea
                  rows={3}
                  value={approvalRemarks}
                  onChange={(e) => {
                    setApprovalRemarks(e.target.value);
                    if (approvalError && e.target.value.trim()) setApprovalError("");
                  }}
                  placeholder="e.g. Verified instrument realization in bank statement against Booking demand."
                  className={`w-full text-xs p-3 rounded-xl border transition-all duration-150 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-dark-100 focus:outline-none focus:ring-2 ${
                    approvalError
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-300 dark:border-dark-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
                {approvalError && (
                  <p className="text-[11px] text-rose-500 font-medium">{approvalError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-dark-700">
                <Button
                  variant="outlined"
                  disabled={approving}
                  onClick={() => {
                    setApprovingReceipt(null);
                    setApprovalRemarks("");
                    setApprovalError("");
                  }}
                  className="text-xs py-2 px-4"
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  disabled={approving || !approvalRemarks.trim()}
                  onClick={handleConfirmApproveReceipt}
                  className={`text-xs py-2 px-5 font-semibold ${
                    !approvalRemarks.trim()
                      ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-dark-600 text-slate-500"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {approving ? "Approving..." : "Confirm & Pass Receipt"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
