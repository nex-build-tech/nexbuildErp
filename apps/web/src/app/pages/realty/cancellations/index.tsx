import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  XCircleIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
  ArrowPathIcon,
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

interface CancellationItem {
  id: number;
  cancellationNo: string;
  bookingId: number;
  cancellationDate: string;
  totalPaid: string;
  forfeitureAmount: string;
  refundAmount: string;
  refundStatus: string;
  reason?: string | null;
}

export default function RealtyCancellationsPage() {
  const [activeTab, setActiveTab] = useState<"cancellations" | "transfers">("cancellations");
  const [cancellations, setCancellations] = useState<CancellationItem[]>([]);
  const [bookingOptions, setBookingOptions] = useState<BookingOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | "">("");
  const [forfeitureAmount, setForfeitureAmount] = useState<string>("0");
  const [cancelReason, setCancelReason] = useState<string>("Customer requested surrender due to personal reasons");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferBookingId, setTransferBookingId] = useState<number | "">("");
  const [transferFee, setTransferFee] = useState<string>("50000");
  const [transferReason, setTransferReason] = useState<string>("Assignment to family member / resale");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPan, setNewPan] = useState("");
  const [newAadhaar, setNewAadhaar] = useState("");
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cancelRes, bookingsRes] = await Promise.all([
        axios.get("/realty/reports/cancellations"),
        axios.get("/realty/post-sales/bookings"),
      ]);
      const cRaw = cancelRes.data?.data?.rows || cancelRes.data?.rows || [];
      setCancellations(Array.isArray(cRaw) ? cRaw : []);
      const bRaw = bookingsRes.data?.data !== undefined ? bookingsRes.data.data : bookingsRes.data;
      const bRawList = Array.isArray(bRaw) ? bRaw : [];
      const bList = bRawList.map((b: any) => ({
        id: b.id,
        bookingNo: b.bookingNo,
        unitNo: b.unitNo,
        customerName: b.applicantFirstName
          ? `${b.applicantFirstName} ${b.applicantLastName || ""}`.trim()
          : "Customer",
        agreementValue: Number(b.agreementValue) || 0,
      }));
      setBookingOptions(bList);
    } catch (err: any) {
      console.error("Failed to load cancellations data:", err);
      setToast({ type: "error", text: "Failed to load cancellation records." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookingSelectForCancel = (bId: number) => {
    setCancelBookingId(bId);
    const bk = bookingOptions.find((b) => b.id === bId);
    if (bk) {
      setForfeitureAmount(Math.round(bk.agreementValue * 0.1).toString());
    }
  };

  const handleProcessCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBookingId) return;

    try {
      setSubmittingCancel(true);
      await axios.post(`/realty/post-sales/bookings/${cancelBookingId}/cancel`, {
        cancellationCharges: Number(forfeitureAmount),
        reason: cancelReason,
      });

      setToast({ type: "success", text: "Booking cancelled, forfeiture deducted, and unit returned to inventory!" });
      setShowCancelModal(false);
      setCancelBookingId("");
      fetchData();
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to process cancellation.",
      });
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleProcessTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferBookingId) return;

    try {
      setSubmittingTransfer(true);
      await axios.post(`/realty/post-sales/bookings/${transferBookingId}/transfer`, {
        newApplicant: {
          firstName: newFirstName,
          lastName: newLastName,
          mobile: newMobile,
          email: newEmail || undefined,
          pan: newPan || undefined,
          aadhaar: newAadhaar || undefined,
        },
        transferFee: Number(transferFee),
        reason: transferReason,
      });

      setToast({ type: "success", text: "Unit transfer approved and reassigned to new allottee!" });
      setShowTransferModal(false);
      setTransferBookingId("");
      setNewFirstName("");
      setNewLastName("");
      setNewMobile("");
      setNewEmail("");
      setNewPan("");
      setNewAadhaar("");
      fetchData();
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to process unit transfer.",
      });
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    const n = Number(val) || 0;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  return (
    <Page title="Cancellations & Unit Transfers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <XCircleIcon className="size-7 text-primary-600" />
              Cancellations &amp; Unit Transfers
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Manage allotment surrenders, forfeiture calculations, RERA statutory refunds, and secondary buyer endorsements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlined" onClick={fetchData} disabled={loading} className="text-xs py-2 px-3 flex items-center gap-1.5">
              <ArrowPathIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {activeTab === "cancellations" ? (
              <Button color="error" onClick={() => setShowCancelModal(true)} className="text-xs py-2 px-3 flex items-center gap-1.5">
                <XCircleIcon className="size-4" />
                Surrender / Cancel Booking
              </Button>
            ) : (
              <Button color="primary" onClick={() => setShowTransferModal(true)} className="text-xs py-2 px-3 flex items-center gap-1.5">
                <ArrowsRightLeftIcon className="size-4" />
                Transfer Allotment
              </Button>
            )}
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

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("cancellations")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "cancellations"
                ? "border-rose-600 text-rose-600 dark:text-rose-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Cancellations &amp; Surrenders
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "transfers"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Unit Transfers &amp; Endorsements
          </button>
        </div>

        {activeTab === "cancellations" ? (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Cancellations Audit Register
              </h3>
              <span className="text-xs text-slate-500">{cancellations.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Cancellation #</th>
                    <th className="px-4 py-3">Booking ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Total Paid</th>
                    <th className="px-4 py-3 text-right">Forfeiture Amount</th>
                    <th className="px-4 py-3 text-right">Net Refund Due</th>
                    <th className="px-4 py-3">Refund Status</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {cancellations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                        No booking cancellations recorded.
                      </td>
                    </tr>
                  ) : (
                    cancellations.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {c.cancellationNo}
                        </td>
                        <td className="px-4 py-3 font-mono">#{c.bookingId}</td>
                        <td className="px-4 py-3">
                          {new Date(c.cancellationDate).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">
                          {formatCurrency(c.totalPaid)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-rose-600 font-medium">
                          {formatCurrency(c.forfeitureAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                          {formatCurrency(c.refundAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="soft" color={c.refundStatus === "paid" ? "success" : "warning"}>
                            {c.refundStatus.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                          {c.reason || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <ArrowsRightLeftIcon className="size-12 text-primary-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Unit Transfer Endorsements
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Transfer ownership of an active booking to a new nominee or secondary purchaser. Transfer fee debited and primary KYC updated.
            </p>
            <Button color="primary" onClick={() => setShowTransferModal(true)} className="text-xs py-2 px-3 mx-auto flex items-center gap-1.5">
              <PlusIcon className="size-4" />
              Initiate New Transfer
            </Button>
          </Card>
        )}

        {/* MODAL 1: Process Cancellation */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-rose-600 flex items-center gap-2">
                  <XCircleIcon className="size-5" />
                  Cancel Allotment / Booking
                </h3>
                <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <form onSubmit={handleProcessCancellation} className="py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Select Booking to Cancel *
                  </label>
                  <select
                    required
                    value={cancelBookingId}
                    onChange={(e) => handleBookingSelectForCancel(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose active customer booking --</option>
                    {bookingOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingNo} - Unit {b.unitNo} ({b.customerName}) - {formatCurrency(b.agreementValue)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Forfeiture Deduction (₹)</label>
                  <input
                    type="number"
                    value={forfeitureAmount}
                    onChange={(e) => setForfeitureAmount(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Standard RERA clause: 10% of Agreement Value or booking earnest money.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Cancellation Reason *</label>
                  <textarea
                    required
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation and refund approval..."
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300">
                  <b>Warning:</b> Confirming cancellation will immediately release the unit back to the available inventory pool and generate a cancellation refund debit note.
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outlined" type="button" onClick={() => setShowCancelModal(false)}>
                    Cancel
                  </Button>
                  <Button color="error" type="submit" disabled={submittingCancel}>
                    {submittingCancel ? "Processing..." : "Confirm Cancellation & Surrender"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Process Transfer */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Transfer Unit Allotment
                </h3>
                <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <form onSubmit={handleProcessTransfer} className="py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Select Booking Account *
                  </label>
                  <select
                    required
                    value={transferBookingId}
                    onChange={(e) => setTransferBookingId(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose active booking to transfer --</option>
                    {bookingOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingNo} - Unit {b.unitNo} ({b.customerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-3">
                    New Transferee / Buyer KYC Details
                  </h4>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Deshmukh"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Mobile *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 9876543210"
                        value={newMobile}
                        onChange={(e) => setNewMobile(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
                      <input
                        type="email"
                        placeholder="rahul.d@gmail.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">PAN Number</label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={newPan}
                        onChange={(e) => setNewPan(e.target.value.toUpperCase())}
                        className="mt-1 w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Aadhaar (Encrypted)</label>
                      <input
                        type="text"
                        placeholder="12-digit Aadhaar"
                        value={newAadhaar}
                        onChange={(e) => setNewAadhaar(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Transfer Admin Fee (₹)</label>
                    <input
                      type="number"
                      value={transferFee}
                      onChange={(e) => setTransferFee(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Reason / Justification</label>
                    <input
                      type="text"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outlined" type="button" onClick={() => setShowTransferModal(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={submittingTransfer}>
                    {submittingTransfer ? "Executing..." : "Execute Allotment Transfer"}
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
