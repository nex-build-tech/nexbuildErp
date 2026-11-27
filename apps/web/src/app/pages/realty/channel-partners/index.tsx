import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { useAuthContext } from "@/app/contexts/auth/context";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  UserGroupIcon,
  CheckBadgeIcon,
  ClockIcon,
  TrophyIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  EyeIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { FormModal, FormSection, FormActions, FormInput, FormSelect } from "../_shared/FormModal";

interface ChannelPartnerItem {
  id: number;
  uuid: string;
  firmName: string;
  contactPerson?: string;
  mobile: string;
  email?: string;
  reraNo?: string;
  pan?: string;
  gstin?: string;
  status: "pending_kyc" | "active" | "suspended";
  tier: "silver" | "gold" | "platinum";
  createdAt: string;
}

interface BrokerageEntry {
  id: number;
  bookingId: number;
  cpId: number;
  cpFirmName: string;
  cpTier: string;
  bookingNo: string;
  customerName: string;
  base: string;
  pct: string;
  brokerage: string;
  gst: string;
  tds194h: string;
  net: string;
  status: "accrued" | "eligible" | "invoiced" | "approved" | "paid";
  createdAt: string;
}

interface LeaderboardItem {
  cpId: number;
  firmName: string;
  contactPerson?: string;
  tier: string;
  leadsTagged: number;
  dealsClosed: number;
  totalSalesValue: number;
  totalBrokerageEarned: number;
  totalBrokeragePaid: number;
}

interface BrokerageSlab {
  id: number;
  siteId: number;
  tier: "silver" | "gold" | "platinum";
  fromCount: number;
  toCount?: number;
  pct: string;
}

