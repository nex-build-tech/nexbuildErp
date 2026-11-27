import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button } from "@/components/ui";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

interface BookingOption {
  id: number;
  bookingNo: string;
  unitNo: string;
  customerName: string;
  agreementValue: number;
}

export default function RealtyNewReceiptPage() {
  const navigate = useNavigate();
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
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      } catch (err) {
        console.error("Failed to load bookings:", err);
      }
    };
    fetchBookings();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
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

      setToast({ type: "success", text: "Receipt created successfully!" });
      setTimeout(() => {
        navigate("/realty/receipts");
      }, 1000);
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to record receipt.",
      });
      setSubmitting(false);
    }
  };

  return (
    <Page title="Create New Receipt">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <BanknotesIcon className="size-7 text-primary-600" />
              Create New Receipt
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Record a customer payment with automatic Section 194-IA TDS calculation and FIFO demand settlement.
            </p>
          </div>
          <Link to="/realty/receipts">
            <Button variant="outlined" className="text-xs py-2 px-3 flex items-center gap-1.5">
              <ArrowLeftIcon className="size-4" />
              Back to Receipts
            </Button>
          </Link>
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
          </div>
        )}

        <Card className="max-w-2xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    {b.bookingNo} - Unit {b.unitNo} ({b.customerName}) - ₹{b.agreementValue.toLocaleString("en-IN")}
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

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link to="/realty/receipts">
                <Button variant="outlined" type="button">
                  Cancel
                </Button>
              </Link>
              <Button color="primary" type="submit" disabled={submitting}>
                {submitting ? "Processing..." : "Submit Receipt Voucher"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
