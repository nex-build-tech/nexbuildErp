import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  UserGroupIcon,
  CheckCircleIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  PlusIcon,
  ClockIcon,
  TagIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";

interface DashboardData {
  partner: {
    id: number;
    firmName: string;
    tier: string;
    reraNo?: string;
    status: string;
  };
  activeLeadsProtected: number;
  dealsClosed: number;
  accruedCommission: number;
  paidCommission: number;
}

interface TaggedLead {
  tagId: number;
  leadId: number;
  name: string;
  mobile: string;
  stage: string;
  daysRemaining: number;
  isExpired: boolean;
  taggedAt: string;
}

export default function CpDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardData | null>(null);
  const [recentLeads, setRecentLeads] = useState<TaggedLead[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick tag form
  const [quickForm, setQuickForm] = useState({
    name: "",
    mobile: "",
    configPref: "2 BHK",
    budgetMax: 8500000,
  });
  const [tagSuccess, setTagSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [metricsRes, leadsRes] = await Promise.all([
        axios.get("/realty/channel-partners/portal/dashboard?cpId=1"),
        axios.get("/realty/channel-partners/1/leads"),
      ]);
      const rawMetrics = metricsRes.data?.data;
      const metricsData =
        rawMetrics && typeof rawMetrics === "object" && "partner" in rawMetrics
          ? rawMetrics
          : rawMetrics?.data && typeof rawMetrics.data === "object" && "partner" in rawMetrics.data
          ? rawMetrics.data
          : rawMetrics;
      setMetrics(metricsData || null);

      const rawLeads = leadsRes.data?.data;
      const leadsList = Array.isArray(rawLeads)
        ? rawLeads
        : Array.isArray(rawLeads?.data)
        ? rawLeads.data
        : [];
      setRecentLeads(leadsList.slice(0, 5));
    } catch (err) {
      console.error("Failed to load CP portal dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/realty/channel-partners/leads/tag", {
        cpId: metrics?.partner?.id || 1,
        name: quickForm.name,
        mobile: quickForm.mobile,
        configPref: quickForm.configPref,
        budgetMax: quickForm.budgetMax,
        evidence: "Direct registration via CP Quick Portal Desk",
      });

      setTagSuccess(`✅ Client ${quickForm.name} successfully tagged with 60-day protection window.`);
      setQuickForm({ name: "", mobile: "", configPref: "2 BHK", budgetMax: 8500000 });
      fetchDashboard();
      setTimeout(() => setTagSuccess(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to tag customer");
    }
  };

  return (
    <Page title="Channel Partner Desk">
      <div className="space-y-6">
        {/* Partner Header Banner */}
        <Card className="p-6 bg-gradient-to-r from-gray-900 to-primary-950 text-white rounded-2xl border-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {metrics?.partner?.firmName || "Channel Partner Advisory Portal"}
                </h1>
                <Badge variant="filled" color="warning" className="uppercase font-bold text-xs tracking-wider">
                  {metrics?.partner?.tier || "Silver"} Partner
                </Badge>
              </div>
              <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
                <span>MahaRERA: {metrics?.partner?.reraNo || "Registered & Verified"}</span>
                <span>•</span>
                <span>Developer: Kings Builders & Developers</span>
                <span>•</span>
                <span>Project: Kings Heights Tower A & B</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="filled"
                color="primary"
                onClick={() => navigate("/cp/leads?action=tag")}
              >
                <PlusIcon className="w-4 h-4 mr-1.5" />
                Tag New Customer
              </Button>
            </div>
          </div>
        </Card>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <ShieldCheckIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Leads Protected</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics?.activeLeadsProtected ?? (loading ? "..." : 0)}
                </span>
                <span className="text-xs text-emerald-600 font-medium">60-Day Lock</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <CheckCircleIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Deals Closed</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics?.dealsClosed ?? (loading ? "..." : 0)} Units
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <BanknotesIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Accrued Commission</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ₹{((metrics?.accruedCommission || 0) / 100000).toFixed(2)}L
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <DocumentCheckIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Commission Disbursed</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  ₹{((metrics?.paidCommission || 0) / 100000).toFixed(2)}L
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* 2-Column Grid: Quick Tag & Recent Tagged Leads */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Tag Form */}
          <Card className="p-6 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <TagIcon className="w-5 h-5 text-primary-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Quick Tag Prospective Buyer
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Register customer details instantly to lock in your 60-day protection window.
            </p>

            {tagSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
                {tagSuccess}
              </div>
            )}

            <form onSubmit={handleQuickTag} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickForm.name}
                  onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  placeholder="e.g. Ramesh Patel"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Mobile (+91) *
                </label>
                <input
                  type="tel"
                  required
                  value={quickForm.mobile}
                  onChange={(e) => setQuickForm({ ...quickForm, mobile: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono"
                  placeholder="9820011223"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Requirement
                  </label>
                  <select
                    value={quickForm.configPref}
                    onChange={(e) => setQuickForm({ ...quickForm, configPref: e.target.value })}
                    className="w-full py-2 px-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK Penthouse">4 BHK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={quickForm.budgetMax}
                    onChange={(e) => setQuickForm({ ...quickForm, budgetMax: Number(e.target.value) })}
                    className="w-full py-2 px-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono"
                    step={500000}
                  />
                </div>
              </div>

              <Button type="submit" variant="filled" color="primary" className="w-full text-xs mt-2">
                Lock 60-Day Tag
              </Button>
            </form>
          </Card>

          {/* Recent Tagged Leads with Validity Countdown */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-primary-500" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  My Protected Leads & Deal Progress
                </h2>
              </div>
              <Button
                variant="outlined"
                color="primary"
                className="text-xs"
                onClick={() => navigate("/cp/leads")}
              >
                View All Leads
              </Button>
            </div>

            {recentLeads.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <UserGroupIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No tagged leads registered yet.</p>
                <p className="text-xs">Use the quick form on the left to tag your prospective buyers.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.tagId}
                    className="p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {lead.name}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {lead.mobile}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Tagged on {new Date(lead.taggedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          lead.daysRemaining > 15
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}>
                          ⏳ {lead.daysRemaining} Days Left
                        </span>
                        <div className="text-[11px] text-gray-400 mt-0.5 capitalize">
                          Stage: {lead.stage.replace(/_/g, " ")}
                        </div>
                      </div>
                      <Badge variant="soft" color={lead.stage === "booked" ? "success" : "primary"}>
                        {lead.stage}
                      </Badge>
                    </div>
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
