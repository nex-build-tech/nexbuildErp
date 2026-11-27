import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { FormModal, FormSection, FormActions, FormInput, FormSelect, FormTextarea } from "../_shared/FormModal";

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
  budgetMin?: string;
  budgetMax?: string;
  configPref?: string;
  sourceId?: number;
  sourceName?: string;
  campaignId?: number;
  cpId?: number;
  slaBreached: boolean;
  firstResponseAt?: string | null;
  createdAt: string;
}

interface LeadSource {
  id: number;
  name: string;
  code: string;
}

interface Campaign {
  id: number;
  name: string;
}

export default function RealtyLeadsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [salesMasters, setSalesMasters] = useState<{ category: string; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState(searchParams.get("stage") || "");
  const [selectedTemp, setSelectedTemp] = useState(searchParams.get("temperature") || "");
  const [selectedSource, setSelectedSource] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");

  // Modals
  const [showNewModal, setShowNewModal] = useState(searchParams.get("action") === "new");
  const [showImportModal, setShowImportModal] = useState(false);

  // New Lead Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    sourceId: "",
    campaignId: "",
    configPref: "2 BHK",
    budgetMin: "6000000",
    budgetMax: "8500000",
    purpose: "end_use",
    timeline: "immediate",
    notes: "",
  });

  // CSV Import State
  const [csvContent, setCsvContent] = useState("");
  const [importSummary, setImportSummary] = useState<{ imported: number; duplicates: number } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [selectedStage, selectedTemp, selectedSource, activeTab]);

  const fetchInitialData = async () => {
    try {
      const [srcRes, campRes, mastersRes] = await Promise.all([
        axios.get("/realty/crm/sources").catch(() => ({ data: { data: [] } })),
        axios.get("/realty/crm/campaigns").catch(() => ({ data: { data: [] } })),
        axios.get("/realty/setup/sales-masters").catch(() => ({ data: { data: [] } })),
      ]);
      const loadedSources = srcRes.data?.data || [];
      const loadedMasters = mastersRes.data?.data || [];
      setCampaigns(campRes.data?.data || []);
      setSalesMasters(loadedMasters);

      const masterSources = loadedMasters
        .filter((m: any) => m.category === "lead_source")
        .map((m: any, idx: number) => ({ id: -(idx + 1), name: m.name, code: m.code }));

      setSources(loadedSources.length > 0 ? loadedSources : masterSources);
    } catch (err) {
      console.error("Failed to load CRM metadata:", err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (selectedStage) params.stage = selectedStage;
      if (selectedTemp) params.temperature = selectedTemp;
      if (selectedSource) params.sourceId = selectedSource;
      if (activeTab === "hot") params.temperature = "hot";
      if (activeTab === "sla_breach") params.slaBreached = "true";

      const res = await axios.get("/realty/crm/leads", { params });
      setLeads(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  // Live Score Calculator for Modal
  const calculateLiveScore = () => {
    let score = 20;
    const maxB = Number(formData.budgetMax) || 0;
    if (maxB >= 8000000) score += 30;
    else if (maxB >= 5000000) score += 20;
    else if (maxB > 0) score += 10;

    if (formData.purpose === "end_use") score += 20;
    else if (formData.purpose === "investment") score += 15;

    if (formData.configPref) score += 10;

    const temp = score >= 60 ? "HOT" : score >= 40 ? "WARM" : "COLD";
    return { score, temp };
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/realty/crm/leads", {
        siteId: 1, // Kings Heights default
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
        email: formData.email,
        sourceId: formData.sourceId ? Number(formData.sourceId) : undefined,
        campaignId: formData.campaignId ? Number(formData.campaignId) : undefined,
        configPref: formData.configPref,
        budgetMin: Number(formData.budgetMin) || undefined,
        budgetMax: Number(formData.budgetMax) || undefined,
        purpose: formData.purpose,
        timeline: formData.timeline,
        notes: formData.notes,
      });

      setShowNewModal(false);
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create lead");
    }
  };

  const handleCsvImport = async () => {
    if (!csvContent.trim()) {
      alert("Please enter or paste CSV content");
      return;
    }
    try {
      const res = await axios.post("/realty/crm/leads/import", {
        siteId: 1,
        csvData: csvContent,
      });
      setImportSummary(res.data?.data || { imported: 0, duplicates: 0 });
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.message || "CSV Import failed");
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const fullName = `${l.firstName} ${l.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(q) ||
      l.leadNo.toLowerCase().includes(q) ||
      l.mobile.includes(q) ||
      (l.email && l.email.toLowerCase().includes(q))
    );
  });

  return (
    <Page title="Leads & Opportunities Register">
      <div className="space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Leads & Opportunity Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Capture, score, route, and nurture prospects for Kings Heights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => {
                setShowImportModal(true);
                setImportSummary(null);
              }}
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1.5" />
              Import CSV
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={() => setShowNewModal(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              New Lead
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-6 overflow-x-auto">
            {[
              { id: "all", label: "All Leads" },
              { id: "hot", label: "🔥 Hot Leads" },
              { id: "sla_breach", label: "⚠️ SLA Breached" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "hot") setSelectedTemp("hot");
                  else setSelectedTemp("");
                }}
                className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
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

        {/* Filter & Search Bar */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, lead number, mobile or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Stages</option>
                {salesMasters.filter((m) => m.category === "lead_stage").length > 0 ? (
                  salesMasters
                    .filter((m) => m.category === "lead_stage")
                    .map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))
                ) : (
                  <>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="site_visit_scheduled">Visit Scheduled</option>
                    <option value="site_visit_done">Visit Done</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="booked">Booked</option>
                    <option value="lost">Lost</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <select
                value={selectedTemp}
                onChange={(e) => setSelectedTemp(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Temperatures</option>
                <option value="hot">🔥 Hot (Score 60+)</option>
                <option value="warm">☀️ Warm (Score 40-59)</option>
                <option value="cold">❄️ Cold (Score &lt; 40)</option>
              </select>
            </div>

            <div>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Sources</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Leads Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Lead Info</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Requirement & Budget</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Score & Temp</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">SLA</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No matching leads found.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition cursor-pointer"
                      onClick={() => navigate(`/realty/leads/${lead.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {lead.firstName} {lead.lastName || ""}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {lead.leadNo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {lead.mobile}
                        </div>
                        {lead.email && (
                          <div className="text-xs text-gray-400 truncate max-w-[140px]">
                            {lead.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {lead.configPref || "Any Config"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.budgetMax
                            ? `Up to ₹${(Number(lead.budgetMax) / 100000).toFixed(1)}L`
                            : "Budget Open"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="soft" color="neutral" className="text-xs">
                          {lead.sourceName || "Direct"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              lead.temperature === "hot"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : lead.temperature === "warm"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            }`}
                          >
                            {lead.score} • {(lead.temperature || "warm").toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="soft"
                          color={
                            lead.stage === "booked"
                              ? "success"
                              : lead.stage === "lost"
                              ? "error"
                              : "primary"
                          }
                          className="capitalize text-xs"
                        >
                          {lead.stage.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {lead.slaBreached ? (
                          <Badge variant="soft" color="error" className="text-[11px] flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-3 h-3 inline" /> Breached
                          </Badge>
                        ) : lead.firstResponseAt ? (
                          <span className="text-xs text-emerald-600 font-medium">Met</span>
                        ) : (
                          <span className="text-xs text-gray-400">Within SLA</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${lead.mobile}`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Call"
                          >
                            <PhoneIcon className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://wa.me/${lead.mobile.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                            title="WhatsApp"
                          >
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          </a>
                          <Button
                            variant="outlined"
                            color="neutral"
                            className="px-2 py-1 text-xs"
                            onClick={() => navigate(`/realty/leads/${lead.id}`)}
                          >
                            <EyeIcon className="w-3.5 h-3.5 mr-1" /> View
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

        {/* Modal: New Lead */}
        {showNewModal && (
          <FormModal
            title="Register New Lead"
            subtitle="Capture lead details and route to executive"
            icon={<PlusIcon className="w-5 h-5" />}
            onClose={() => setShowNewModal(false)}
            maxWidth="lg"
          >
            {/* Dynamic Live Score */}
            <div className="mb-5 p-4 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                  Dynamic AI Qualification Score
                </p>
                <p className="text-xs text-gray-600 dark:text-dark-300 mt-0.5">
                  Calculated from budget, configuration preference, and buyer readiness
                </p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <span className="text-3xl font-extrabold text-primary-700 dark:text-primary-300">
                  {calculateLiveScore().score}
                </span>
                <span className="block text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  {calculateLiveScore().temp}
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-5">
              <FormSection label="Contact Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="First Name"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Ramesh"
                  />
                  <FormInput
                    label="Last Name"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Patel"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Mobile Number (+91)"
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="9820011223"
                  />
                  <FormInput
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh.patel@gmail.com"
                  />
                </div>
              </FormSection>

              <FormSection label="Source & Attribution">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="Lead Source"
                    value={formData.sourceId}
                    onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                    options={[
                      { label: "Select Lead Source", value: "" },
                      ...sources.map((src) => ({ label: src.name, value: String(src.id) })),
                    ]}
                  />
                  <FormSelect
                    label="Campaign Tag (Optional)"
                    value={formData.campaignId}
                    onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                    options={[
                      { label: "Select Campaign", value: "" },
                      ...campaigns.map((c) => ({ label: c.name, value: String(c.id) })),
                    ]}
                  />
                </div>
              </FormSection>

              <FormSection label="Requirement & Budget">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormSelect
                    label="Configuration"
                    value={formData.configPref}
                    onChange={(e) => setFormData({ ...formData, configPref: e.target.value })}
                    options={
                      salesMasters.filter((m) => m.category === "unit_type").length > 0
                        ? salesMasters
                            .filter((m) => m.category === "unit_type")
                            .map((m) => ({ label: m.name, value: m.name }))
                        : [
                            { label: "1 BHK", value: "1 BHK" },
                            { label: "2 BHK", value: "2 BHK" },
                            { label: "3 BHK", value: "3 BHK" },
                            { label: "4 BHK Penthouse", value: "4 BHK Penthouse" },
                            { label: "Commercial Shop", value: "Commercial Shop" },
                          ]
                    }
                  />
                  <FormInput
                    label="Max Budget (₹)"
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    step={500000}
                  />
                  <FormSelect
                    label="Purchase Purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    options={
                      salesMasters.filter((m) => m.category === "purchase_purpose").length > 0
                        ? salesMasters
                            .filter((m) => m.category === "purchase_purpose")
                            .map((m) => ({ label: m.name, value: m.code || m.name }))
                        : [
                            { label: "Self / End Use", value: "end_use" },
                            { label: "Investment", value: "investment" },
                          ]
                    }
                  />
                </div>
                <FormTextarea
                  label="Initial Discussion / Qualification Notes"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Customer requirement, preferred floor, financing need..."
                />
              </FormSection>

              <FormActions>
                <Button type="button" variant="outlined" color="neutral" onClick={() => setShowNewModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="primary">
                  Create & Route Lead
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}

        {/* Modal: CSV Bulk Import */}
        {showImportModal && (
          <FormModal
            title="Bulk Import Leads (CSV)"
            subtitle="Upload or paste multiple leads with deduplication"
            icon={<ArrowUpTrayIcon className="w-5 h-5" />}
            onClose={() => setShowImportModal(false)}
            maxWidth="md"
          >
            <div className="space-y-4">
              <div className="text-xs text-gray-500 dark:text-dark-300 space-y-2">
                <p>
                  Paste CSV lines with header:
                  <code className="block bg-gray-100 dark:bg-dark-800 p-2.5 rounded-lg mt-1 text-gray-800 dark:text-dark-100 font-mono text-[11px] border border-gray-200 dark:border-dark-600">
                    firstName,lastName,mobile,email,budgetMax,configPref,source
                  </code>
                </p>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                  <span>Deduplication Active: Duplicate mobile numbers will not create duplicate records; they are logged as repeat activities.</span>
                </div>
              </div>

              <FormTextarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={"firstName,lastName,mobile,email,budgetMax,configPref,source\nVikram,Mehta,9820099881,vikram@gmail.com,8500000,2 BHK,Google Ads\nSunita,Deshmukh,9820099882,sunita@yahoo.com,11000000,3 BHK,Meta Ads"}
                className="font-mono text-xs"
              />

              {importSummary && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium">
                  ✅ Import complete: <strong>{importSummary.imported}</strong> new leads registered, <strong>{importSummary.duplicates}</strong> duplicates merged.
                </div>
              )}

              <FormActions>
                <Button variant="outlined" color="neutral" onClick={() => setShowImportModal(false)}>
                  Close
                </Button>
                <Button variant="filled" color="primary" onClick={handleCsvImport}>
                  Execute Import
                </Button>
              </FormActions>
            </div>
          </FormModal>
        )}
      </div>
    </Page>
  );
}