export default function RealtyChannelPartnersPage() {
  const { user } = useAuthContext();
  const roleCode = typeof user?.role === "string" 
    ? user.role.toLowerCase() 
    : (user?.role?.code || "").toLowerCase();
  const isSalesHead = ["sales_head", "super_admin", "boss", "admin"].includes(roleCode);

  const [cps, setCps] = useState<ChannelPartnerItem[]>([]);
  const [brokerageEntries, setBrokerageEntries] = useState<BrokerageEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [slabs, setSlabs] = useState<BrokerageSlab[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: "directory" | "kyc" | "brokerage" | "slabs" | "leaderboard"
  const [activeTab, setActiveTab] = useState<"directory" | "kyc" | "brokerage" | "slabs" | "leaderboard">("directory");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState("");

  // Modals
  const [showNewCpModal, setShowNewCpModal] = useState(false);
  const [showSlabModal, setShowSlabModal] = useState(false);
  const [selectedCpDetail, setSelectedCpDetail] = useState<any | null>(null);

  // New CP Form
  const [cpForm, setCpForm] = useState({
    firmName: "",
    contactPerson: "",
    mobile: "",
    email: "",
    reraNo: "",
    pan: "",
    gstin: "",
    tier: "silver" as const,
  });

  // New Slab Form
  const [slabForm, setSlabForm] = useState({
    siteId: 1,
    tier: "silver" as const,
    fromCount: 1,
    toCount: 3,
    pct: 2.0,
  });

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const extractArray = (res: any) => {
        const raw = res?.data?.data;
        return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      };

      if (activeTab === "directory" || activeTab === "kyc") {
        const res = await axios.get("/realty/channel-partners");
        setCps(extractArray(res));
      } else if (activeTab === "brokerage") {
        const res = await axios.get("/realty/channel-partners/brokerage");
        setBrokerageEntries(extractArray(res));
      } else if (activeTab === "slabs") {
        const res = await axios.get("/realty/channel-partners/slabs?siteId=1");
        setSlabs(extractArray(res));
      } else if (activeTab === "leaderboard") {
        const res = await axios.get("/realty/channel-partners/leaderboard");
        setLeaderboard(extractArray(res));
      }
    } catch (err) {
      console.error("Failed to load channel partner data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/realty/public/channel-partners/register?tenantId=1", {
        ...cpForm,
        agreementAccepted: true,
      });
      setShowNewCpModal(false);
      setCpForm({
        firmName: "",
        contactPerson: "",
        mobile: "",
        email: "",
        reraNo: "",
        pan: "",
        gstin: "",
        tier: "silver",
      });
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to register Channel Partner");
    }
  };

  const handleUpdateKyc = async (cpId: number, status: "active" | "suspended") => {
    try {
      await axios.patch(`/realty/channel-partners/${cpId}/kyc`, { status });
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update KYC status");
    }
  };

  const handleApproveBrokerage = async (entryId: number) => {
    try {
      await axios.patch(`/realty/channel-partners/brokerage/${entryId}/approve`);
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve brokerage");
    }
  };

  const handleDisbursePayout = async (entryId: number) => {
    try {
      await axios.post(`/realty/channel-partners/brokerage/payout`, {
        entryId,
        bankRef: `NEFT-KH-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to disburse payout");
    }
  };

  const handleCreateSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/realty/channel-partners/slabs", slabForm);
      setShowSlabModal(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to configure slab");
    }
  };

  const handleViewDetail = async (cpId: number) => {
    try {
      const res = await axios.get(`/realty/channel-partners/${cpId}`);
      const raw = res.data?.data;
      const data = raw?.data !== undefined ? raw.data : raw;
      setSelectedCpDetail(data || null);
    } catch (err) {
      alert("Failed to load CP detail");
    }
  };

  const pendingKycCount = cps.filter((c) => c.status === "pending_kyc").length;
  const activeCpCount = cps.filter((c) => c.status === "active").length;

  const filteredCps = cps.filter((c) => {
    if (activeTab === "kyc" && c.status !== "pending_kyc") return false;
    if (selectedTier && c.tier !== selectedTier) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.firmName.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      (c.reraNo && c.reraNo.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q))
    );
  });

  return (
    <Page title="Channel Partners & Brokerage Engine">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Channel Partners & Brokerage Desk
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              RERA broker onboarding, lead protection window, Section 194-H TDS & payout approvals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setShowSlabModal(true)}
            >
              Configure Slabs
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={() => setShowNewCpModal(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              Onboard Partner
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
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Brokers</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeCpCount}
                </span>
                <Badge variant="soft" color="success">Approved</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <ClockIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending KYC Queue</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-bold ${pendingKycCount > 0 ? "text-amber-600" : "text-gray-900 dark:text-white"}`}>
                  {pendingKycCount}
                </span>
                {pendingKycCount > 0 && <Badge variant="soft" color="warning">Action Needed</Badge>}
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <BanknotesIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Statutory TDS 194-H</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  5.0%
                </span>
                <span className="text-xs text-gray-500">Auto Deducted</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <TrophyIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Protection Window</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  60 Days
                </span>
                <span className="text-xs text-gray-500">Anti-Collision</span>
              </div>
            </div>
          </Card>
        </div>

        {/* View Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-6 overflow-x-auto">
            {[
              { id: "directory", label: `Channel Partners (${cps.length})` },
              { id: "kyc", label: `Pending KYC (${pendingKycCount})` },
              { id: "brokerage", label: "Brokerage Entries (194-H)" },
              { id: "slabs", label: "Brokerage Slabs" },
              { id: "leaderboard", label: "🏆 Top Brokers Leaderboard" },
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

        {/* Tab 1 & 2: Channel Partners Directory & KYC Queue */}
        {(activeTab === "directory" || activeTab === "kyc") && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by firm name, contact person, RERA number, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <option value="">All Tiers (Silver / Gold / Platinum)</option>
                    <option value="platinum">Platinum (Top Tier)</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Partner / Firm</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4">RERA & PAN</th>
                      <th className="py-3.5 px-4">Tier</th>
                      <th className="py-3.5 px-4">KYC Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500">Loading partners...</td>
                      </tr>
                    ) : filteredCps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500">No channel partners found.</td>
                      </tr>
                    ) : (
                      filteredCps.map((cp) => (
                        <tr key={cp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900 dark:text-white">{cp.firmName}</div>
                            <div className="text-xs text-gray-400">{cp.contactPerson || "Primary Contact"}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-xs text-gray-800 dark:text-gray-200">{cp.mobile}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[140px]">{cp.email || "—"}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">{cp.reraNo || "RERA Pending"}</div>
                            <div className="text-[11px] text-gray-400 font-mono">PAN: {cp.pan || "—"}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant="soft"
                              color={cp.tier === "platinum" ? "primary" : cp.tier === "gold" ? "warning" : "neutral"}
                              className="capitalize text-xs font-bold"
                            >
                              {cp.tier}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant="soft"
                              color={cp.status === "active" ? "success" : cp.status === "pending_kyc" ? "warning" : "error"}
                              className="capitalize text-xs"
                            >
                              {cp.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isSalesHead && cp.status === "pending_kyc" && (
                                <Button
                                  variant="filled"
                                  color="success"
                                  className="text-xs px-2.5 py-1"
                                  onClick={() => handleUpdateKyc(cp.id, "active")}
                                  title="Approve CP KYC (Sales Head only)"
                                >
                                  <CheckBadgeIcon className="w-3.5 h-3.5 mr-1" />
                                  Approve KYC
                                </Button>
                              )}
                              {cp.status === "active" && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  className="text-xs px-2 py-1"
                                  onClick={() => handleUpdateKyc(cp.id, "suspended")}
                                >
                                  Suspend
                                </Button>
                              )}
                              <Button
                                variant="outlined"
                                color="neutral"
                                className="text-xs px-2 py-1"
                                onClick={() => handleViewDetail(cp.id)}
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
          </div>
        )}

        {/* Tab 3: Brokerage Entries (194-H) */}
        {activeTab === "brokerage" && (
          <Card className="overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 flex items-center justify-between">
              <span>Section 194-H Statutory Compliance: 5% TDS deducted on all brokerages. GST (18%) added for GST registered brokers.</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Total Entries: {brokerageEntries.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Channel Partner</th>
                    <th className="py-3.5 px-4">Booking / Customer</th>
                    <th className="py-3.5 px-4">Agreement Value</th>
                    <th className="py-3.5 px-4">Slab %</th>
                    <th className="py-3.5 px-4">Gross Brokerage</th>
                    <th className="py-3.5 px-4">GST (18%)</th>
                    <th className="py-3.5 px-4">TDS 194-H (5%)</th>
                    <th className="py-3.5 px-4">Net Payable</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                  {loading ? (
                    <tr><td colSpan={10} className="py-12 text-center text-gray-500">Loading brokerage ledger...</td></tr>
                  ) : brokerageEntries.length === 0 ? (
                    <tr><td colSpan={10} className="py-12 text-center text-gray-500">No brokerage entries found.</td></tr>
                  ) : (
                    brokerageEntries.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                          {b.cpFirmName}
                          <div className="text-[10px] text-gray-400 capitalize">{b.cpTier} Tier</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-primary-600">{b.bookingNo || `BK-#${b.bookingId}`}</div>
                          <div className="text-xs text-gray-500">{b.customerName || "Customer"}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                          ₹{(Number(b.base) / 100000).toFixed(1)}L
                        </td>
                        <td className="py-3.5 px-4 font-bold text-xs">{b.pct}%</td>
                        <td className="py-3.5 px-4 font-mono text-xs">₹{Number(b.brokerage).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500">₹{Number(b.gst).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-red-600 dark:text-red-400">-₹{Number(b.tds194h).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{Number(b.net).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="soft"
                            color={b.status === "paid" ? "success" : b.status === "approved" ? "primary" : "warning"}
                            className="capitalize text-xs"
                          >
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isSalesHead && b.status === "accrued" && (
                            <Button
                              variant="filled"
                              color="primary"
                              className="text-xs px-2.5 py-1"
                              onClick={() => handleApproveBrokerage(b.id)}
                              title="Approve Brokerage (Sales Head only)"
                            >
                              Approve
                            </Button>
                          )}
                          {b.status === "approved" && (
                            <Button
                              variant="filled"
                              color="success"
                              className="text-xs px-2.5 py-1"
                              onClick={() => handleDisbursePayout(b.id)}
                            >
                              Disburse
                            </Button>
                          )}
                          {b.status === "paid" && (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircleIcon className="w-3.5 h-3.5 inline" /> Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 4: Brokerage Slabs */}
        {activeTab === "slabs" && (
          <Card className="overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">Brokerage milestone slabs for Kings Heights Tower A & B</span>
              <Button variant="outlined" color="primary" className="text-xs" onClick={() => setShowSlabModal(true)}>
                <PlusIcon className="w-3.5 h-3.5 mr-1" /> Add Slab
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Partner Tier</th>
                    <th className="py-3.5 px-4">From Deals Count</th>
                    <th className="py-3.5 px-4">To Deals Count</th>
                    <th className="py-3.5 px-4">Brokerage Percentage</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                  {slabs.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-500">No slabs configured.</td></tr>
                  ) : (
                    slabs.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="soft"
                            color={s.tier === "platinum" ? "primary" : s.tier === "gold" ? "warning" : "neutral"}
                            className="capitalize text-xs font-bold"
                          >
                            {s.tier}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-sm">{s.fromCount}</td>
                        <td className="py-3.5 px-4 font-mono text-sm">{s.toCount || "No Cap (Unlimited)"}</td>
                        <td className="py-3.5 px-4 font-bold text-sm text-emerald-600 dark:text-emerald-400">{s.pct}%</td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge variant="soft" color="success" className="text-xs">Active</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 5: Leaderboard */}
        {activeTab === "leaderboard" && (
          <Card className="overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-amber-50 to-primary-50/30 dark:from-amber-950/20 dark:to-primary-950/20 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <TrophyIcon className="w-5 h-5 text-amber-500" />
                Channel Partner Performance Leaderboard
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Top performing real estate brokers ranked by closed agreement sales value</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">Broker / Advisory Firm</th>
                    <th className="py-3.5 px-4">Tier</th>
                    <th className="py-3.5 px-4">Leads Tagged</th>
                    <th className="py-3.5 px-4">Deals Closed</th>
                    <th className="py-3.5 px-4">Total Sales Value</th>
                    <th className="py-3.5 px-4">Brokerage Earned</th>
                    <th className="py-3.5 px-4 text-right">Commission Disbursed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                  {leaderboard.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-gray-500">No leaderboard data available.</td></tr>
                  ) : (
                    leaderboard.map((item, idx) => (
                      <tr key={item.cpId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4 font-bold">
                          {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                          {item.firmName}
                          <div className="text-xs text-gray-400">{item.contactPerson}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="soft"
                            color={item.tier === "platinum" ? "primary" : item.tier === "gold" ? "warning" : "neutral"}
                            className="capitalize text-xs font-bold"
                          >
                            {item.tier}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-sm">{item.leadsTagged}</td>
                        <td className="py-3.5 px-4 font-bold text-sm text-primary-600">{item.dealsClosed}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-sm">
                          ₹{(item.totalSalesValue / 10000000).toFixed(2)} Cr
                        </td>
                        <td className="py-3.5 px-4 font-mono text-sm text-emerald-600">
                          ₹{(item.totalBrokerageEarned / 100000).toFixed(2)}L
                        </td>
                        <td className="py-3.5 px-4 font-mono text-sm text-right font-semibold text-gray-900 dark:text-white">
                          ₹{(item.totalBrokeragePaid / 100000).toFixed(2)}L
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Modal: New Channel Partner */}
        {showNewCpModal && (
          <FormModal
            title="Onboard New Channel Partner"
            subtitle="Register broker agency with MahaRERA, PAN & GSTIN details"
            icon={<UserGroupIcon className="w-5 h-5" />}
            onClose={() => setShowNewCpModal(false)}
            maxWidth="lg"
          >
            <form onSubmit={handleCreateCp} className="space-y-5">
              <FormSection label="Firm & Contact Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Firm / Agency Name"
                    type="text"
                    required
                    value={cpForm.firmName}
                    onChange={(e) => setCpForm({ ...cpForm, firmName: e.target.value })}
                    placeholder="e.g. Apex Realty Advisory"
                  />
                  <FormInput
                    label="Contact Person"
                    type="text"
                    value={cpForm.contactPerson}
                    onChange={(e) => setCpForm({ ...cpForm, contactPerson: e.target.value })}
                    placeholder="e.g. Vikram Mehta"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Mobile Number"
                    type="tel"
                    required
                    value={cpForm.mobile}
                    onChange={(e) => setCpForm({ ...cpForm, mobile: e.target.value })}
                    placeholder="9820011223"
                  />
                  <FormInput
                    label="Email Address"
                    type="email"
                    value={cpForm.email}
                    onChange={(e) => setCpForm({ ...cpForm, email: e.target.value })}
                    placeholder="partner@apexrealty.in"
                  />
                </div>
              </FormSection>

              <FormSection label="Statutory & KYC Compliance">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormInput
                    label="MahaRERA No"
                    type="text"
                    value={cpForm.reraNo}
                    onChange={(e) => setCpForm({ ...cpForm, reraNo: e.target.value })}
                    placeholder="A51800012345"
                    className="font-mono text-xs"
                  />
                  <FormInput
                    label="PAN Card"
                    type="text"
                    value={cpForm.pan}
                    onChange={(e) => setCpForm({ ...cpForm, pan: e.target.value })}
                    placeholder="ABCDE1234F"
                    className="font-mono uppercase text-xs"
                  />
                  <FormInput
                    label="GSTIN"
                    type="text"
                    value={cpForm.gstin}
                    onChange={(e) => setCpForm({ ...cpForm, gstin: e.target.value })}
                    placeholder="27ABCDE1234F1Z5"
                    className="font-mono uppercase text-xs"
                  />
                </div>

                <FormSelect
                  label="Partner Tier"
                  value={cpForm.tier}
                  onChange={(e) => setCpForm({ ...cpForm, tier: e.target.value as any })}
                  options={[
                    { label: "Silver Tier (Base 2.0%)", value: "silver" },
                    { label: "Gold Tier (Preferred 2.5%)", value: "gold" },
                    { label: "Platinum Tier (Elite 3.0%)", value: "platinum" },
                  ]}
                />
              </FormSection>

              <FormActions>
                <Button type="button" variant="outlined" color="neutral" onClick={() => setShowNewCpModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="primary">
                  Onboard Channel Partner
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}

        {/* Modal: Configure Slabs */}
        {showSlabModal && (
          <FormModal
            title="Configure Brokerage Slab"
            subtitle="Define tiered commission slabs based on closed bookings"
            icon={<TrophyIcon className="w-5 h-5" />}
            onClose={() => setShowSlabModal(false)}
            maxWidth="md"
          >
            <form onSubmit={handleCreateSlab} className="space-y-4">
              <FormSelect
                label="Partner Tier"
                value={slabForm.tier}
                onChange={(e) => setSlabForm({ ...slabForm, tier: e.target.value as any })}
                options={[
                  { label: "Silver Tier", value: "silver" },
                  { label: "Gold Tier", value: "gold" },
                  { label: "Platinum Tier", value: "platinum" },
                ]}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="From Deals Count"
                  type="number"
                  required
                  value={slabForm.fromCount}
                  onChange={(e) => setSlabForm({ ...slabForm, fromCount: Number(e.target.value) })}
                />
                <FormInput
                  label="To Deals Count"
                  type="number"
                  value={slabForm.toCount}
                  onChange={(e) => setSlabForm({ ...slabForm, toCount: Number(e.target.value) })}
                />
              </div>

              <FormInput
                label="Brokerage %"
                type="number"
                step="0.1"
                required
                value={slabForm.pct}
                onChange={(e) => setSlabForm({ ...slabForm, pct: Number(e.target.value) })}
              />

              <FormActions>
                <Button type="button" variant="outlined" color="neutral" onClick={() => setShowSlabModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="primary">
                  Save Slab
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}

        {/* Modal: View CP 360 Detail */}
        {selectedCpDetail && (
          <FormModal
            title={selectedCpDetail.partner.firmName}
            subtitle={`RERA: ${selectedCpDetail.partner.reraNo || "Pending"} • PAN: ${selectedCpDetail.partner.pan || "—"}`}
            icon={<CheckBadgeIcon className="w-5 h-5 text-emerald-500" />}
            onClose={() => setSelectedCpDetail(null)}
            maxWidth="lg"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-dark-800/60 p-4 rounded-xl border border-gray-200 dark:border-dark-600">
                <div>
                  <span className="text-xs text-gray-400 dark:text-dark-300 block font-medium">Contact Person & Phone</span>
                  <span className="font-semibold text-gray-900 dark:text-dark-100">{selectedCpDetail.partner.contactPerson} ({selectedCpDetail.partner.mobile})</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 dark:text-dark-300 block font-medium mb-1">Tier & Status</span>
                  <Badge variant="soft" color="primary" className="capitalize mr-2">{selectedCpDetail.partner.tier}</Badge>
                  <Badge variant="soft" color="success" className="capitalize">{selectedCpDetail.partner.status}</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-300 mb-2.5">
                  Tagged Leads ({selectedCpDetail.taggedLeads.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 dark:border-dark-600 rounded-xl p-2.5 bg-gray-50/50 dark:bg-dark-800/30">
                  {selectedCpDetail.taggedLeads.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No tagged leads.</p>
                  ) : (
                    selectedCpDetail.taggedLeads.map((tl: any) => (
                      <div key={tl.id} className="text-xs flex items-center justify-between p-2.5 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600">
                        <span className="font-medium text-gray-900 dark:text-dark-100">{tl.name} ({tl.mobile})</span>
                        <Badge variant="soft" color="primary" className="text-[10px] uppercase font-bold">{tl.stage}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <FormActions>
                <Button variant="outlined" color="neutral" onClick={() => setSelectedCpDetail(null)}>
                  Close
                </Button>
              </FormActions>
            </div>
          </FormModal>
        )}
      </div>
    </Page>
  );
}
