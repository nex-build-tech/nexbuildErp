import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  EnvelopeIcon,
  PlusIcon,
  PrinterIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface BookingOption {
  id: number;
  bookingNo: string;
  unitNo: string;
  customerName: string;
  agreementValue: number;
}

interface LetterItem {
  id: number;
  letterNo: string;
  bookingId: number;
  templateType: string;
  issueDate: string;
  sentVia?: string | null;
  subject?: string | null;
  content?: string | null;
  bookingNo?: string;
  unitNo?: string;
  customerName?: string;
}

export default function RealtyCustomerLettersPage() {
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingOptions, setBookingOptions] = useState<BookingOption[]>([]);

  // Issue Letter Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | "">("");
  const [templateType, setTemplateType] = useState("allotment");
  const [channel, setChannel] = useState("whatsapp_email");
  const [issuing, setIssuing] = useState(false);

  // View Letter Modal
  const [viewingLetter, setViewingLetter] = useState<LetterItem | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/post-sales/letters");
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      setLetters(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      console.error("Failed to load letters:", err);
      setToast({ type: "error", text: "Failed to load issued letters." });
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
      console.error("Failed to load bookings:", err);
    }
  };

  useEffect(() => {
    fetchLetters();
    fetchBookings();
  }, []);

  const handleIssueLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setToast({ type: "error", text: "Please select a booking." });
      return;
    }

    try {
      setIssuing(true);
      await axios.post("/realty/post-sales/letters/issue", {
        bookingId: Number(selectedBookingId),
        templateType,
        channel,
      });

      setToast({ type: "success", text: `Letter of type "${templateType}" issued and queued for dispatch!` });
      setShowIssueModal(false);
      setSelectedBookingId("");
      fetchLetters();
    } catch (err: any) {
      setToast({
        type: "error",
        text: err?.response?.data?.message || "Failed to issue letter.",
      });
    } finally {
      setIssuing(false);
    }
  };

  const getTemplateBadge = (type: string) => {
    switch (type) {
      case "allotment":
        return <Badge variant="soft" color="success">Allotment Letter</Badge>;
      case "demand":
        return <Badge variant="soft" color="primary">Demand Notice</Badge>;
      case "reminder1":
        return <Badge variant="soft" color="warning">Reminder 1 (Gentle)</Badge>;
      case "reminder2":
        return <Badge variant="soft" color="warning">Reminder 2 (Urgent)</Badge>;
      case "reminder3":
        return <Badge variant="soft" color="error">Final Cancellation Notice</Badge>;
      case "possession":
        return <Badge variant="soft" color="success">Possession Intimation</Badge>;
      case "bank_noc":
        return <Badge variant="outlined" color="primary">Bank NOC / Tripartite</Badge>;
      default:
        return <Badge variant="soft" color="neutral">{type}</Badge>;
    }
  };

  const letterList = Array.isArray(letters) ? letters : [];

  return (
    <Page title="Customer Communication & Letters">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <EnvelopeIcon className="size-7 text-primary-600" />
              Customer Communication &amp; Letters
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Manage statutory customer correspondence: Allotment Letters, Demand Reminders, Bank NOCs, and Possession Notices.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={fetchLetters}
              disabled={loading}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ArrowPathIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              color="primary"
              onClick={() => setShowIssueModal(true)}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <PlusIcon className="size-4" />
              Issue New Letter
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
              <CheckCircleIcon className="size-5 text-emerald-600" />
              <span className="text-sm font-medium">{toast.text}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="size-5" />
            </button>
          </div>
        )}

        {/* Letters Issued Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Issued Customer Letters &amp; Notices
            </h3>
            <span className="text-xs text-slate-500">{letterList.length} documents generated</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Letter #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Booking / Unit</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Dispatched Via</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {letterList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No customer letters have been issued yet. Click "Issue New Letter" to generate allotment, reminder, or NOC letters.
                    </td>
                  </tr>
                ) : (
                  letterList.map((ltr) => (
                    <tr key={ltr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {ltr.letterNo || `LTR-${ltr.id}`}
                      </td>
                      <td className="px-4 py-3">
                        {getTemplateBadge(ltr.templateType)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          Unit {ltr.unitNo || "-"}
                        </div>
                        <div className="text-xs text-slate-500">{ltr.bookingNo || "-"}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {ltr.customerName || "Customer"}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(ltr.issueDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {ltr.sentVia || "WhatsApp & Email"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="View / Print Document"
                            onClick={() => setViewingLetter(ltr)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <EyeIcon className="size-4" />
                          </button>
                          <button
                            title="Print Document"
                            onClick={() => {
                              setViewingLetter(ltr);
                              setTimeout(() => window.print(), 300);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-950"
                          >
                            <PrinterIcon className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* MODAL 1: Issue Letter */}
        {showIssueModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Issue Customer Letter / Statutory Notice
                </h3>
                <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <form onSubmit={handleIssueLetter} className="py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Select Booking Account *
                  </label>
                  <select
                    required
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose active customer booking --</option>
                    {bookingOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingNo} - Unit {b.unitNo} ({b.customerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Letter Template *</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="allotment">Allotment Letter (RERA Form 1)</option>
                    <option value="demand">Demand Notice</option>
                    <option value="reminder1">Payment Reminder 1 (Gentle)</option>
                    <option value="reminder2">Payment Reminder 2 (Urgent / Interest Notice)</option>
                    <option value="reminder3">Payment Reminder 3 (Final 15-Day Cancellation Warning)</option>
                    <option value="possession">Possession Intimation &amp; Handover Offer</option>
                    <option value="bank_noc">Bank Tripartite Agreement / Home Loan NOC</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Dispatch Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="whatsapp_email">WhatsApp &amp; Email (Automated)</option>
                    <option value="email">Email Only (PDF Attachment)</option>
                    <option value="whatsapp">WhatsApp Only</option>
                    <option value="print">Print for Physical Courier</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <p className="font-semibold">Merge Field Tags Auto-Resolved:</p>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                    {"{customer_name}"}, {"{unit_no}"}, {"{wing_name}"}, {"{agreement_value}"}, {"{amount_due}"}, {"{due_date}"}, {"{rera_reg_no}"}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outlined" type="button" onClick={() => setShowIssueModal(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={issuing}>
                    {issuing ? "Generating..." : "Generate & Dispatch Letter"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: View / Print Letter */}
        {viewingLetter && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 text-slate-900 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-blue-900">
                    KINGS BUILDERS &amp; DEVELOPERS
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kings Heights Tower A &amp; B, Pune - 411038 | MahaRERA: P52100012345
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outlined" onClick={() => window.print()} className="text-xs py-1.5 px-3 flex items-center gap-1">
                    <PrinterIcon className="size-4" />
                    Print
                  </Button>
                  <button onClick={() => setViewingLetter(null)} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="size-5" />
                  </button>
                </div>
              </div>

              <div className="text-right text-xs mb-4 text-slate-500">
                <p><b>Date:</b> {new Date(viewingLetter.issueDate).toLocaleDateString("en-IN")}</p>
                <p><b>Ref:</b> {viewingLetter.letterNo || `LTR-${viewingLetter.id}`}</p>
              </div>

              <div className="text-xs mb-6">
                <p className="font-semibold">To,</p>
                <p className="font-bold text-sm text-slate-900">{viewingLetter.customerName || "Allottee"}</p>
                <p>Unit No: {viewingLetter.unitNo || "-"}</p>
                <p>Booking ID: {viewingLetter.bookingNo || "-"}</p>
              </div>

              <div className="text-sm font-bold text-slate-900 underline mb-4">
                {viewingLetter.subject || `SUBJECT: ${viewingLetter.templateType.toUpperCase()} - UNIT ${viewingLetter.unitNo}`}
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3 mb-8">
                <p>Dear Sir / Madam,</p>
                <p>
                  {viewingLetter.content || (
                    <>
                      This is in reference to your allotment of Unit No. <b>{viewingLetter.unitNo}</b> at Kings Heights Tower A &amp; B, Pune.
                      We hereby confirm that all records and statutory milestones are documented with developer compliance.
                      Please feel free to contact your dedicated CRM executive for any clarifications.
                    </>
                  )}
                </p>
                <p>
                  Thanking you and assuring you of our highest commitments at all times.
                </p>
              </div>

              <div className="flex justify-between items-end pt-6 border-t text-xs text-slate-600">
                <div>
                  <p className="font-semibold">Kings Builders &amp; Developers</p>
                  <p className="text-[11px] text-slate-500">Customer Relationship Management</p>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <p>Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
