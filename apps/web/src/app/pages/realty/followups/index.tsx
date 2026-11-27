import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  CalendarDaysIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { FormModal, FormSection, FormActions, InfoRow, FormInput, FormSelect, FormTextarea } from "../_shared/FormModal";

interface FollowupItem {
  id: number;
  leadId: number;
  leadName: string;
  leadMobile: string;
  temperature: "hot" | "warm" | "cold";
  dueAt: string;
  type: string;
  status: "pending" | "completed" | "missed";
  notes?: string;
  completedAt?: string | null;
  outcome?: string;
}

export default function RealtyFollowupsPage() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "overdue" | "upcoming" | "completed">("today");

  // Complete Modal
  const [selectedFollowup, setSelectedFollowup] = useState<FollowupItem | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDate, setNextDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [nextType, setNextType] = useState("call");
  const [nextNotes, setNextNotes] = useState("");

  useEffect(() => {
    fetchFollowups();
  }, [activeTab]);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/crm/followups", {
        params: { filter: activeTab },
      });
      setFollowups(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load follow-ups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowup) return;
    try {
      await axios.patch(`/realty/crm/followups/${selectedFollowup.id}/done`, {
        outcome: outcomeNotes,
      });

      if (scheduleNext) {
        await axios.post(`/realty/crm/leads/${selectedFollowup.leadId}/followups`, {
          dueAt: new Date(nextDate).toISOString(),
          type: nextType,
          notes: nextNotes || "Subsequent follow-up",
        });
      }

      setSelectedFollowup(null);
      setOutcomeNotes("");
      setScheduleNext(false);
      fetchFollowups();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to mark follow-up completed");
    }
  };

  const now = new Date();
  const isOverdue = (dueAt: string) => new Date(dueAt) < now;

  return (
    <Page title="Scheduled Follow-ups & Calling Agenda">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pre-Sales & Sales Calling Agenda
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage client touchpoints, track conversations, and avoid follow-up slippage
            </p>
          </div>
          <Button
            variant="filled"
            color="primary"
            onClick={() => navigate("/realty/leads")}
          >
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Pick Lead to Call
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-6">
            {[
              { id: "today", label: "Due Today", icon: ClockIcon },
              { id: "overdue", label: "Overdue Alerts", icon: ExclamationCircleIcon },
              { id: "upcoming", label: "Upcoming (Next 7 Days)", icon: CalendarDaysIcon },
              { id: "completed", label: "Completed History", icon: CheckCircleIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Followups List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Priority / Temp</th>
                  <th className="py-3.5 px-4">Due Date & Time</th>
                  <th className="py-3.5 px-4">Action Type</th>
                  <th className="py-3.5 px-4">Agenda / Notes</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      Loading follow-ups...
                    </td>
                  </tr>
                ) : followups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <CheckCircleIcon className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        No follow-ups in this view!
                      </p>
                      <p className="text-xs text-gray-400">All planned tasks are completed.</p>
                    </td>
                  </tr>
                ) : (
                  followups.map((f) => {
                    const overdue = f.status === "pending" && isOverdue(f.dueAt);
                    return (
                      <tr
                        key={f.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition ${
                          overdue ? "bg-red-50/30 dark:bg-red-950/20" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {f.leadName}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {f.leadMobile}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant="soft"
                            color={
                              f.temperature === "hot"
                                ? "error"
                                : f.temperature === "warm"
                                ? "warning"
                                : "neutral"
                            }
                            className="text-xs uppercase font-bold"
                          >
                            {f.temperature}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {new Date(f.dueAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(f.dueAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 capitalize font-medium text-gray-700 dark:text-gray-300">
                          {f.type}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                            {f.notes || "Routine follow-up discussion"}
                          </p>
                          {f.outcome && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate mt-0.5">
                              Outcome: {f.outcome}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {f.status === "completed" ? (
                            <Badge variant="soft" color="success" className="text-xs">
                              Done
                            </Badge>
                          ) : overdue ? (
                            <Badge variant="soft" color="error" className="text-xs font-semibold">
                              Overdue
                            </Badge>
                          ) : (
                            <Badge variant="soft" color="warning" className="text-xs">
                              Pending
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`tel:${f.leadMobile}`}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              title="Call"
                            >
                              <PhoneIcon className="w-4 h-4" />
                            </a>
                            <a
                              href={`https://wa.me/${f.leadMobile.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                              title="WhatsApp"
                            >
                              <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            </a>
                            {f.status === "pending" && (
                              <Button
                                variant="filled"
                                color="success"
                                className="px-2.5 py-1 text-xs"
                                onClick={() => setSelectedFollowup(f)}
                              >
                                Complete
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              color="neutral"
                              className="px-2 py-1 text-xs"
                              onClick={() => navigate(`/realty/leads/${f.leadId}`)}
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </Button>
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

        {/* Modal: Complete Follow-up */}
        {selectedFollowup && (
          <FormModal
            title={`Record Outcome: ${selectedFollowup.leadName}`}
            icon={<CheckCircleIcon className="w-4 h-4" />}
            onClose={() => setSelectedFollowup(null)}
            maxWidth="md"
          >
            <form onSubmit={handleMarkDone} className="space-y-5">
              <InfoRow label="Lead" value={selectedFollowup.leadName} />
              <InfoRow label="Mobile" value={selectedFollowup.leadMobile} />
              <InfoRow
                label="Scheduled"
                value={new Date(selectedFollowup.dueAt).toLocaleString()}
              />

              <FormSection label="Outcome">
                <FormTextarea
                  label="Call / Conversation Outcome"
                  rows={3}
                  required
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="e.g. Customer agreed to schedule site visit for this Saturday with family..."
                />
              </FormSection>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleNext}
                    onChange={(e) => setScheduleNext(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Schedule Next Follow-up Immediately
                  </span>
                </label>
              </div>

              {scheduleNext && (
                <FormSection label="Next Follow-up">
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Next Due Date"
                      type="datetime-local"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                    />
                    <FormSelect
                      label="Mode"
                      value={nextType}
                      onChange={(e) => setNextType(e.target.value)}
                      options={[
                        { label: "Phone Call", value: "call" },
                        { label: "WhatsApp", value: "whatsapp" },
                        { label: "In-Person Meeting", value: "meeting" },
                      ]}
                    />
                  </div>
                  <FormInput
                    label="Agenda / Reminder Note"
                    type="text"
                    value={nextNotes}
                    onChange={(e) => setNextNotes(e.target.value)}
                    placeholder="Next agenda reminder..."
                  />
                </FormSection>
              )}

              <FormActions>
                <Button
                  type="button"
                  variant="outlined"
                  color="neutral"
                  onClick={() => setSelectedFollowup(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="success">
                  Save & Mark Complete
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}
      </div>
    </Page>
  );
}
