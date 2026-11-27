import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  DocumentCheckIcon,
  PrinterIcon,
  ArrowPathIcon,
  ClockIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface BookingOption {
  id: number;
  bookingNo: string;
  unitNo: string;
  customerName: string;
  agreementValue: number;
}

interface StatementEntry {
  id: number;
  entryDate: string;
  docType: string;
  docId: number;
  narration: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

interface LedgerResponse {
  booking: {
    id: number;
    bookingNo: string;
    bookingDate: string;
    status: string;
    unitNo: string;
    agreementValue: number;
    grandTotal: number;
  };
  customer: {
    name: string;
    mobile?: string;
    email?: string;
    pan?: string;
  };
  summary: {
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
  };
  entries: StatementEntry[];
}

export default function RealtyCustomerLedgerPage() {
  const [bookingOptions, setBookingOptions] = useState<BookingOption[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Interest Waiver Modal
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [waiverPercentage, setWaiverPercentage] = useState("100");
  const [waiverReason, setWaiverReason] = useState("Management goodwill approval");
  const [submittingWaiver, setSubmittingWaiver] = useState(false);

  // Printable SOA Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Nightly interest trigger
  const [accruing, setAccruing] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load bookings
  useEffect(() => {
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
        if (list.length > 0) {
          setSelectedBookingId(list[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load bookings for ledger:", err);
        setToast({ type: "error", text: "Failed to load bookings list." });
      }
    };
    fetchBookings();
  }, []);

  // Load ledger for selected booking
  const fetchLedger = async (bId: number) => {
    try {
      setLoading(true);
      const res = await axios.get(`/realty/post-sales/bookings/${bId}/ledger`);
      setLedgerData(res.data?.data !== undefined ? res.data.data : res.data);
    } catch (err: any) {
      console.error("Failed to load ledger:", err);
      setToast({ type: "error", text: "Failed to load customer statement of account." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBookingId) {
      fetchLedger(selectedBookingId);
    }
  }, [selectedBookingId]);

  const handleAccrueNightly = async () => {
    try {
      setAccruing(true);
      const res = await axios.post("/realty/post-sales/interest/accrue-nightly");
      setToast({
        type: "success",
        text: `Nightly interest calculation completed: ${res.data?.processed || 0} overdue items evaluated.`,
      });
      if (selectedBookingId) fetchLedger(selectedBookingId);
    } catch (err: any) {
      setToast({ type: "error", text: "Failed to execute interest accrual." });
    } finally {
      setAccruing(false);
    }
  };

  const handleWaiveInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) return;

    try {
      setSubmittingWaiver(true);
      await axios.post(`/realty/post-sales/interest/1/waive`, {
        waiverPercentage: Number(waiverPercentage),
        reason: waiverReason,
      });
      setToast({ type: "success", text: `Overdue interest waived (${waiverPercentage}% approval)` });
      setShowWaiverModal(false);
      fetchLedger(selectedBookingId);
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to process interest waiver.",
      });
    } finally {
      setSubmittingWaiver(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    const n = Number(val) || 0;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  return (
    <Page title="Customer Ledger & Statement of Account (SOA)">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <DocumentCheckIcon className="size-7 text-primary-600" />
              Customer Ledger &amp; Statement of Account (SOA)
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Real-time running balances, debit/credit audit trail, interest accrual calculations, and printable statements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={handleAccrueNightly}
              disabled={accruing}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ClockIcon className="size-4" />
              {accruing ? "Calculating..." : "Run Interest Accrual"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowPrintModal(true)}
              disabled={!ledgerData}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <PrinterIcon className="size-4" />
              Print Statement (SOA)
            </Button>
            <Button
              color="primary"
              onClick={() => setShowWaiverModal(true)}
              disabled={!ledgerData}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              Waive Interest
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

        {/* Booking Selector */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                Select Allottee / Booking Account
              </label>
              <select
                value={selectedBookingId || ""}
                onChange={(e) => setSelectedBookingId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {bookingOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bookingNo} - Unit {b.unitNo} ({b.customerName}) - {formatCurrency(b.agreementValue)}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outlined"
              onClick={() => selectedBookingId && fetchLedger(selectedBookingId)}
              disabled={loading}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ArrowPathIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Ledger
            </Button>
          </div>
        </Card>

        {/* Ledger Header Summary Banner */}
        {ledgerData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-blue-600">
              <div className="text-xs font-semibold text-slate-500 uppercase">Allottee &amp; Unit</div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {ledgerData.customer.name || "Customer"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Unit {ledgerData.booking.unitNo} | {ledgerData.booking.bookingNo}
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-indigo-600">
              <div className="text-xs font-semibold text-slate-500 uppercase">Agreement Value</div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">
                {formatCurrency(ledgerData.booking.agreementValue)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Total Cost (incl GST): {formatCurrency(ledgerData.booking.grandTotal)}
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-emerald-600">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Paid / Credited</div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {formatCurrency(ledgerData.summary.totalCredit)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Verified customer collections
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-rose-600">
              <div className="text-xs font-semibold text-slate-500 uppercase">Closing Balance Due</div>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                {formatCurrency(ledgerData.summary.closingBalance)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Net outstanding as of today
              </div>
            </Card>
          </div>
        )}

        {/* Statement of Account Ledger Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Running Statement of Account (SOA)
            </h3>
            <span className="text-xs text-slate-500">
              {ledgerData?.entries.length || 0} ledger transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Document Type</th>
                  <th className="px-4 py-3">Doc Ref #</th>
                  <th className="px-4 py-3">Description / Narration</th>
                  <th className="px-4 py-3 text-right">Debit (₹)</th>
                  <th className="px-4 py-3 text-right">Credit (₹)</th>
                  <th className="px-4 py-3 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
                {!ledgerData || ledgerData.entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500 font-sans text-sm">
                      No transactions recorded for this booking yet.
                    </td>
                  </tr>
                ) : (
                  ledgerData.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-sans">
                        {new Date(entry.entryDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <Badge
                          variant="soft"
                          color={
                            entry.docType === "receipt"
                              ? "success"
                              : entry.docType === "demand"
                              ? "neutral"
                              : entry.docType.includes("interest")
                              ? "warning"
                              : "primary"
                          }
                        >
                          {entry.docType.toUpperCase().replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        #{entry.docId}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-700 dark:text-slate-300">
                        {entry.narration}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600 font-semibold">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* MODAL: Interest Waiver */}
        {showWaiverModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Waive Overdue Interest
                </h3>
                <button onClick={() => setShowWaiverModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <form onSubmit={handleWaiveInterest} className="py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Waiver Percentage</label>
                  <select
                    value={waiverPercentage}
                    onChange={(e) => setWaiverPercentage(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="100">100% Full Waiver</option>
                    <option value="50">50% Partial Waiver</option>
                    <option value="25">25% Partial Waiver</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Justification / Approval Note *</label>
                  <textarea
                    required
                    rows={3}
                    value={waiverReason}
                    onChange={(e) => setWaiverReason(e.target.value)}
                    placeholder="Reason for waiving interest (e.g. Bank loan disbursement delay, management waiver)"
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outlined" type="button" onClick={() => setShowWaiverModal(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={submittingWaiver}>
                    {submittingWaiver ? "Processing..." : "Approve Waiver"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Printable Statement of Account */}
        {showPrintModal && ledgerData && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 text-slate-900 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-blue-900">
                    KINGS BUILDERS &amp; DEVELOPERS
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kings Heights Tower A &amp; B, Pune | MahaRERA: P52100012345
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outlined" onClick={() => window.print()} className="text-xs py-1.5 px-3 flex items-center gap-1">
                    <PrinterIcon className="size-4" />
                    Print SOA
                  </Button>
                  <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="size-5" />
                  </button>
                </div>
              </div>

              <div className="text-center font-bold text-base underline uppercase mb-6 text-slate-800">
                STATEMENT OF ACCOUNT (SOA)
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded border border-slate-200">
                <div>
                  <p><b>Customer Name:</b> {ledgerData.customer.name}</p>
                  <p><b>Mobile:</b> {ledgerData.customer.mobile || "-"}</p>
                  <p><b>Email:</b> {ledgerData.customer.email || "-"}</p>
                  <p><b>PAN:</b> {ledgerData.customer.pan || "-"}</p>
                </div>
                <div className="text-right">
                  <p><b>Booking No:</b> {ledgerData.booking.bookingNo}</p>
                  <p><b>Unit Allotted:</b> Unit {ledgerData.booking.unitNo}</p>
                  <p><b>Agreement Value:</b> {formatCurrency(ledgerData.booking.agreementValue)}</p>
                  <p><b>Total Package:</b> {formatCurrency(ledgerData.booking.grandTotal)}</p>
                </div>
              </div>

              <table className="w-full text-xs border border-slate-300 mb-6 font-mono">
                <thead className="bg-slate-100 font-semibold border-b border-slate-300 font-sans">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Narration</th>
                    <th className="p-2 text-right">Debit (₹)</th>
                    <th className="p-2 text-right">Credit (₹)</th>
                    <th className="p-2 text-right">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ledgerData.entries.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 font-sans">{new Date(e.entryDate).toLocaleDateString("en-IN")}</td>
                      <td className="p-2 font-sans uppercase">{e.docType}</td>
                      <td className="p-2 font-sans">{e.narration}</td>
                      <td className="p-2 text-right">{e.debit > 0 ? formatCurrency(e.debit) : "-"}</td>
                      <td className="p-2 text-right">{e.credit > 0 ? formatCurrency(e.credit) : "-"}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(e.runningBalance)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
                    <td colSpan={3} className="p-2 font-sans">CLOSING BALANCE OUTSTANDING:</td>
                    <td className="p-2 text-right">{formatCurrency(ledgerData.summary.totalDebit)}</td>
                    <td className="p-2 text-right">{formatCurrency(ledgerData.summary.totalCredit)}</td>
                    <td className="p-2 text-right text-rose-600">{formatCurrency(ledgerData.summary.closingBalance)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-end pt-8 text-xs text-slate-500">
                <div>
                  <p>Computer generated Statement of Account.</p>
                  <p>Date Generated: {new Date().toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-1" />
                  <p>For Kings Builders &amp; Developers</p>
                  <p className="text-[10px]">Accounts &amp; Collections Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
