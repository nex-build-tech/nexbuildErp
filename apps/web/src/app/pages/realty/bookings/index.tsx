import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import axios from "@/utils/axios";
import { useAuthContext } from "@/app/contexts/auth/context";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  DocumentCheckIcon,
  PlusIcon,
  CheckBadgeIcon,
  ClockIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  TrashIcon,
  BanknotesIcon,
  DocumentTextIcon,
  XMarkIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

interface BookingListItem {
  id: number;
  uuid: string;
  bookingNo: string;
  bookingDate: string;
  status: "draft" | "pending_approval" | "booked" | "agreement" | "agreement_done" | "registered" | "possession" | "cancelled";
  unitId: number;
  unitNo: string;
  siteId: number;
  carpetArea: string;
  soldRate: string;
  agreementValue: string;
  grandTotalInclGst: string;
  discountPct: string;
  schemeId: number;
  schemeName: string;
  applicantFirstName: string | null;
  applicantLastName: string | null;
  applicantMobile: string | null;
  applicantEmail: string | null;
  applicantPan: string | null;
  approvalRemarks?: string | null;
  approvalStatus?: string | null;
  approvalActedAt?: string | null;
}

export default function RealtyBookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const roleCode = typeof user?.role === "string" 
    ? user.role.toLowerCase() 
    : (user?.role?.code || "").toLowerCase();
  const isSalesHead = ["sales_head", "super_admin", "boss", "admin"].includes(roleCode);

  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Approval modal state
  const [approvingBooking, setApprovingBooking] = useState<BookingListItem | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  // Rejection modal state
  const [rejectingBooking, setRejectingBooking] = useState<BookingListItem | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  // Workflow Step 3: Approve -> Receipt Entry prompt
  const [approvedHandoffBooking, setApprovedHandoffBooking] = useState<BookingListItem | null>(null);

  // Workflow Step 2: Printable / Exportable Official Booking Form
  const [viewingBookingForm, setViewingBookingForm] = useState<BookingListItem | null>(null);
  const [bookingFormDetail, setBookingFormDetail] = useState<any>(null);
  const [loadingFormDetail, setLoadingFormDetail] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (search.trim()) {
        params.append("search", search.trim());
      }
      const res = await axios.get(`/realty/post-sales/bookings?${params.toString()}`);
      const data = res.data?.data || res.data || [];
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleApprove = async () => {
    if (!approvingBooking) return;
    if (!approvalRemarks.trim()) {
      setApprovalError("Approval remarks are required.");
      return;
    }
    const target = approvingBooking;
    try {
      setApproving(true);
      setApprovalError("");
      await axios.post(`/realty/post-sales/bookings/${target.id}/approve`, {
        remarks: approvalRemarks.trim(),
      });
      setApprovingBooking(null);
      setApprovalRemarks("");
      await fetchBookings();
      // Trigger Step 3 handoff prompt
      setApprovedHandoffBooking(target);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve booking");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingBooking) return;
    if (!rejectRemarks.trim()) {
      setRejectError("Rejection remarks are required.");
      return;
    }
    const target = rejectingBooking;
    try {
      setRejecting(true);
      setRejectError("");
      await axios.post(`/realty/post-sales/bookings/${target.id}/reject`, {
        remarks: rejectRemarks.trim(),
      });
      setRejectingBooking(null);
      setRejectRemarks("");
      await fetchBookings();
      alert(`Booking #${target.bookingNo} rejected and Unit ${target.unitNo} released.`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject booking");
    } finally {
      setRejecting(false);
    }
  };

  const handleDeleteBooking = async (b: BookingListItem) => {
    if (!confirm(`Are you sure you want to delete Booking #${b.bookingNo} for Unit ${b.unitNo}? This will release the unit back to inventory.`)) {
      return;
    }
    try {
      await axios.delete(`/realty/post-sales/bookings/${b.id}`);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete booking");
    }
  };

  const handleOpenBookingForm = async (b: BookingListItem) => {
    setViewingBookingForm(b);
    try {
      setLoadingFormDetail(true);
      const res = await axios.get(`/realty/post-sales/bookings/${b.id}`);
      setBookingFormDetail(res.data?.data || res.data);
    } catch (err) {
      console.error("Failed to load booking form detail", err);
    } finally {
      setLoadingFormDetail(false);
    }
  };

  const handleExportCSV = () => {
    if (bookings.length === 0) {
      alert("No booking records to export.");
      return;
    }
    const headers = [
      "Booking No",
      "Booking Date",
      "Status",
      "Unit No",
      "Carpet Area (sqft)",
      "Applicant Name",
      "Mobile",
      "Email",
      "PAN",
      "Agreement Value (INR)",
      "Payment Scheme",
    ];

    const rows = bookings.map((b) => [
      `"${b.bookingNo}"`,
      `"${b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("en-IN") : ""}"`,
      `"${b.status}"`,
      `"${b.unitNo}"`,
      `"${b.carpetArea}"`,
      `"${(b.applicantFirstName || "") + " " + (b.applicantLastName || "")}".trim()`,
      `"${b.applicantMobile || ""}"`,
      `"${b.applicantEmail || ""}"`,
      `"${b.applicantPan || ""}"`,
      `"${b.agreementValue || "0"}"`,
      `"${b.schemeName || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Booking_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary KPIs
  const totalBookingsCount = bookings.length;
  const bookedValue = bookings.reduce((sum, b) => sum + (parseFloat(b.agreementValue) || 0), 0);
  const pendingApprovalsCount = bookings.filter((b) => b.status === "pending_approval").length;
  const activeBookingsCount = bookings.filter((b) => ["booked", "agreement", "agreement_done", "registered", "possession"].includes(b.status)).length;

  const renderStatusWithTooltip = (b: BookingListItem) => {
    let badgeColor: "success" | "primary" | "info" | "secondary" | "warning" | "error" | "neutral" = "neutral";
    let label = b.status.replace("_", " ");
    switch (b.status) {
      case "booked":
        badgeColor = "success";
        label = "Booked";
        break;
      case "agreement":
      case "agreement_done":
        badgeColor = "primary";
        label = "Agreement Done";
        break;
      case "registered":
        badgeColor = "info";
        label = "Registered";
        break;
      case "possession":
        badgeColor = "secondary";
        label = "Possession";
        break;
      case "pending_approval":
        badgeColor = "warning";
        label = "Pending Approval";
        break;
      case "cancelled":
        badgeColor = "error";
        label = "Cancelled";
        break;
      default:
        badgeColor = "neutral";
    }

    const hasRemark = Boolean(b.approvalRemarks && b.approvalRemarks.trim());

    return (
      <div className="relative inline-flex items-center justify-center group cursor-help">
        <Badge
          color={badgeColor}
          className="capitalize text-xs font-medium cursor-help transition-transform group-hover:scale-105 select-none"
        >
          {label}
        </Badge>
        {hasRemark && (
          <span className="ml-1 text-slate-400 group-hover:text-amber-500 transition-colors">
            <ChatBubbleBottomCenterTextIcon className="size-3.5 inline" />
          </span>
        )}

        {/* Floating Tooltip On Mouse Hover */}
        {hasRemark && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 w-72 p-3 rounded-xl bg-slate-900/95 dark:bg-dark-800 text-white border border-slate-700/80 dark:border-dark-500 shadow-2xl backdrop-blur-md text-xs pointer-events-none transition-all duration-150">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/80 dark:border-dark-600">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-dark-300">
                Sales Head Remark
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  b.approvalStatus === "approved" || b.status === "booked"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : b.approvalStatus === "rejected" || b.status === "cancelled"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {(b.approvalStatus || (b.status === "cancelled" ? "REJECTED" : "APPROVED")).toUpperCase()}
              </span>
            </div>
            <p className="text-slate-100 dark:text-dark-100 text-xs italic break-words leading-relaxed text-left">
              &ldquo;{b.approvalRemarks}&rdquo;
            </p>
            {b.approvalActedAt && (
              <span className="text-[10px] text-slate-400 dark:text-dark-400 mt-2 text-right">
                {new Date(b.approvalActedAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {/* Tooltip Caret */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95 dark:border-t-dark-800" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Page title="Bookings & Customer 360">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <DocumentCheckIcon className="size-7 text-primary-600" />
              Bookings &amp; Customer 360
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              End-to-end booking life-cycle, statutory encrypted Aadhaar compliance, milestone payment schedules &amp; approval workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              onClick={handleExportCSV}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ArrowDownTrayIcon className="size-4 text-slate-500" />
              Export Register
            </Button>
            <Button
              variant="outlined"
              onClick={fetchBookings}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ArrowPathIcon className="size-4" />
              Refresh
            </Button>
            <Button
              color="primary"
              onClick={() => navigate("/realty/bookings/new")}
              className="text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
            >
              <PlusIcon className="size-4" />
              New Booking Wizard
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-primary-500 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</span>
              <DocumentCheckIcon className="size-5 text-primary-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-dark-100 mt-2">
              {totalBookingsCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">All recorded files</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-500 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agreement Value</span>
              <CheckBadgeIcon className="size-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              ₹{(bookedValue / 10000000).toFixed(2)} Cr
            </div>
            <p className="text-xs text-slate-400 mt-1">Total ₹{Math.round(bookedValue).toLocaleString("en-IN")}</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
              <ClockIcon className="size-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
              {pendingApprovalsCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Awaiting Sales Head review</p>
          </Card>

          <Card className="p-4 border-l-4 border-l-indigo-500 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Units</span>
              <BuildingOffice2Icon className="size-5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
              {activeBookingsCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Booked, Agreement &amp; Reg</p>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Booking No, Unit No, Applicant Name, Mobile, PAN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <Button type="submit" variant="outlined" className="text-xs py-2 px-3">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
              >
                <option value="all">All Statuses</option>
                <option value="booked">Booked</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="agreement">Agreement Done</option>
                <option value="registered">Registered</option>
                <option value="possession">Possession</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Bookings Table */}
        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-800/60 border-b border-slate-200 dark:border-dark-700 text-slate-600 dark:text-dark-300 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Booking No</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">Primary Applicant</th>
                  <th className="py-3 px-3">Scheme</th>
                  <th className="py-3 px-3 text-right">Agreement Value</th>
                  <th className="py-3 px-3 text-center">Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700 text-slate-700 dark:text-dark-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <ArrowPathIcon className="size-6 animate-spin text-primary-500" />
                        <span>Loading bookings...</span>
                      </div>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <ExclamationCircleIcon className="size-8 text-slate-300" />
                        <span className="font-medium text-slate-600 dark:text-dark-200">No bookings found</span>
                        <span className="text-xs text-slate-400">Create a booking through the 7-step wizard to see it here.</span>
                        <Button
                          color="primary"
                          onClick={() => navigate("/realty/bookings/new")}
                          className="mt-2 text-xs py-1.5 px-3"
                        >
                          Launch Booking Wizard
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-750 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-primary-600 dark:text-primary-400">
                        <Link to={`/realty/bookings/${b.id}`} className="hover:underline flex items-center gap-1.5">
                          {b.bookingNo}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-dark-100">{b.unitNo}</div>
                        <div className="text-[10px] text-slate-400">{b.carpetArea} sqft</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900 dark:text-dark-100">
                          {b.applicantFirstName} {b.applicantLastName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{b.applicantMobile || "-"}</span>
                          {b.applicantPan && <span className="font-mono bg-slate-100 dark:bg-dark-700 px-1 rounded">{b.applicantPan}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-600 dark:text-dark-300 font-medium">{b.schemeName}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-dark-100">
                        ₹{parseFloat(b.agreementValue || "0").toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 whitespace-nowrap">
                        {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {renderStatusWithTooltip(b)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outlined"
                            onClick={() => navigate(`/realty/bookings/${b.id}`)}
                            className="text-xs py-1 px-2 flex items-center gap-1"
                            title="Open Customer 360 view"
                          >
                            <EyeIcon className="size-3.5" />
                            360 View
                          </Button>

                          <Button
                            variant="outlined"
                            onClick={() => handleOpenBookingForm(b)}
                            className="text-xs py-1 px-2 flex items-center gap-1 text-slate-700 dark:text-dark-200"
                            title="Export / Print Official Booking Application Form"
                          >
                            <DocumentTextIcon className="size-3.5 text-primary-600" />
                            Booking Form
                          </Button>

                          {/* Show Approve & Reject ONLY to Sales Head / Admin */}
                          {isSalesHead && b.status === "pending_approval" && (
                            <div className="flex items-center gap-1">
                              <Button
                                color="primary"
                                onClick={() => {
                                  setApprovingBooking(b);
                                  setApprovalRemarks("");
                                  setApprovalError("");
                                }}
                                className="text-xs py-1 px-2.5 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                title="Approve Booking (Sales Head only)"
                              >
                                <CheckCircleIcon className="size-3.5" />
                                Approve
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setRejectingBooking(b);
                                  setRejectRemarks("");
                                  setRejectError("");
                                }}
                                className="text-xs py-1 px-2 flex items-center gap-1 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Reject Booking (Sales Head only)"
                              >
                                <XMarkIcon className="size-3.5" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {["draft", "pending_approval", "cancelled"].includes(b.status) && (
                            <button
                              onClick={() => handleDeleteBooking(b)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Booking & Release Unit"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Redesigned Approve Booking Modal ───────────────────────────── */}
        {approvingBooking && (
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
                      Approve Booking #{approvingBooking.bookingNo}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-dark-300 mt-0.5">
                      Unit: <span className="font-semibold text-slate-800 dark:text-dark-100">{approvingBooking.unitNo}</span> • Customer: <span className="font-semibold text-slate-800 dark:text-dark-100">{approvingBooking.applicantFirstName} {approvingBooking.applicantLastName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setApprovingBooking(null);
                    setApprovalRemarks("");
                    setApprovalError("");
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              {/* Alert Info Box - Spacious and fully separated */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
                <ClockIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  This booking requested a discount of <strong className="text-amber-950 dark:text-amber-100">{approvingBooking.discountPct}%</strong>. Confirming will approve the allocation and transition status to <strong>Booked</strong>.
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
                  placeholder="e.g. Approved special festival concession authorized by Director."
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
                    setApprovingBooking(null);
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

        {/* ── Redesigned Reject Booking Modal ────────────────────────────── */}
        {rejectingBooking && (
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
                      Reject Booking #{rejectingBooking.bookingNo}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-dark-300 mt-0.5">
                      Unit: <span className="font-semibold text-slate-800 dark:text-dark-100">{rejectingBooking.unitNo}</span> • Customer: <span className="font-semibold text-slate-800 dark:text-dark-100">{rejectingBooking.applicantFirstName} {rejectingBooking.applicantLastName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRejectingBooking(null);
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
                  Rejecting this booking will <strong>cancel</strong> the booking file and release Unit <strong>{rejectingBooking.unitNo}</strong> back to <strong>Available</strong> inventory.
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
                  placeholder="e.g. Discount requested exceeds allowable limits and customer refused standard payment schedule."
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
                    setRejectingBooking(null);
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

        {/* WORKFLOW STEP 3: Booking Approved -> Prompt to Create Initial Receipt Entry */}
        {approvedHandoffBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in">
            <Card className="max-w-md w-full p-6 shadow-2xl space-y-5 border-slate-200 dark:border-dark-700">
              <div className="text-center space-y-2">
                <div className="size-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckBadgeIcon className="size-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-dark-100">
                  Booking Approved Successfully!
                </h3>
                <p className="text-xs text-slate-500">
                  Booking #{approvedHandoffBooking.bookingNo} for Unit <strong>{approvedHandoffBooking.unitNo}</strong> is now confirmed.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-750 border border-slate-200 dark:border-dark-700 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Allottee:</span>
                  <span className="font-semibold text-slate-800 dark:text-dark-200">
                    {approvedHandoffBooking.applicantFirstName} {approvedHandoffBooking.applicantLastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Agreement Value:</span>
                  <span className="font-bold text-slate-900 dark:text-dark-100">
                    ₹{parseFloat(approvedHandoffBooking.agreementValue || "0").toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1.5 dark:border-dark-700">
                  <span className="text-slate-400">Workflow Handoff:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <BanknotesIcon className="size-3.5" />
                    Approve $\rightarrow$ Token Receipt Entry
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-dark-300 text-center">
                Would you like to enter the initial Booking / Token Advance Receipt right now?
              </p>

              <div className="flex flex-col gap-2 pt-2 border-t dark:border-dark-700">
                <Button
                  color="primary"
                  onClick={() => {
                    navigate(`/realty/receipts?bookingId=${approvedHandoffBooking.id}&action=new`);
                  }}
                  className="w-full text-xs py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-md font-semibold"
                >
                  <BanknotesIcon className="size-4" />
                  Create Token Receipt Entry Now
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setApprovedHandoffBooking(null)}
                  className="w-full text-xs py-2"
                >
                  Later / Return to Bookings Register
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* WORKFLOW STEP 2: Official Printable Booking Application Form */}
        {viewingBookingForm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 text-slate-900 max-h-[92vh] overflow-y-auto">
              {/* Header Bar */}
              <div className="flex justify-between items-center pb-4 mb-5 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-primary-100 text-primary-800 uppercase tracking-wider">
                    Official Booking Application Form
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Ref: #{viewingBookingForm.bookingNo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outlined"
                    onClick={() => window.print()}
                    className="text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <PrinterIcon className="size-4" />
                    Print Booking Form
                  </Button>
                  <button
                    onClick={() => {
                      setViewingBookingForm(null);
                      setBookingFormDetail(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                </div>
              </div>

              {loadingFormDetail ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                  <ArrowPathIcon className="size-6 animate-spin text-primary-600" />
                  <span>Loading full legal booking details...</span>
                </div>
              ) : (
                <div className="border border-slate-300 rounded-xl p-6 space-y-6 text-xs text-slate-800 bg-white shadow-sm">
                  {/* Top Company & RERA Header */}
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {bookingFormDetail?.company?.legalName || bookingFormDetail?.company?.name || "KINGS CONSTRUCTIONS PVT. LTD."}
                      </h2>
                      <p className="text-[11px] text-slate-600">
                        {bookingFormDetail?.company?.address || "Kings Corporate Tower, BKC, Mumbai - 400051"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        GSTIN: <strong>{bookingFormDetail?.company?.gstin || "27AABCK1234F1Z5"}</strong> | PAN: <strong>{bookingFormDetail?.company?.pan || "AABCK1234F"}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm">BOOKING APPLICATION FORM</p>
                      <p className="font-mono text-xs text-primary-700">Form No: {viewingBookingForm.bookingNo}</p>
                      <p className="text-[11px] text-slate-500">
                        Date: {viewingBookingForm.bookingDate ? new Date(viewingBookingForm.bookingDate).toLocaleDateString("en-IN") : "-"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        MahaRERA: {bookingFormDetail?.projectSettings?.reraRegistrationNo || "P52100012345"}
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Allottee Details */}
                  <div>
                    <h3 className="font-bold text-xs uppercase bg-slate-100 px-2.5 py-1 rounded text-slate-800 mb-2">
                      1. Applicant &amp; Co-Applicant Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Primary Allottee:</span>
                        <span className="font-semibold text-slate-900">
                          {viewingBookingForm.applicantFirstName} {viewingBookingForm.applicantLastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mobile Contact:</span>
                        <span>{viewingBookingForm.applicantMobile || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Email Address:</span>
                        <span>{viewingBookingForm.applicantEmail || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">PAN / Tax ID:</span>
                        <span className="font-mono font-semibold">{viewingBookingForm.applicantPan || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Property Specifications */}
                  <div>
                    <h3 className="font-bold text-xs uppercase bg-slate-100 px-2.5 py-1 rounded text-slate-800 mb-2">
                      2. Real Estate Unit Allotment
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Unit Number:</span>
                        <span className="font-bold text-slate-900 text-sm">{viewingBookingForm.unitNo}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Carpet Area (RERA):</span>
                        <span className="font-semibold">{viewingBookingForm.carpetArea} sq. ft.</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Payment Plan:</span>
                        <span className="font-semibold text-primary-700">{viewingBookingForm.schemeName || "Standard Milestone"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Current Status:</span>
                        <span className="font-bold uppercase text-emerald-700">{viewingBookingForm.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Financial Considerations */}
                  <div>
                    <h3 className="font-bold text-xs uppercase bg-slate-100 px-2.5 py-1 rounded text-slate-800 mb-2">
                      3. Financial Statement &amp; All-Inclusive Consideration
                    </h3>
                    <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-[11px] text-slate-700">
                        <tr>
                          <th className="py-1.5 px-3">Charge Component</th>
                          <th className="py-1.5 px-3 text-right">Calculation Base</th>
                          <th className="py-1.5 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-2 px-3 font-medium">Basic Agreement Value</td>
                          <td className="py-2 px-3 text-right text-slate-500 font-mono">
                            {viewingBookingForm.carpetArea} sqft @ ₹{viewingBookingForm.soldRate || "—"}/sqft
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">
                            ₹{parseFloat(viewingBookingForm.agreementValue || "0").toLocaleString("en-IN")}
                          </td>
                        </tr>
                        {viewingBookingForm.discountPct && parseFloat(viewingBookingForm.discountPct) > 0 && (
                          <tr className="text-emerald-700">
                            <td className="py-1.5 px-3">Approved Special Discount ({viewingBookingForm.discountPct}%)</td>
                            <td className="py-1.5 px-3 text-right font-mono">-</td>
                            <td className="py-1.5 px-3 text-right font-mono">- Approved</td>
                          </tr>
                        )}
                        <tr className="bg-slate-50 font-bold text-slate-900 border-t">
                          <td className="py-2 px-3">Total Consideration (Excl. Stamp Duty &amp; Reg.)</td>
                          <td className="py-2 px-3 text-right">All-Inclusive Total</td>
                          <td className="py-2 px-3 text-right font-mono text-sm text-primary-700">
                            ₹{parseFloat(viewingBookingForm.grandTotalInclGst || viewingBookingForm.agreementValue || "0").toLocaleString("en-IN")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 4: Terms & Signatures */}
                  <div className="pt-2 space-y-4">
                    <p className="text-[10px] text-slate-500 leading-relaxed italic border-t pt-3">
                      Terms &amp; Conditions: The allottee agrees to make milestone stage payments as per the approved scheme schedule. Any stamp duty, registration charges, and applicable Section 194-IA TDS are statutory liabilities of the allottee. This application is subject to realization of the token advance and developer management sign-off.
                    </p>

                    <div className="grid grid-cols-2 gap-8 pt-6">
                      <div className="text-center border-t border-slate-400 pt-2">
                        <span className="font-semibold text-slate-800">Signature of Primary Applicant</span>
                        <p className="text-[10px] text-slate-400">({viewingBookingForm.applicantFirstName} {viewingBookingForm.applicantLastName})</p>
                      </div>
                      <div className="text-center border-t border-slate-400 pt-2">
                        <span className="font-semibold text-slate-800">Authorized Developer Signatory</span>
                        <p className="text-[10px] text-slate-400">For {bookingFormDetail?.company?.name || "Kings Constructions Pvt. Ltd."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
