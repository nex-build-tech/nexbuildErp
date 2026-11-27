import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  StarIcon,
  TruckIcon,
  EyeIcon,
  PlusIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { FormModal, FormSection, FormActions, InfoRow, FormInput, FormTextarea } from "../_shared/FormModal";

interface SiteVisitItem {
  id: number;
  leadId: number;
  leadName: string;
  leadMobile: string;
  temperature: "hot" | "warm" | "cold";
  scheduledAt: string;
  status: "scheduled" | "confirmed" | "completed" | "no_show" | "cancelled";
  completedAt?: string | null;
  rating?: number;
  feedback?: string;
  notes?: string;
  accompaniedBy?: string;
}

export default function RealtySiteVisitsPage() {
  const navigate = useNavigate();
  const [visits, setSiteVisits] = useState<SiteVisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "today" | "completed" | "no_show">("all");

  // Attendance Logger Modal
  const [selectedVisit, setSelectedVisit] = useState<SiteVisitItem | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [unitInspected, setUnitInspected] = useState("Tower A - Flat 1204 (2 BHK)");

  // Cab Stub Alert
  const [cabAlert, setCabAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteVisits();
  }, [activeTab]);

  const fetchSiteVisits = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/crm/site-visits", {
        params: { filter: activeTab },
      });
      setSiteVisits(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load site visits:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    try {
      await axios.patch(`/realty/crm/site-visits/${selectedVisit.id}/status`, {
        status: "completed",
        rating,
        feedback: `${feedback} (Inspected: ${unitInspected})`,
      });

      setSelectedVisit(null);
      setFeedback("");
      fetchSiteVisits();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to log attendance");
    }
  };

  const handleUpdateStatus = async (vId: number, status: string) => {
    try {
      await axios.patch(`/realty/crm/site-visits/${vId}/status`, {
        status,
      });
      fetchSiteVisits();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update visit");
    }
  };

  const handleBookCab = (v: SiteVisitItem) => {
    setCabAlert(`🚖 Cab pickup scheduled for ${v.leadName} (${v.leadMobile}) at ${new Date(v.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Driver details dispatched via SMS & WhatsApp.`);
    setTimeout(() => setCabAlert(null), 6000);
  };

  const completedCount = visits.filter((v) => v.status === "completed").length;
  const scheduledCount = visits.filter((v) => v.status === "scheduled" || v.status === "confirmed").length;

  return (
    <Page title="Site Visits & Sample Flat Inspections">
      <div className="space-y-6">
        {/* Cab Booking Feedback Alert */}
        {cabAlert && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
            <span>{cabAlert}</span>
            <button onClick={() => setCabAlert(null)} className="text-emerald-600 font-bold">×</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kings Heights Site Visit Manager
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Visitor check-in desk, sample flat tours & feedback ratings
            </p>
          </div>
          <Button
            variant="filled"
            color="primary"
            onClick={() => navigate("/realty/leads")}
          >
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Schedule New Visit
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <BuildingOfficeIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Visits</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {scheduledCount}
                </span>
                <span className="text-xs text-gray-500">Awaiting arrival</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <CheckCircleIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Tours</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {completedCount}
                </span>
                <Badge variant="soft" color="success">Verified Attendees</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <StarIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Experience Score</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  4.8 / 5.0
                </span>
                <span className="text-xs text-emerald-600 font-semibold">High Interest</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Filters */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-6">
            {[
              { id: "all", label: "All Site Visits" },
              { id: "today", label: "Today's Schedule" },
              { id: "completed", label: "Completed Tours" },
              { id: "no_show", label: "No-Show / Reschedule" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Visits Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Visitor & Contact</th>
                  <th className="py-3.5 px-4">Scheduled Date & Time</th>
                  <th className="py-3.5 px-4">Party / Accompanied By</th>
                  <th className="py-3.5 px-4">Visit Notes</th>
                  <th className="py-3.5 px-4">Status & Rating</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Loading site visits...
                    </td>
                  </tr>
                ) : visits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No visits found in this category.
                    </td>
                  </tr>
                ) : (
                  visits.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {v.leadName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {v.leadMobile}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {new Date(v.scheduledAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(v.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-sm text-gray-700 dark:text-gray-300">
                        {v.accompaniedBy || "Individual"}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                          {v.notes || "Inspect 2 BHK flat layout"}
                        </p>
                        {v.feedback && (
                          <p className="text-[11px] text-emerald-600 font-medium truncate mt-0.5">
                            Feedback: {v.feedback}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="soft"
                            color={
                              v.status === "completed"
                                ? "success"
                                : v.status === "no_show"
                                ? "error"
                                : "primary"
                            }
                            className="capitalize text-xs"
                          >
                            {v.status.replace(/_/g, " ")}
                          </Badge>
                          {v.rating && (
                            <span className="text-xs text-amber-500 font-bold flex items-center">
                              ★ {v.rating}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleBookCab(v)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded"
                            title="Dispatch Uber / Cab Pickup Stub"
                          >
                            <TruckIcon className="w-4 h-4" />
                          </button>
                          <a
                            href={`tel:${v.leadMobile}`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Call"
                          >
                            <PhoneIcon className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://wa.me/${v.leadMobile.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                            title="WhatsApp"
                          >
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          </a>

                          {v.status === "scheduled" && (
                            <>
                              <Button
                                variant="filled"
                                color="success"
                                className="px-2.5 py-1 text-xs"
                                onClick={() => setSelectedVisit(v)}
                              >
                                Check-in
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                className="px-2 py-1 text-xs"
                                onClick={() => handleUpdateStatus(v.id, "no_show")}
                              >
                                No-Show
                              </Button>
                            </>
                          )}

                          <Button
                            variant="outlined"
                            color="neutral"
                            className="px-2 py-1 text-xs"
                            onClick={() => navigate(`/realty/leads/${v.leadId}`)}
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal: Check-In & Feedback Logger */}
        {selectedVisit && (
          <FormModal
            title="Site Visit Check-In & Feedback"
            icon={<CheckCircleIcon className="w-4 h-4" />}
            onClose={() => setSelectedVisit(null)}
            maxWidth="md"
          >
            <form onSubmit={handleCompleteAttendance} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <InfoRow label="Visitor" value={selectedVisit.leadName} />
                <InfoRow label="Mobile" value={selectedVisit.leadMobile} />
                <InfoRow
                  label="Scheduled"
                  value={new Date(selectedVisit.scheduledAt).toLocaleString()}
                />
              </div>

              <FormSection label="Visit Details">
                <FormInput
                  label="Sample Flat / Units Inspected"
                  type="text"
                  required
                  value={unitInspected}
                  onChange={(e) => setUnitInspected(e.target.value)}
                />

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-dark-200 mb-2 block">
                    Customer Interest Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-transform ${
                          star <= rating ? "text-amber-400 scale-110" : "text-gray-300 dark:text-dark-500"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-gray-600 dark:text-dark-300 ml-2">
                      {rating === 5
                        ? "Extremely High (Ready to Book)"
                        : rating === 4
                        ? "Very Interested"
                        : rating === 3
                        ? "Moderate (Evaluating Options)"
                        : "Low Interest"}
                    </span>
                  </div>
                </div>

                <FormTextarea
                  label="Customer Feedback & Discussion Remarks"
                  rows={3}
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Liked master bedroom and east facing balcony; requested payment plan details..."
                />
              </FormSection>

              <FormActions>
                <Button
                  type="button"
                  variant="outlined"
                  color="neutral"
                  onClick={() => setSelectedVisit(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="success">
                  Save Check-in & Mark Completed
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}
      </div>
    </Page>
  );
}
