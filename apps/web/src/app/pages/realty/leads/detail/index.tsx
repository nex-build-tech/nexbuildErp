import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  ArrowLeftIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { FormModal, FormSection, FormActions, FormInput, FormSelect, FormTextarea } from "../../_shared/FormModal";

interface LeadDetail {
  id: number;
  leadNo: string;
  firstName: string;
  lastName?: string;
  mobile: string;
  email?: string;
  stage: string;
  score: number;
  temperature: "hot" | "warm" | "cold";
  budgetMin?: string;
  budgetMax?: string;
  configPref?: string;
  purpose?: string;
  timeline?: string;
  notes?: string;
  sourceId?: number;
  sourceName?: string;
  campaignId?: number;
  campaignName?: string;
  cpId?: number;
  presalesOwnerId?: number;
  salesOwnerId?: number;
  slaBreached: boolean;
  firstResponseAt?: string | null;
  createdAt: string;
}

interface ActivityItem {
  id: number;
  type: string;
  direction?: string;
  outcome?: string;
  notes?: string;
  createdAt: string;
  userFullName?: string;
}

interface FollowupItem {
  id: number;
  dueAt: string;
  type: string;
  status: "pending" | "completed" | "missed";
  notes?: string;
  completedAt?: string | null;
  outcome?: string;
}

interface SiteVisitItem {
  id: number;
  scheduledAt: string;
  status: "scheduled" | "confirmed" | "completed" | "no_show" | "cancelled";
  completedAt?: string | null;
  rating?: number;
  feedback?: string;
  accompaniedBy?: string;
}

const STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "site_visit_scheduled", label: "Visit Scheduled" },
  { key: "site_visit_done", label: "Visit Done" },
  { key: "negotiation", label: "Negotiation" },
  { key: "booked", label: "Booked" },
  { key: "lost", label: "Lost" },
];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "followups" | "visits">("timeline");

  // Modals
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);

  // Form states
  const [activityForm, setActivityForm] = useState({
    type: "call",
    direction: "outbound",
    outcome: "Spoke to customer, interested in 2 BHK",
    notes: "",
  });

  const [followupForm, setFollowupForm] = useState({
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    type: "call",
    notes: "Follow-up on pricing and brochure",
  });

  const [visitForm, setVisitForm] = useState({
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16),
    notes: "Site visit to inspect Tower A sample flat",
    accompaniedBy: "Family",
  });

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/realty/crm/leads/${id}`);
      const data = res.data?.data;
      if (data) {
        setLead(data.lead);
        setActivities(data.activities || []);
        setFollowups(data.followups || []);
        setSiteVisits(data.siteVisits || []);
      }
    } catch (err) {
      console.error("Failed to fetch lead detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!lead || lead.stage === newStage) return;
    try {
      await axios.patch(`/realty/crm/leads/${lead.id}/stage`, {
        stage: newStage,
        notes: `Moved stage from ${lead.stage} to ${newStage}`,
      });
      fetchLeadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update lead stage");
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    try {
      await axios.post(`/realty/crm/leads/${lead.id}/activities`, activityForm);
      setShowActivityModal(false);
      setActivityForm({ type: "call", direction: "outbound", outcome: "", notes: "" });
      fetchLeadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to log activity");
    }
  };

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    try {
      await axios.post(`/realty/crm/leads/${lead.id}/followups`, {
        dueAt: new Date(followupForm.dueAt).toISOString(),
        type: followupForm.type,
        notes: followupForm.notes,
      });
      setShowFollowupModal(false);
      fetchLeadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to schedule follow-up");
    }
  };

  const handleCompleteFollowup = async (fId: number) => {
    try {
      await axios.patch(`/realty/crm/followups/${fId}/done`, {
        outcome: "Call completed successfully",
      });
      fetchLeadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to complete follow-up");
    }
  };

  const handleScheduleSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    try {
      await axios.post(`/realty/crm/leads/${lead.id}/site-visits`, {
        scheduledAt: new Date(visitForm.scheduledAt).toISOString(),
        notes: visitForm.notes,
        accompaniedBy: visitForm.accompaniedBy,
      });
      setShowVisitModal(false);
      fetchLeadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to schedule site visit");
    }
  };

  const handleUpdateVisitStatus = async (vId: number, status: string) => {
    try {
      await axios.patch(`/realty/crm/site-visits/${vId}/status`, {
        status,
        rating: 5,
        feedback: "Customer was impressed by sample flat and layout",
      });
      fetchLeadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update site visit status");
    }
  };

  if (loading) {
    return (
      <Page title="Loading Lead...">
        <div className="py-24 text-center text-gray-500">Loading Lead 360 Workspace...</div>
      </Page>
    );
  }

  if (!lead) {
    return (
      <Page title="Lead Not Found">
        <div className="py-24 text-center">
          <p className="text-gray-500 mb-4">Lead record was not found.</p>
          <Button variant="outlined" color="primary" onClick={() => navigate("/realty/leads")}>
            Back to Leads
          </Button>
        </div>
      </Page>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === lead.stage);

  return (
    <Page title={`Lead 360: ${lead.firstName} ${lead.lastName || ""}`}>
      <div className="space-y-6">
        {/* Top Navigation & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/realty/leads")}
              className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {lead.firstName} {lead.lastName || ""}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    lead.temperature === "hot"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : lead.temperature === "warm"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  }`}
                >
                  {lead.score} • {lead.temperature.toUpperCase()}
                </span>
                {lead.slaBreached && (
                  <Badge variant="soft" color="error" className="text-xs">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1 inline" />
                    SLA Breached
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {lead.leadNo} • Registered on {new Date(lead.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`tel:${lead.mobile}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg transition"
            >
              <PhoneIcon className="w-4 h-4" /> Call
            </a>
            <a
              href={`https://wa.me/${lead.mobile.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded-lg transition"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" /> WhatsApp
            </a>
            <Button
              variant="outlined"
              color="neutral"
              className="text-xs"
              onClick={() => setShowFollowupModal(true)}
            >
              <CalendarDaysIcon className="w-4 h-4 mr-1.5" /> Follow-up
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              className="text-xs"
              onClick={() => setShowVisitModal(true)}
            >
              <BuildingOfficeIcon className="w-4 h-4 mr-1.5" /> Site Visit
            </Button>
            <Button
              variant="filled"
              color="primary"
              className="text-xs"
              onClick={() => setShowActivityModal(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1.5" /> Log Activity
            </Button>
          </div>
        </div>

        {/* Stage Progression Pipeline Bar */}
        <Card className="p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Lead Progression Stage
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {STAGES.map((s, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = s.key === lead.stage;
              return (
                <button
                  key={s.key}
                  onClick={() => handleStageChange(s.key)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold text-center border transition-all ${
                    isCurrent
                      ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                      : isPast
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isPast && <CheckCircleIcon className="w-3.5 h-3.5 inline" />}
                    <span>{s.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Lead 360 Profile Details */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">
                Customer & Requirement Profile
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Mobile Number</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 font-mono">
                    {lead.mobile}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block">Email Address</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {lead.email || "Not Provided"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block">Configuration Preference</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {lead.configPref || "Any Config"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block">Budget Range</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {lead.budgetMax
                      ? `₹${(Number(lead.budgetMin || 0) / 100000).toFixed(1)}L - ₹${(
                          Number(lead.budgetMax) / 100000
                        ).toFixed(1)}L`
                      : "Undisclosed"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block">Purchase Purpose & Timeline</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                    {lead.purpose?.replace(/_/g, " ") || "End Use"} •{" "}
                    {lead.timeline?.replace(/_/g, " ") || "Immediate"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block">Marketing Attribution</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="soft" color="neutral" className="text-xs">
                      {lead.sourceName || "Direct"}
                    </Badge>
                    {lead.campaignName && (
                      <span className="text-xs text-primary-600 font-medium">
                        {lead.campaignName}
                      </span>
                    )}
                  </div>
                </div>

                {lead.notes && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs text-gray-400 block">Notes & Preferences</span>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {lead.notes}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h2 className="text-sm font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider pb-2 border-b border-gray-100 dark:border-gray-800">
                Quick Sales Actions
              </h2>
              <div className="space-y-2">
                <Button
                  variant="outlined"
                  color="neutral"
                  className="w-full justify-start text-xs"
                  onClick={() => navigate(`/realty/cost-sheets?leadId=${lead.id}`)}
                >
                  <CurrencyRupeeIcon className="w-4 h-4 mr-2 text-emerald-500" />
                  Generate Dynamic Cost Sheet
                </Button>
                <Button
                  variant="outlined"
                  color="neutral"
                  className="w-full justify-start text-xs"
                  onClick={() => navigate(`/realty/bookings?action=new&leadId=${lead.id}`)}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2 text-primary-500" />
                  Convert to Booking
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Interactive Tabs for Timeline, Follow-ups, and Visits */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`py-2.5 px-4 text-sm font-medium border-b-2 transition ${
                  activeTab === "timeline"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Activity Timeline ({activities.length})
              </button>
              <button
                onClick={() => setActiveTab("followups")}
                className={`py-2.5 px-4 text-sm font-medium border-b-2 transition ${
                  activeTab === "followups"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Follow-ups ({followups.length})
              </button>
              <button
                onClick={() => setActiveTab("visits")}
                className={`py-2.5 px-4 text-sm font-medium border-b-2 transition ${
                  activeTab === "visits"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Site Visits ({siteVisits.length})
              </button>
            </div>

            {/* Tab 1: Activity Timeline */}
            {activeTab === "timeline" && (
              <Card className="p-6">
                {activities.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    No activity logs recorded yet. Click "Log Activity" above to add notes, calls or WhatsApp discussions.
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
                    {activities.map((act) => (
                      <div key={act.id} className="relative flex items-start gap-4 pl-8">
                        <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-primary-500 border-2 border-white dark:border-gray-900" />
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-900 dark:text-white uppercase">
                              {act.type} {act.direction ? `(${act.direction})` : ""}
                            </span>
                            <span className="text-gray-400">
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {act.outcome && (
                            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mt-1">
                              Outcome: {act.outcome}
                            </p>
                          )}
                          {act.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line">
                              {act.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Tab 2: Follow-ups */}
            {activeTab === "followups" && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Scheduled Follow-ups
                  </h3>
                  <Button
                    variant="outlined"
                    color="primary"
                    className="text-xs"
                    onClick={() => setShowFollowupModal(true)}
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1" /> Add Follow-up
                  </Button>
                </div>

                {followups.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    No scheduled follow-ups for this lead.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followups.map((f) => (
                      <div
                        key={f.id}
                        className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 dark:text-white capitalize">
                              {f.type} Follow-up
                            </span>
                            <Badge
                              variant="soft"
                              color={f.status === "completed" ? "success" : "warning"}
                              className="text-[10px]"
                            >
                              {f.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Due on: {new Date(f.dueAt).toLocaleString()}
                          </p>
                          {f.notes && <p className="text-xs text-gray-600 mt-0.5">{f.notes}</p>}
                        </div>

                        {f.status !== "completed" && (
                          <Button
                            variant="filled"
                            color="success"
                            className="text-xs px-2.5 py-1"
                            onClick={() => handleCompleteFollowup(f.id)}
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5 mr-1" /> Done
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Tab 3: Site Visits */}
            {activeTab === "visits" && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Site Visit Inspection Records
                  </h3>
                  <Button
                    variant="outlined"
                    color="primary"
                    className="text-xs"
                    onClick={() => setShowVisitModal(true)}
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1" /> Schedule Visit
                  </Button>
                </div>

                {siteVisits.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    No site visits recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {siteVisits.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                              Visit Date: {new Date(v.scheduledAt).toLocaleString()}
                            </span>
                            <Badge
                              variant="soft"
                              color={v.status === "completed" ? "success" : "primary"}
                              className="capitalize text-[10px]"
                            >
                              {v.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          {v.accompaniedBy && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Accompanied by: {v.accompaniedBy}
                            </p>
                          )}
                          {v.feedback && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
                              "{v.feedback}" (Rating: {v.rating}/5)
                            </p>
                          )}
                        </div>

                        {v.status === "scheduled" && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outlined"
                              color="error"
                              className="text-xs px-2 py-1"
                              onClick={() => handleUpdateVisitStatus(v.id, "no_show")}
                            >
                              No-Show
                            </Button>
                            <Button
                              variant="filled"
                              color="success"
                              className="text-xs px-2.5 py-1"
                              onClick={() => handleUpdateVisitStatus(v.id, "completed")}
                            >
                              Mark Completed
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Modal: Log Activity */}
        {showActivityModal && (
          <FormModal
            title="Log Call / Activity"
            subtitle="Record phone calls, meetings, or internal updates"
            icon={<PlusIcon className="w-5 h-5" />}
            onClose={() => setShowActivityModal(false)}
            maxWidth="md"
          >
            <form onSubmit={handleLogActivity} className="space-y-5">
              <FormSection label="Activity Type">
                <div className="grid grid-cols-2 gap-4">
                  <FormSelect
                    label="Activity Type"
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                    options={[
                      { label: "Phone Call", value: "call" },
                      { label: "WhatsApp", value: "whatsapp" },
                      { label: "Email", value: "email" },
                      { label: "In-Person Meeting", value: "meeting" },
                      { label: "Internal Note", value: "note" },
                    ]}
                  />
                  <FormSelect
                    label="Direction"
                    value={activityForm.direction}
                    onChange={(e) => setActivityForm({ ...activityForm, direction: e.target.value })}
                    options={[
                      { label: "Outbound", value: "outbound" },
                      { label: "Inbound", value: "inbound" },
                    ]}
                  />
                </div>
                <FormInput
                  label="Call / Conversation Outcome"
                  type="text"
                  required
                  value={activityForm.outcome}
                  onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                  placeholder="e.g. Discussed 2 BHK pricing, requested cost sheet"
                />
                <FormTextarea
                  label="Detailed Notes"
                  rows={3}
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                  placeholder="Specific remarks from customer..."
                />
              </FormSection>
              <FormActions>
                <Button type="button" variant="outlined" color="neutral" onClick={() => setShowActivityModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="primary">
                  Save Activity
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}

        {/* Modal: Schedule Follow-up */}
        {showFollowupModal && (
          <FormModal
            title="Schedule Next Follow-up"
            subtitle="Set up reminder date and communication channel"
            icon={<CalendarDaysIcon className="w-5 h-5" />}
            onClose={() => setShowFollowupModal(false)}
            maxWidth="md"
          >
            <form onSubmit={handleScheduleFollowup} className="space-y-5">
              <FormSection label="Follow-up Details">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Due Date & Time"
                    type="datetime-local"
                    required
                    value={followupForm.dueAt}
                    onChange={(e) => setFollowupForm({ ...followupForm, dueAt: e.target.value })}
                  />
                  <FormSelect
                    label="Follow-up Mode"
                    value={followupForm.type}
                    onChange={(e) => setFollowupForm({ ...followupForm, type: e.target.value })}
                    options={[
                      { label: "Phone Call", value: "call" },
                      { label: "WhatsApp", value: "whatsapp" },
                      { label: "Direct Meeting", value: "meeting" },
                    ]}
                  />
                </div>
                <FormTextarea
                  label="Agenda / Reminder Notes"
                  rows={3}
                  value={followupForm.notes}
                  onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
                  placeholder="Check if customer spoke with family..."
                />
              </FormSection>
              <FormActions>
                <Button type="button" variant="outlined" color="neutral" onClick={() => setShowFollowupModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="primary">
                  Schedule Follow-up
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}

        {/* Modal: Schedule Site Visit */}
        {showVisitModal && (
          <FormModal
            title="Schedule Site Visit"
            subtitle="Plan on-premise inspection and sample flat presentation"
            icon={<BuildingOfficeIcon className="w-5 h-5" />}
            onClose={() => setShowVisitModal(false)}
            maxWidth="md"
          >
            <form onSubmit={handleScheduleSiteVisit} className="space-y-5">
              <FormSection label="Visit Details">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Visit Date & Time"
                    type="datetime-local"
                    required
                    value={visitForm.scheduledAt}
                    onChange={(e) => setVisitForm({ ...visitForm, scheduledAt: e.target.value })}
                  />
                  <FormInput
                    label="Accompanied By"
                    type="text"
                    value={visitForm.accompaniedBy}
                    onChange={(e) => setVisitForm({ ...visitForm, accompaniedBy: e.target.value })}
                    placeholder="e.g. Spouse / Parents"
                  />
                </div>
                <FormTextarea
                  label="Visit Notes & Sample Flat to Show"
                  rows={3}
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                  placeholder="Show 2 BHK sample flat in Tower A..."
                />
              </FormSection>
              <FormActions>
                <Button type="button" variant="outlined" color="neutral" onClick={() => setShowVisitModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="primary">
                  Confirm Visit
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}
      </div>
    </Page>
  );
}
