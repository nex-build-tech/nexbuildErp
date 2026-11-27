import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import axios from "@/utils/axios";
import { useAuthContext } from "@/app/contexts/auth/context";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  DocumentCheckIcon,
  ArrowLeftIcon,
  PrinterIcon,
  CurrencyRupeeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingOffice2Icon,
  TruckIcon,
  UsersIcon,
  DocumentTextIcon,
  LockClosedIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

export default function RealtyBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const roleCode = typeof user?.role === "string" 
    ? user.role.toLowerCase() 
    : (user?.role?.code || "").toLowerCase();
  const isSalesHead = ["sales_head", "super_admin", "boss", "admin"].includes(roleCode);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"schedule" | "applicants" | "unit" | "charges" | "documents" | "audit">("schedule");

  // Approval modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  const fetchCustomer360 = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/realty/post-sales/bookings/${id}`);
      setData(res.data?.data || res.data);
    } catch (err) {
      console.error("Failed to load customer 360", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomer360();
    }
  }, [id]);

  const handleApprove = async () => {
    if (!approvalRemarks.trim()) {
      setApprovalError("Approval remarks are required.");
      return;
    }
    try {
      setApproving(true);
      setApprovalError("");
      await axios.post(`/realty/post-sales/bookings/${id}/approve`, {
        remarks: approvalRemarks.trim(),
      });
      setShowApproveModal(false);
      setApprovalRemarks("");
      fetchCustomer360();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve booking");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) {
      setRejectError("Rejection remarks are required.");
      return;
    }
    try {
      setRejecting(true);
      setRejectError("");
      await axios.post(`/realty/post-sales/bookings/${id}/reject`, {
        remarks: rejectRemarks.trim(),
      });
      setShowRejectModal(false);
      setRejectRemarks("");
      fetchCustomer360();
      alert(`Booking #${data?.booking?.bookingNo} has been rejected.`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject booking");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Customer 360">
        <div className="py-24 text-center">
          <ArrowPathIcon className="size-8 animate-spin mx-auto text-primary-500 mb-3" />
          <p className="text-sm text-slate-500">Loading Customer 360 View...</p>
        </div>
      </Page>
    );
  }

  if (!data || !data.booking) {
    return (
      <Page title="Customer 360">
        <div className="py-24 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-dark-100">Booking Record Not Found</h2>
          <Button variant="outlined" onClick={() => navigate("/realty/bookings")}>
            Back to Bookings Register
          </Button>
        </div>
      </Page>
    );
  }

  const { booking, kpis, applicants = [], schedule = [], parkings = [], charges = [], documents = [] } = data;
  const primaryApp = applicants.find((a: any) => a.type === "primary") || applicants[0] || {};
  const coApps = applicants.filter((a: any) => a.type !== "primary");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "booked":
        return <Badge color="success">Booked</Badge>;
      case "agreement":
      case "agreement_done":
        return <Badge color="primary">Agreement Done</Badge>;
      case "registered":
        return <Badge color="info">Registered</Badge>;
      case "possession":
        return <Badge color="secondary">Possession Handed Over</Badge>;
      case "pending_approval":
        return <Badge color="warning">Pending Approval</Badge>;
      case "cancelled":
        return <Badge color="error">Cancelled</Badge>;
      default:
        return <Badge color="neutral">{status}</Badge>;
    }
  };

  const getScheduleStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge color="success">Paid</Badge>;
      case "partly_paid":
        return <Badge color="warning">Part Paid</Badge>;
      case "demanded":
        return <Badge color="info">Demanded</Badge>;
      case "overdue":
        return <Badge color="error">Overdue</Badge>;
      default:
        return <Badge color="neutral">Not Due</Badge>;
    }
  };

  const lifecycleStages = [
    { key: "draft", label: "Draft" },
    { key: "booked", label: "Booked" },
    { key: "agreement_done", label: "Agreement Done" },
    { key: "registered", label: "Registered" },
    { key: "possession", label: "Possession" },
  ];

  const currentStageIndex = lifecycleStages.findIndex((s) => s.key === booking.status || (booking.status === "agreement" && s.key === "agreement_done"));

  return (
    <Page title={`Customer 360 - ${booking.bookingNo}`}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to="/realty/bookings"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1"
            >
              <ArrowLeftIcon className="size-3.5" />
              Back to Bookings Register
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                <DocumentCheckIcon className="size-7 text-primary-600" />
                Customer 360: {primaryApp.firstName} {primaryApp.lastName}
              </h1>
              {getStatusBadge(booking.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Booking <span className="font-mono font-semibold text-slate-800 dark:text-dark-200">#{booking.bookingNo}</span> • Unit <span className="font-semibold text-primary-600">{booking.unit?.unitNo}</span> ({booking.unit?.carpetArea} sqft) • Kings Heights
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSalesHead && booking.status === "pending_approval" && (
              <div className="flex items-center gap-1.5">
                <Button
                  color="primary"
                  onClick={() => {
                    setShowApproveModal(true);
                    setApprovalRemarks("");
                    setApprovalError("");
                  }}
                  className="text-xs py-2 px-3.5 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCircleIcon className="size-4" />
                  Approve Booking
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowRejectModal(true);
                    setRejectRemarks("");
                    setRejectError("");
                  }}
                  className="text-xs py-2 px-3.5 flex items-center gap-1.5 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <XMarkIcon className="size-4" />
                  Reject Booking
                </Button>
              </div>
            )}
            <Button
              variant="outlined"
              onClick={() => window.print()}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <PrinterIcon className="size-4" />
              Print Summary
            </Button>
          </div>
        </div>

        {/* Sales Head Decision Banner if remarks exist */}
        {data.approval?.remarks && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
            data.approval.status === "approved" || booking.status === "booked"
              ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
          }`}>
            <ChatBubbleBottomCenterTextIcon className="size-5 shrink-0 mt-0.5 text-current" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Sales Head Decision ({data.approval.status?.toUpperCase() || (booking.status === "cancelled" ? "REJECTED" : "APPROVED")}):
              </span>
              <p className="mt-0.5 italic text-slate-800 dark:text-dark-100 leading-relaxed">&ldquo;{data.approval.remarks}&rdquo;</p>
              {data.approval.actedAt && (
                <p className="mt-1 text-[10px] text-slate-500 dark:text-dark-400">
                  Acted on: {new Date(data.approval.actedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Financial Reconciliation KPI Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3 border-l-4 border-l-primary-500 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Agreement Value</span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-dark-100 mt-1">
              ₹{kpis.agreementValue.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-slate-400">Net Sales Value</span>
          </Card>

          <Card className="p-3 border-l-4 border-l-indigo-500 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Grand Total (Incl GST)</span>
            <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              ₹{kpis.grandTotal.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-slate-400">All-Inclusive</span>
          </Card>

          <Card className="p-3 border-l-4 border-l-blue-500 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Demanded</span>
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
              ₹{kpis.totalDemanded.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-slate-400">Billed Milestones</span>
          </Card>

          <Card className="p-3 border-l-4 border-l-emerald-500 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Received</span>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{kpis.totalReceived.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Verified Receipts</span>
          </Card>

          <Card className="p-3 border-l-4 border-l-amber-500 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Outstanding Due</span>
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              ₹{kpis.totalOutstanding.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-amber-600">Pending Collection</span>
          </Card>

          <Card className="p-3 border-l-4 border-l-purple-500 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Efficiency</span>
            <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
              {kpis.collectionEfficiencyPct}%
            </div>
            <span className="text-[10px] text-slate-400">Collected / Demanded</span>
          </Card>
        </div>

        {/* Life-cycle Stepper Strip */}
        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs max-w-4xl mx-auto">
            {lifecycleStages.map((st, idx) => {
              const isPastOrCurrent = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;
              return (
                <div key={st.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? "bg-primary-600 text-white ring-4 ring-primary-100"
                          : isPastOrCurrent
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isPastOrCurrent && !isCurrent ? "✓" : idx + 1}
                    </div>
                    <span className={`text-[11px] mt-1 font-medium ${isCurrent ? "text-primary-700 font-bold" : "text-slate-500"}`}>
                      {st.label}
                    </span>
                  </div>
                  {idx < lifecycleStages.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 -mt-4 ${
                        currentStageIndex > idx ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tabs Bar */}
        <div className="border-b border-slate-200 dark:border-dark-700 flex gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "schedule"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarDaysIcon className="size-4" />
            Payment Schedule (21 Milestones)
          </button>

          <button
            onClick={() => setActiveTab("applicants")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "applicants"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UsersIcon className="size-4" />
            Applicants &amp; KYC
          </button>

          <button
            onClick={() => setActiveTab("unit")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "unit"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BuildingOffice2Icon className="size-4" />
            Unit &amp; Parking
          </button>

          <button
            onClick={() => setActiveTab("charges")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "charges"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CurrencyRupeeIcon className="size-4" />
            Extra Charges Breakdown
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "documents"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <DocumentTextIcon className="size-4" />
            Documents
          </button>
        </div>

        {/* Tab 1: Payment Schedule */}
        {activeTab === "schedule" && (
          <Card className="overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-dark-750 border-b border-slate-200 dark:border-dark-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-dark-100">
                  Milestone Payment Schedule ({booking.scheme?.name || "Payment Scheme"})
                </h3>
                <p className="text-xs text-slate-500">
                  100% stage allocation linked to construction progress and agreement execution.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Total Stages: </span>
                <span className="text-xs font-bold font-mono text-slate-900 dark:text-dark-100">{schedule.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-dark-800 text-slate-600 dark:text-dark-300 font-semibold border-b border-slate-200 dark:border-dark-700 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Milestone Description</th>
                    <th className="py-2.5 px-2 text-right">%</th>
                    <th className="py-2.5 px-3 text-right">Basic Demanded</th>
                    <th className="py-2.5 px-3 text-right">GST (5%)</th>
                    <th className="py-2.5 px-3 text-right font-bold">Total Stage Amt</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600">Paid Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700 text-slate-700 dark:text-dark-200">
                  {schedule.map((st: any) => {
                    const basic = parseFloat(st.amount) || 0;
                    const gst = parseFloat(st.gstAmt) || 0;
                    const total = basic + gst;
                    const paid = parseFloat(st.paidAmount) || 0;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-750 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-primary-600">
                          {st.code}
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {st.name}
                          {st.isConstructionLinked && (
                            <span className="ml-2 text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                              CLP
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-semibold">
                          {parseFloat(st.pct).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₹{basic.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          ₹{gst.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-dark-100">
                          ₹{total.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">
                          ₹{paid.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {getScheduleStatusBadge(st.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2: Applicants & Masked Aadhaar */}
        {activeTab === "applicants" && (
          <div className="space-y-6">
            {/* Primary Applicant Card */}
            <Card className="p-6 shadow-sm space-y-4 border-t-4 border-t-primary-600">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-700 gap-2">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-lg">
                    {primaryApp.firstName?.charAt(0)}{primaryApp.lastName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                      {primaryApp.title} {primaryApp.firstName} {primaryApp.lastName}
                    </h3>
                    <p className="text-xs text-slate-500">Primary Allottee / Key Buyer</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-900">
                    <ShieldCheckIcon className="size-4" />
                    AES-256-GCM Encrypted at Rest
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">PAN Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-dark-100 bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded">
                    {primaryApp.pan || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                    <LockClosedIcon className="size-3 text-emerald-600" />
                    Aadhaar (Masked)
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                    {primaryApp.aadhaarMasked || "XXXX-XXXX-****"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                    <PhoneIcon className="size-3 text-slate-400" />
                    Mobile
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-dark-100">{primaryApp.mobile || "N/A"}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                    <EnvelopeIcon className="size-3 text-slate-400" />
                    Email
                  </span>
                  <span className="text-slate-800 dark:text-dark-100">{primaryApp.email || "N/A"}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                  <span>{primaryApp.dob ? new Date(primaryApp.dob).toLocaleDateString("en-IN") : "N/A"}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Gender</span>
                  <span className="capitalize">{primaryApp.gender || "N/A"}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Occupation</span>
                  <span>{primaryApp.occupation || "N/A"}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">City / State</span>
                  <span>{primaryApp.city || "Mumbai"}, {primaryApp.stateCode || "MH"} - {primaryApp.pincode || "400001"}</span>
                </div>

                <div className="sm:col-span-2 md:col-span-4">
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                    <MapPinIcon className="size-3 text-slate-400" />
                    Permanent Address
                  </span>
                  <span className="text-slate-800 dark:text-dark-100">{primaryApp.permanentAddress || "N/A"}</span>
                </div>
              </div>
            </Card>

            {/* Co-Applicants */}
            {coApps.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-dark-100">
                  Co-Applicants &amp; Joint Owners ({coApps.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coApps.map((co: any) => (
                    <Card key={co.id} className="p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-700 pb-2">
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-dark-100 text-xs">
                            {co.title} {co.firstName} {co.lastName}
                          </h5>
                          <span className="text-[10px] text-primary-600 font-semibold">{co.relation || "Joint Owner"}</span>
                        </div>
                        <Badge color="neutral" className="text-[10px]">
                          {co.type.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">PAN</span>
                          <span className="font-mono font-semibold">{co.pan || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Aadhaar (Masked)</span>
                          <span className="font-mono text-emerald-600 font-semibold">{co.aadhaarMasked || "XXXX-XXXX-****"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Mobile</span>
                          <span>{co.mobile || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Email</span>
                          <span>{co.email || "N/A"}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Unit & Parking */}
        {activeTab === "unit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2 border-b border-slate-100 dark:border-dark-700 pb-2">
                <BuildingOffice2Icon className="size-5 text-primary-600" />
                Unit Specifications
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Number:</span>
                  <span className="font-bold text-slate-900 dark:text-dark-100">{booking.unit?.unitNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Configuration:</span>
                  <span className="font-semibold">{booking.unit?.unitType?.name || "Apartment"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Carpet Area:</span>
                  <span className="font-mono font-bold">{booking.unit?.carpetArea} sqft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Floor Level:</span>
                  <span>Floor {booking.unit?.floor?.levelNo || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Rate:</span>
                  <span className="font-mono">₹{parseFloat(booking.soldRate || "0").toLocaleString("en-IN")}/sqft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Floor Rise Amount:</span>
                  <span className="font-mono">₹{parseFloat(booking.floorRiseAmt || "0").toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PLC Amount:</span>
                  <span className="font-mono">₹{parseFloat(booking.plcAmt || "0").toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount ({booking.discountPct}%):</span>
                  <span className="font-mono text-amber-600">-₹{parseFloat(booking.discountAmt || "0").toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-dark-700 font-bold text-emerald-600">
                  <span>Net Agreement Value:</span>
                  <span className="font-mono text-sm">₹{parseFloat(booking.agreementValue || "0").toLocaleString("en-IN")}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2 border-b border-slate-100 dark:border-dark-700 pb-2">
                <TruckIcon className="size-5 text-primary-600" />
                Allocated Parking Bays
              </h3>
              {parkings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No parking slot allocated to this booking.
                </div>
              ) : (
                <div className="space-y-3">
                  {parkings.map((pk: any) => (
                    <div
                      key={pk.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-750 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-dark-100">Slot #{pk.slotNo}</span>
                        <p className="text-[10px] text-slate-400 capitalize">{pk.type} Parking</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 dark:text-dark-100">
                          ₹{parseFloat(pk.price || "0").toLocaleString("en-IN")}
                        </span>
                        <div className="text-[10px] text-emerald-600 font-semibold">Allocated &amp; Locked</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tab 4: Extra Charges Breakdown */}
        {activeTab === "charges" && (
          <Card className="overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-dark-750 border-b border-slate-200 dark:border-dark-700 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-dark-100">
                  16 Development &amp; Society Charge Heads
                </h3>
                <p className="text-xs text-slate-500">
                  Mandatory statutory, society formation, utility connection and clubhouse maintenance charges.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-dark-100">
                Total Other Charges: ₹{parseFloat(booking.otherChargesTotal || "0").toLocaleString("en-IN")}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-dark-800 text-slate-600 dark:text-dark-300 font-semibold border-b border-slate-200 dark:border-dark-700 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-4">Charge Description</th>
                    <th className="py-2.5 px-3 text-right">Base Amount</th>
                    <th className="py-2.5 px-3 text-right">GST (18%)</th>
                    <th className="py-2.5 px-4 text-right font-bold">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700 text-slate-700 dark:text-dark-200">
                  {charges.map((ch: any) => {
                    const base = parseFloat(ch.amount) || 0;
                    const gst = parseFloat(ch.gstAmt) || 0;
                    const total = base + gst;

                    return (
                      <tr key={ch.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-750">
                        <td className="py-2 px-3 font-mono text-primary-600">{ch.code}</td>
                        <td className="py-2 px-4 font-medium">{ch.name}</td>
                        <td className="py-2 px-3 text-right font-mono">₹{base.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">₹{gst.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-900 dark:text-dark-100">
                          ₹{total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 5: Documents */}
        {activeTab === "documents" && (
          <Card className="p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-700 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-dark-100">
                  Customer &amp; Booking Documents
                </h3>
                <p className="text-xs text-slate-500">
                  KYC identity proofs, PAN card, allotment letters and signed cost sheet.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-750 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs">
                  <DocumentTextIcon className="size-5 text-primary-600" />
                  <div>
                    <span className="font-semibold block">Allotment Letter</span>
                    <span className="text-[10px] text-slate-400">Generated on Booking</span>
                  </div>
                </div>
                <Button variant="outlined" className="text-[11px] py-1 px-2">View</Button>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-750 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs">
                  <DocumentTextIcon className="size-5 text-primary-600" />
                  <div>
                    <span className="font-semibold block">Cost Sheet Quotation</span>
                    <span className="text-[10px] text-slate-400">Signed copy</span>
                  </div>
                </div>
                <Button variant="outlined" className="text-[11px] py-1 px-2">View</Button>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-750 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs">
                  <ShieldCheckIcon className="size-5 text-emerald-600" />
                  <div>
                    <span className="font-semibold block">KYC Verification</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Verified</span>
                  </div>
                </div>
                <Button variant="outlined" className="text-[11px] py-1 px-2">Verified</Button>
              </div>

              {documents.map((doc: any) => (
                <div key={doc.id} className="p-3 rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-750 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs">
                    <DocumentTextIcon className="size-5 text-primary-600" />
                    <div>
                      <span className="font-semibold block capitalize">{doc.type} Document</span>
                      <span className="text-[10px] text-slate-400 font-mono">{doc.fileUrl || "Uploaded"}</span>
                    </div>
                  </div>
                  <Button variant="outlined" className="text-[11px] py-1 px-2">Download</Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Redesigned Authorize Booking Modal ──────────────────────── */}
        {showApproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="max-w-lg w-full bg-white dark:bg-dark-750 border border-slate-200 dark:border-dark-600 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                    <CheckCircleIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                      Authorize Booking #{booking.bookingNo}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-dark-300 mt-0.5">
                      Unit: <span className="font-semibold text-slate-800 dark:text-dark-100">{booking.unit?.unitNo}</span> • Customer: <span className="font-semibold text-slate-800 dark:text-dark-100">{primaryApp.firstName} {primaryApp.lastName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setApprovalRemarks("");
                    setApprovalError("");
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              {/* Alert Info Banner */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
                <ClockIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  Discount granted: <strong className="text-amber-950 dark:text-amber-100">{booking.discountPct}%</strong> (₹{parseFloat(booking.discountAmt || "0").toLocaleString("en-IN")}). Confirming will mark the booking status as <strong>Booked</strong>.
                </div>
              </div>

              {/* Remarks Form Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-200">
                    Sales Head Approval Remarks <span className="text-rose-500 font-bold">* (Required)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-dark-400">
                    {approvalRemarks.trim().length} chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={approvalRemarks}
                  onChange={(e) => {
                    setApprovalRemarks(e.target.value);
                    if (approvalError && e.target.value.trim()) setApprovalError("");
                  }}
                  placeholder="e.g. Approved special promotional discount authorized by Director."
                  className={`w-full text-xs p-3 rounded-xl border transition-all duration-150 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-dark-100 focus:outline-none focus:ring-2 ${
                    approvalError
                      ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500/20"
                      : "border-slate-300 dark:border-dark-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
                {approvalError && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-0.5">
                    <ExclamationCircleIcon className="size-3.5 inline" />
                    {approvalError}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-dark-700">
                <Button
                  variant="outlined"
                  disabled={approving}
                  onClick={() => {
                    setShowApproveModal(false);
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
                  onClick={handleApprove}
                  className={`text-xs py-2 px-5 font-semibold flex items-center gap-1.5 ${
                    !approvalRemarks.trim()
                      ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-dark-600 text-slate-500"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                  }`}
                >
                  <CheckCircleIcon className="size-4" />
                  {approving ? "Approving..." : "Confirm Approval"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Redesigned Reject Booking Modal ───────────────────────────── */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="max-w-lg w-full bg-white dark:bg-dark-750 border border-slate-200 dark:border-dark-600 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner shrink-0">
                    <XMarkIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                      Reject Booking #{booking.bookingNo}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-dark-300 mt-0.5">
                      Unit: <span className="font-semibold text-slate-800 dark:text-dark-100">{booking.unit?.unitNo}</span> • Customer: <span className="font-semibold text-slate-800 dark:text-dark-100">{primaryApp.firstName} {primaryApp.lastName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectRemarks("");
                    setRejectError("");
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              {/* Alert Info Box */}
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200 leading-relaxed flex items-start gap-2.5">
                <ExclamationCircleIcon className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div>
                  Rejecting will <strong>cancel</strong> this booking file and return Unit <strong>{booking.unit?.unitNo}</strong> back to <strong>Available</strong> status in project elevation.
                </div>
              </div>

              {/* Remarks Form Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-200">
                    Rejection Reason / Remarks <span className="text-rose-500 font-bold">* (Required)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-dark-400">
                    {rejectRemarks.trim().length} chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={rejectRemarks}
                  onChange={(e) => {
                    setRejectRemarks(e.target.value);
                    if (rejectError && e.target.value.trim()) setRejectError("");
                  }}
                  placeholder="e.g. Non-compliant concession requested, booking cancelled per management policy."
                  className={`w-full text-xs p-3 rounded-xl border transition-all duration-150 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-dark-100 focus:outline-none focus:ring-2 ${
                    rejectError
                      ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500/20"
                      : "border-slate-300 dark:border-dark-600 focus:border-rose-500 focus:ring-rose-500/20"
                  }`}
                />
                {rejectError && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-0.5">
                    <ExclamationCircleIcon className="size-3.5 inline" />
                    {rejectError}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-dark-700">
                <Button
                  variant="outlined"
                  disabled={rejecting}
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectRemarks("");
                    setRejectError("");
                  }}
                  className="text-xs py-2 px-4"
                >
                  Cancel
                </Button>
                <Button
                  color="error"
                  disabled={rejecting || !rejectRemarks.trim()}
                  onClick={handleReject}
                  className={`text-xs py-2 px-5 font-semibold flex items-center gap-1.5 ${
                    !rejectRemarks.trim()
                      ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-dark-600 text-slate-500"
                      : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                  }`}
                >
                  <XMarkIcon className="size-4" />
                  {rejecting ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
