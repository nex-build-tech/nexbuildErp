import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  UserGroupIcon,
  PlusIcon,
  TagIcon,
  XMarkIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface TaggedLead {
  tagId: number;
  leadId: number;
  name: string;
  mobile: string;
  stage: string;
  score: number;
  temperature: string;
  configPref?: string;
  budgetMax?: string;
  daysRemaining: number;
  isExpired: boolean;
  taggedAt: string;
  validTill: string;
}

export default function CpLeadsPage() {
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<TaggedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "booked" | "expired">("all");

  const [showTagModal, setShowTagModal] = useState(searchParams.get("action") === "tag");
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    configPref: "2 BHK",
    budgetMax: 8500000,
    notes: "",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/channel-partners/1/leads");
      const raw = res.data?.data;
      const data = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setLeads(data);
    } catch (err) {
      console.error("Failed to load CP leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTagLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/realty/channel-partners/leads/tag", {
        cpId: 1, // Default CP partner ID
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email || undefined,
        configPref: formData.configPref,
        budgetMax: formData.budgetMax,
        evidence: "Tagged via CP Portal Leads Workspace",
      });

      setShowTagModal(false);
      setFormData({
        name: "",
        mobile: "",
        email: "",
        configPref: "2 BHK",
        budgetMax: 8500000,
        notes: "",
      });
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to tag customer");
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (activeTab === "active" && (l.isExpired || l.stage === "booked")) return false;
    if (activeTab === "booked" && l.stage !== "booked") return false;
    if (activeTab === "expired" && !l.isExpired) return false;

    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.mobile.includes(q);
  });

  return (
    <Page title="My Tagged Leads">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Tagged Leads & Protection Desk
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              60-day anti-collision window. Your leads are locked to your firm.
            </p>
          </div>
          <Button
            variant="filled"
            color="primary"
            onClick={() => setShowTagModal(true)}
          >
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Tag New Customer
          </Button>
        </div>

        {/* Protection Banner */}
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50/40 dark:from-emerald-950/20 dark:to-blue-950/20 border-emerald-200">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-gray-900 dark:text-white">
                Guaranteed 60-Day Commercial Protection
              </span>
              <p className="text-gray-600 dark:text-gray-300">
                Any customer tagged here is exclusively credited to your agency. Even if the customer walks into the sales lounge directly within 60 days, full brokerage will be credited to you upon agreement.
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-6">
            {[
              { id: "all", label: `All Prospects (${leads.length})` },
              { id: "active", label: "Active Protection Window" },
              { id: "booked", label: "Closed / Booked Deals" },
              { id: "expired", label: "Expired Tags" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or mobile number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Requirement</th>
                  <th className="py-3.5 px-4">Tagged On</th>
                  <th className="py-3.5 px-4">Protection Window</th>
                  <th className="py-3.5 px-4 text-right">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">Loading prospects...</td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <UserGroupIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No matching prospects found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((l) => (
                    <tr key={l.tagId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                        {l.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {l.mobile}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-xs">{l.configPref || "2 BHK"}</div>
                        <div className="text-[11px] text-gray-500">
                          {l.budgetMax ? `₹${(Number(l.budgetMax) / 100000).toFixed(1)}L` : "Open"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {new Date(l.taggedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {l.isExpired ? (
                          <Badge variant="soft" color="error" className="text-xs">
                            Expired
                          </Badge>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            l.daysRemaining > 15
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}>
                            ⏳ {l.daysRemaining} Days Left
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge
                          variant="soft"
                          color={l.stage === "booked" ? "success" : "primary"}
                          className="capitalize text-xs"
                        >
                          {l.stage.replace(/_/g, " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal: Tag Lead */}
        {showTagModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg p-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Tag Client for 60-Day Protection</h3>
                </div>
                <button onClick={() => setShowTagModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTagLead} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    placeholder="e.g. Nilesh Shah"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mobile Number (+91) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono"
                      placeholder="9820011223"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      placeholder="nilesh@gmail.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preferred Configuration
                    </label>
                    <select
                      value={formData.configPref}
                      onChange={(e) => setFormData({ ...formData, configPref: e.target.value })}
                      className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <option value="1 BHK">1 BHK (Compact)</option>
                      <option value="2 BHK">2 BHK (Luxury)</option>
                      <option value="3 BHK">3 BHK (Grand)</option>
                      <option value="4 BHK Penthouse">4 BHK Penthouse</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Approx Budget (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                      className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono"
                      step={500000}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Button type="button" variant="outlined" color="neutral" onClick={() => setShowTagModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="filled" color="primary">
                    Tag Customer & Lock 60 Days
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
}
