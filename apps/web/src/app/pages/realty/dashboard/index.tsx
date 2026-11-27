import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  UserGroupIcon,
  FireIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  PlusIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

interface DashboardMetrics {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  visitsScheduled: number;
  visitsDone: number;
  followupsToday: number;
  slaBreachedCount: number;
  stagesCount: Record<string, number>;
}

interface FollowupItem {
  id: number;
  leadId: number;
  leadName: string;
  leadMobile: string;
  dueAt: string;
  type: string;
  notes?: string;
  temperature: string;
}

interface LeadItem {
  id: number;
  leadNo: string;
  firstName: string;
  lastName?: string;
  mobile: string;
  email?: string;
  stage: string;
  score: number;
  temperature: "hot" | "warm" | "cold";
  budgetMax?: string;
  configPref?: string;
  sourceName?: string;
  slaBreached: boolean;
  createdAt: string;
}

export default function RealtyDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [todayFollowups, setTodayFollowups] = useState<FollowupItem[]>([]);
  const [hotLeads, setHotLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, followupsRes, leadsRes] = await Promise.all([
        axios.get("/realty/crm/dashboard"),
        axios.get("/realty/crm/followups?filter=today"),
        axios.get("/realty/crm/leads?temperature=hot&limit=6"),
      ]);

      const dashData = dashRes.data?.data !== undefined ? dashRes.data.data : dashRes.data;
      const fuData = Array.isArray(followupsRes.data?.data)
        ? followupsRes.data.data
        : Array.isArray(followupsRes.data)
        ? followupsRes.data
        : [];
      const ldData = Array.isArray(leadsRes.data?.data)
        ? leadsRes.data.data
        : Array.isArray(leadsRes.data)
        ? leadsRes.data
        : [];

      setMetrics(dashData || null);
      setTodayFollowups(fuData);
      setHotLeads(ldData);
    } catch (err) {
      console.error("Failed to load CRM dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const stageOrder = [
    { key: "new", label: "New Leads", color: "bg-blue-500" },
    { key: "contacted", label: "Contacted", color: "bg-indigo-500" },
    { key: "site_visit_scheduled", label: "Visit Scheduled", color: "bg-amber-500" },
    { key: "site_visit_done", label: "Visit Done", color: "bg-purple-500" },
    { key: "negotiation", label: "Negotiation", color: "bg-orange-500" },
    { key: "booked", label: "Booked", color: "bg-emerald-500" },
  ];

  const totalLeadsCount = metrics?.totalLeads || 1;

  return (
    <Page title="Sales & Pre-Sales CRM Dashboard">
      <div className="space-y-6">
        {/* Header with Title and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sales & CRM Command Center
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kings Heights Tower A & B • Pre-sales pipeline, today's agenda & SLA monitoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => navigate("/realty/followups")}
            >
              <CalendarDaysIcon className="w-4 h-4 mr-1.5" />
              Follow-ups
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={() => navigate("/realty/leads?action=new")}
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              New Lead
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <UserGroupIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Active Leads</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics?.totalLeads ?? (loading ? "..." : 0)}
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center">
                  <ArrowTrendingUpIcon className="w-3.5 h-3.5 mr-0.5 inline" /> +14%
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl">
              <FireIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Hot Leads 🔥</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {metrics?.hotLeads ?? (loading ? "..." : 0)}
                </span>
                <Badge variant="soft" color="error">High Priority</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <BuildingOfficeIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Site Visits Conducted</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {metrics?.visitsDone ?? (loading ? "..." : 0)}
                </span>
                <span className="text-xs text-gray-500">
                  ({metrics?.visitsScheduled ?? 0} scheduled)
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <ExclamationTriangleIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Breaches</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-bold ${Number(metrics?.slaBreachedCount || 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {metrics?.slaBreachedCount ?? (loading ? "..." : 0)}
                </span>
                {Number(metrics?.slaBreachedCount || 0) > 0 ? (
                  <Badge variant="soft" color="warning">Action Needed</Badge>
                ) : (
                  <Badge variant="soft" color="success">All Met</Badge>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Lead Pipeline Funnel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sales Pipeline Conversion Funnel
              </h2>
            </div>
            <Button
              variant="outlined"
              color="primary"
              className="text-xs"
              onClick={() => navigate("/realty/leads")}
            >
              View Full Pipeline
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stageOrder.map((stg) => {
              const count = metrics?.stagesCount?.[stg.key] || 0;
              const pct = Math.round((count / totalLeadsCount) * 100);
              return (
                <div
                  key={stg.key}
                  onClick={() => navigate(`/realty/leads?stage=${stg.key}`)}
                  className="cursor-pointer bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-primary-400 transition"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>{stg.label}</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{pct}%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {count}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full ${stg.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Two Column Grid: Today's Agenda & Hot Leads Watchlist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Follow-up Agenda */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Today's Follow-up Calls ({todayFollowups.length})
                  </h2>
                </div>
                <Button
                  variant="outlined"
                  color="neutral"
                  className="text-xs"
                  onClick={() => navigate("/realty/followups")}
                >
                  See All
                </Button>
              </div>

              {todayFollowups.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-medium text-gray-700 dark:text-gray-300">No overdue follow-ups for today!</p>
                  <p className="text-xs text-gray-400">All planned pre-sales follow-ups are up to date.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayFollowups.slice(0, 5).map((fu) => (
                    <div
                      key={fu.id}
                      className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/40"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {fu.leadName}
                          </p>
                          <Badge
                            variant="soft"
                            color={fu.temperature === "hot" ? "error" : fu.temperature === "warm" ? "warning" : "neutral"}
                            className="text-[10px]"
                          >
                            {(fu.temperature || "warm").toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {fu.notes || "Follow-up discussion scheduled"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={fu.leadMobile ? `tel:${fu.leadMobile}` : "#"}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                          title="Call"
                        >
                          <PhoneIcon className="w-4 h-4" />
                        </a>
                        <a
                          href={fu.leadMobile ? `https://wa.me/${fu.leadMobile.replace(/[^0-9]/g, "")}` : "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                          title="WhatsApp"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        </a>
                        <Button
                          variant="outlined"
                          color="primary"
                          className="text-xs px-2.5 py-1"
                          onClick={() => navigate(`/realty/leads/${fu.leadId}`)}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Hot Leads Watchlist */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FireIcon className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Hot Leads Priority Watchlist
                </h2>
              </div>
              <Button
                variant="outlined"
                color="neutral"
                className="text-xs"
                onClick={() => navigate("/realty/leads?temperature=hot")}
              >
                View Hot Leads
              </Button>
            </div>

            {hotLeads.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <p>No active hot leads at the moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hotLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/realty/leads/${lead.id}`)}
                    className="cursor-pointer p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/40 hover:border-red-300 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {lead.firstName || (lead as any).name || `Lead #${lead.id}`} {lead.lastName || ""}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded font-bold">
                          Score: {lead.score}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {lead.configPref || "Any Config"} • Budget:{" "}
                        {lead.budgetMax
                          ? `₹${(Number(lead.budgetMax) / 100000).toFixed(1)}L`
                          : "Undisclosed"}
                        {lead.sourceName ? ` • ${lead.sourceName}` : ""}
                      </p>
                    </div>
                    <Badge variant="soft" color="primary">
                      {lead.stage ? lead.stage.replace(/_/g, " ") : "NEW"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
