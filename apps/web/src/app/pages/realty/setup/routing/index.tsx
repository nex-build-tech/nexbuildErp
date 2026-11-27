import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  ArrowPathIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface RoutingRuleItem {
  id: number;
  name: string;
  conditions: any;
  userPool: number[];
  strategy: "round_robin" | "load_balanced";
  slaMinutes: number;
  active: boolean;
}

export default function RealtySetupRoutingPage() {
  const [rules, setRules] = useState<RoutingRuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    strategy: "round_robin" as const,
    slaMinutes: 30,
    minBudget: 8000000,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/crm/routing-rules");
      setRules(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load routing rules:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/realty/crm/routing-rules", {
        name: formData.name,
        strategy: formData.strategy,
        slaMinutes: Number(formData.slaMinutes),
        conditions: formData.minBudget ? { minBudget: Number(formData.minBudget) } : {},
        userPool: [1, 2], // Pre-sales team IDs
      });

      setShowModal(false);
      setFormData({
        name: "",
        strategy: "round_robin",
        slaMinutes: 30,
        minBudget: 8000000,
      });
      fetchRules();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create rule");
    }
  };

  return (
    <Page title="Lead Routing & SLA Response Engine">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lead Routing & SLA Escalation Rules
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automated round-robin assignment, budget filtering, and response time thresholds
            </p>
          </div>
          <Button
            variant="filled"
            color="primary"
            onClick={() => setShowModal(true)}
          >
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Add Routing Rule
          </Button>
        </div>

        {/* SLA Protocol Banner */}
        <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Guaranteed Pre-Sales First-Response SLA
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs">
                Inbound leads are scored in real time. Hot and HNI leads (budget ≥ ₹80 Lakhs) are routed to dedicated senior executives with a strict 15-minute response SLA. If no first contact is logged within the timeframe, the lead is flagged as SLA Breached and escalated to the Sales Head.
              </p>
            </div>
          </div>
        </Card>

        {/* Rules Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Rule Name</th>
                  <th className="py-3.5 px-4">Matching Criteria</th>
                  <th className="py-3.5 px-4">Distribution Strategy</th>
                  <th className="py-3.5 px-4">Target SLA</th>
                  <th className="py-3.5 px-4">User Pool</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Loading routing rules...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No routing rules found. Click "Add Routing Rule" to configure.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => {
                    const cond = rule.conditions as any;
                    return (
                      <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                          {rule.name}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {cond?.minBudget ? (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded">
                              Budget ≥ ₹{(Number(cond.minBudget) / 100000).toFixed(0)} Lakhs
                            </span>
                          ) : (
                            <span className="text-gray-400">All Inbound Leads (Catch-All)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 capitalize text-xs flex items-center gap-1.5 mt-3">
                          <ArrowPathIcon className="w-3.5 h-3.5 text-primary-500" />
                          {rule.strategy.replace(/_/g, " ")}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant="soft"
                            color={rule.slaMinutes <= 15 ? "error" : "primary"}
                            className="text-xs"
                          >
                            <ClockIcon className="w-3.5 h-3.5 mr-1 inline" />
                            {rule.slaMinutes} Minutes
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {Array.isArray(rule.userPool) ? `${rule.userPool.length} Executives` : "Team"}
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

        {/* Modal: Add Rule */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg p-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">Create Lead Routing Rule</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRule} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    placeholder="e.g. Premium 3 BHK HNI Routing"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min Budget (₹) Condition
                    </label>
                    <input
                      type="number"
                      value={formData.minBudget}
                      onChange={(e) => setFormData({ ...formData, minBudget: Number(e.target.value) })}
                      className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono"
                      step={500000}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Response SLA (Minutes)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.slaMinutes}
                      onChange={(e) => setFormData({ ...formData, slaMinutes: Number(e.target.value) })}
                      className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Distribution Strategy
                  </label>
                  <select
                    value={formData.strategy}
                    onChange={(e) => setFormData({ ...formData, strategy: e.target.value as any })}
                    className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <option value="round_robin">Round Robin (Equal Rotation)</option>
                    <option value="load_balanced">Load Balanced (Active Capacity)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Button type="button" variant="outlined" color="neutral" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="filled" color="primary">
                    Save Rule
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
