import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  MegaphoneIcon,
  TagIcon,
  CurrencyRupeeIcon,
  LinkIcon,
  PlusIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { FormModal, FormSection, FormActions, FormInput, FormSelect } from "../_shared/FormModal";

interface CampaignItem {
  id: number;
  name: string;
  sourceId?: number;
  budget?: string;
  startDate?: string;
  endDate?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  leadsCount?: number;
}

interface SourceItem {
  id: number;
  name: string;
  code: string;
  active: boolean;
}

export default function RealtyCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campaigns" | "sources">("campaigns");

  // Modals
  const [showCampModal, setShowCampModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Form states
  const [campForm, setCampForm] = useState({
    name: "",
    sourceId: "",
    budget: "500000",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "kings_heights_diwali_2026",
  });

  const [sourceForm, setSourceForm] = useState({
    name: "",
    code: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campRes, srcRes] = await Promise.all([
        axios.get("/realty/crm/campaigns"),
        axios.get("/realty/crm/sources"),
      ]);
      setCampaigns(campRes.data?.data || []);
      setSources(srcRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load campaigns data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/realty/crm/campaigns", {
        siteId: 1, // Kings Heights
        name: campForm.name,
        sourceId: campForm.sourceId ? Number(campForm.sourceId) : undefined,
        budget: Number(campForm.budget) || undefined,
        startDate: campForm.startDate,
        endDate: campForm.endDate,
        utmSource: campForm.utmSource,
        utmMedium: campForm.utmMedium,
        utmCampaign: campForm.utmCampaign,
      });

      setShowCampModal(false);
      setCampForm({
        name: "",
        sourceId: "",
        budget: "500000",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create campaign");
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/realty/crm/sources", {
        name: sourceForm.name,
        code: sourceForm.code.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      });

      setShowSourceModal(false);
      setSourceForm({ name: "", code: "" });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create lead source");
    }
  };

  const totalBudget = campaigns.reduce((acc, c) => acc + (Number(c.budget) || 0), 0);
  const webhookUrl = `${window.location.origin}/realty/public/leads`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 3000);
  };

  return (
    <Page title="Campaigns & Lead Attribution">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Campaigns & Attribution Channels
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track digital ads ROI, UTM tags, and inbound portals for Kings Heights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setShowSourceModal(true)}
            >
              <TagIcon className="w-4 h-4 mr-1.5" />
              Add Source
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={() => setShowCampModal(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <MegaphoneIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Campaigns</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaigns.length}
                </span>
                <span className="text-xs text-gray-500">across digital channels</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <CurrencyRupeeIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Marketing Budget</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{(totalBudget / 100000).toFixed(1)} Lakhs
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <TagIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Channels Configured</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {sources.length} Channels
                </span>
                <Badge variant="soft" color="success">Webhooks Ready</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === "campaigns"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Marketing Campaigns ({campaigns.length})
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === "sources"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Attribution Sources & Webhooks ({sources.length})
            </button>
          </nav>
        </div>

        {/* Tab 1: Campaigns */}
        {activeTab === "campaigns" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Campaign Name</th>
                    <th className="py-3.5 px-4">Channel / Source</th>
                    <th className="py-3.5 px-4">Budget</th>
                    <th className="py-3.5 px-4">Schedule</th>
                    <th className="py-3.5 px-4">UTM Parameters</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        Loading campaigns...
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        No campaigns configured yet.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => {
                      const src = sources.find((s) => s.id === c.sourceId);
                      return (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {c.name}
                            </div>
                            <div className="text-xs text-gray-400">Kings Heights Tower A/B</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant="soft" color="neutral" className="text-xs">
                              {src?.name || "Direct / Web"}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                            {c.budget ? `₹${(Number(c.budget) / 100000).toFixed(2)}L` : "Undisclosed"}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-gray-500">
                            {c.startDate ? new Date(c.startDate).toLocaleDateString() : "Immediate"}
                            {" → "}
                            {c.endDate ? new Date(c.endDate).toLocaleDateString() : "Ongoing"}
                          </td>

                          <td className="py-3.5 px-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                            <div>utm_source={c.utmSource || "none"}</div>
                            <div>utm_campaign={c.utmCampaign || "none"}</div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Badge variant="soft" color="success" className="text-xs">
                              Active
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2: Sources & Webhook */}
        {activeTab === "sources" && (
          <div className="space-y-6">
            {/* Public Webhook Endpoint Card */}
            <Card className="p-5 bg-gradient-to-r from-gray-50 to-primary-50/30 dark:from-gray-800 dark:to-primary-950/20 border-primary-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-primary-600" />
                    Public Inbound Leads Webhook API
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Connect Meta Lead Ads, 99acres webhooks, MagicBricks leads, or Housing.com directly:
                  </p>
                  <code className="block mt-2 font-mono text-xs p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-primary-700 dark:text-primary-300">
                    POST {webhookUrl}
                  </code>
                </div>
                <Button
                  variant="outlined"
                  color="primary"
                  className="text-xs shrink-0"
                  onClick={copyToClipboard}
                >
                  <ClipboardDocumentIcon className="w-4 h-4 mr-1.5" />
                  {copiedWebhook ? "Copied!" : "Copy Endpoint"}
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Channel / Source Name</th>
                      <th className="py-3.5 px-4">System Code</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                    {sources.map((src) => (
                      <tr key={src.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                          {src.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                          {src.code}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500 capitalize">
                          {src.code.includes("ad")
                            ? "Digital Advertising"
                            : src.code.includes("cp")
                            ? "Channel Partner"
                            : src.code.includes("walkin")
                            ? "Direct Reception"
                            : "Real Estate Portal"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge variant="soft" color="success" className="text-xs">
                            Active
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Modal: New Campaign */}
        {showCampModal && (
          <FormModal
            title="Create Marketing Campaign"
            subtitle="Configure digital marketing or print campaigns with UTM tags"
            icon={<MegaphoneIcon className="w-5 h-5" />}
            onClose={() => setShowCampModal(false)}
            maxWidth="lg"
          >
            <form onSubmit={handleCreateCampaign} className="space-y-5">
              <FormSection label="Campaign Info">
                <FormInput
                  label="Campaign Name"
                  type="text"
                  required
                  value={campForm.name}
                  onChange={(e) => setCampForm({ ...campForm, name: e.target.value })}
                  placeholder="e.g. Kings Heights New Year Launch 2027"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="Attribution Source"
                    value={campForm.sourceId}
                    onChange={(e) => setCampForm({ ...campForm, sourceId: e.target.value })}
                    options={[
                      { label: "Select Channel", value: "" },
                      ...sources.map((s) => ({ label: s.name, value: String(s.id) })),
                    ]}
                  />
                  <FormInput
                    label="Budget (₹)"
                    type="number"
                    value={campForm.budget}
                    onChange={(e) => setCampForm({ ...campForm, budget: e.target.value })}
                    step={50000}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Start Date"
                    type="date"
                    value={campForm.startDate}
                    onChange={(e) => setCampForm({ ...campForm, startDate: e.target.value })}
                  />
                  <FormInput
                    label="End Date"
                    type="date"
                    value={campForm.endDate}
                    onChange={(e) => setCampForm({ ...campForm, endDate: e.target.value })}
                  />
                </div>
              </FormSection>

              <FormSection label="UTM Tracking Tags">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormInput
                    label="utm_source"
                    type="text"
                    value={campForm.utmSource}
                    onChange={(e) => setCampForm({ ...campForm, utmSource: e.target.value })}
                    placeholder="e.g. facebook"
                    className="font-mono text-xs"
                  />
                  <FormInput
                    label="utm_medium"
                    type="text"
                    value={campForm.utmMedium}
                    onChange={(e) => setCampForm({ ...campForm, utmMedium: e.target.value })}
                    placeholder="e.g. cpc"
                    className="font-mono text-xs"
                  />
                  <FormInput
                    label="utm_campaign"
                    type="text"
                    value={campForm.utmCampaign}
                    onChange={(e) => setCampForm({ ...campForm, utmCampaign: e.target.value })}
                    placeholder="e.g. diwali_offer"
                    className="font-mono text-xs"
                  />
                </div>
              </FormSection>

              <FormActions>
                <Button type="button" variant="outlined" color="neutral" onClick={() => setShowCampModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="primary">
                  Save Campaign
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}

        {/* Modal: New Source */}
        {showSourceModal && (
          <FormModal
            title="Add Attribution Source"
            subtitle="Register new marketing channel or lead provider"
            icon={<TagIcon className="w-5 h-5" />}
            onClose={() => setShowSourceModal(false)}
            maxWidth="sm"
          >
            <form onSubmit={handleCreateSource} className="space-y-4">
              <FormInput
                label="Source Name"
                type="text"
                required
                value={sourceForm.name}
                onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                placeholder="e.g. Newspaper Print Ad"
              />
              <FormInput
                label="Internal Identifier Code"
                type="text"
                required
                value={sourceForm.code}
                onChange={(e) => setSourceForm({ ...sourceForm, code: e.target.value })}
                placeholder="e.g. newspaper_print"
                className="font-mono"
              />

              <FormActions>
                <Button type="button" variant="outlined" color="neutral" onClick={() => setShowSourceModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled" color="primary">
                  Create Source
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}
      </div>
    </Page>
  );
}
