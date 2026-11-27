import { useState, useEffect } from "react";
import { Link } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  CurrencyRupeeIcon,
  DocumentCheckIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  ArrowPathIcon,
  DocumentTextIcon,
  BanknotesIcon,
  EnvelopeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface DashboardData {
  summary: {
    totalUnits: number;
    occupancyBreakdown: Record<string, number>;
    financials: {
      totalDemanded: number;
      totalCollected: number;
      totalOutstanding: number;
      collectionEfficiency: number;
    };
  };
  aging: {
    bucket0_30: number;
    bucket31_60: number;
    bucket61_90: number;
    bucket90Plus: number;
    total: number;
  };
  monthlyRecovery: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export default function RealtyPostSalesDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/realty/dashboard/post-sales");
      const d = res.data?.data || res.data;
      setData(d);
    } catch (err: any) {
      console.error("Failed to load post-sales dashboard:", err);
      setError(err?.response?.data?.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatLakhCrore = (amount: number) => {
    if (!amount) return "₹0";
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <Page title="Post-Sales & Collections Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <CurrencyRupeeIcon className="size-7 text-primary-600" />
              Post-Sales &amp; Collections Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Reconciled collections, demand progress, aging distribution, and recovery performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={fetchDashboard}
              disabled={loading}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ArrowPathIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link to="/realty/demands">
              <Button color="primary" variant="outlined" className="text-xs py-2 px-3 flex items-center gap-1.5">
                <DocumentTextIcon className="size-4" />
                Demands Run
              </Button>
            </Link>
            <Link to="/realty/receipts">
              <Button color="primary" className="text-xs py-2 px-3 flex items-center gap-1.5">
                <BanknotesIcon className="size-4" />
                Receipts
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Demanded
              </span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg text-blue-600 dark:text-blue-400">
                <DocumentCheckIcon className="size-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatLakhCrore(data?.summary?.financials?.totalDemanded || 0)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across all construction stages
            </p>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Collected
              </span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg text-emerald-600 dark:text-emerald-400">
                <BanknotesIcon className="size-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatLakhCrore(data?.summary?.financials?.totalCollected || 0)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Passed and verified receipts
            </p>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Outstanding
              </span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-lg text-amber-600 dark:text-amber-400">
                <ClockIcon className="size-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatLakhCrore(data?.summary?.financials?.totalOutstanding || 0)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Overdue and pending recovery
            </p>
          </Card>

          <Card className="p-5 border-l-4 border-l-indigo-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Collection Efficiency
              </span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg text-indigo-600 dark:text-indigo-400">
                <ArrowTrendingUpIcon className="size-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {data?.summary?.financials?.collectionEfficiency || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, data?.summary?.financials?.collectionEfficiency || 0)}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Grid: Aging Breakdown & Reconciled Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Outstanding Aging Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Categorized by overdue payment days
                </p>
              </div>
              <Link to="/realty/reports" className="text-xs text-primary-600 hover:underline">
                View Aging Report →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  0 - 30 Days
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {formatLakhCrore(data?.aging?.bucket0_30 || 0)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <div className="text-xs font-medium text-blue-800 dark:text-blue-300">
                  31 - 60 Days
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {formatLakhCrore(data?.aging?.bucket31_60 || 0)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <div className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  61 - 90 Days
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {formatLakhCrore(data?.aging?.bucket61_90 || 0)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                <div className="text-xs font-medium text-rose-800 dark:text-rose-300">
                  90+ Days (Critical)
                </div>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {formatLakhCrore(data?.aging?.bucket90Plus || 0)}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Interest accrued automatically after 7-day grace period at 18% p.a.</span>
              <Link to="/realty/ledger" className="font-medium text-primary-600 hover:underline">
                Check Ledger →
              </Link>
            </div>
          </Card>

          {/* Unit Statuses */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Inventory Snapshot
              </h3>
              <span className="text-xs font-medium text-slate-500">
                Total {data?.summary?.totalUnits || 0} Units
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  Available
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {data?.summary?.occupancyBreakdown?.available || 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="size-2.5 rounded-full bg-amber-500" />
                  On Hold
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {data?.summary?.occupancyBreakdown?.hold || 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="size-2.5 rounded-full bg-blue-500" />
                  Booked
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {data?.summary?.occupancyBreakdown?.booked || 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="size-2.5 rounded-full bg-indigo-500" />
                  Agreement Done
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {data?.summary?.occupancyBreakdown?.agreement || 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="size-2.5 rounded-full bg-purple-500" />
                  Registered
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {data?.summary?.occupancyBreakdown?.registered || 0}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link to="/realty/inventory">
                <Button variant="outlined" className="w-full text-xs py-2 flex items-center justify-center gap-1.5">
                  <BuildingOffice2Icon className="size-4" />
                  Open Inventory Grid
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Monthly Recovery Trend & Quick Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Monthly Recovery Performance
                </h3>
                <p className="text-xs text-slate-500">
                  Last 6 months verified collections
                </p>
              </div>
              <Badge variant="soft" color="success">Verified Receipts</Badge>
            </div>

            <div className="space-y-3">
              {(!data?.monthlyRecovery || data.monthlyRecovery.length === 0) ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No collection records found for the past 6 months.
                </div>
              ) : (
                data.monthlyRecovery.map((item, idx) => {
                  const maxAmount = Math.max(
                    ...data.monthlyRecovery.map((m) => m.amount),
                    1
                  );
                  const pct = Math.round((item.amount / maxAmount) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.month}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatLakhCrore(item.amount)} ({item.count} receipts)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Quick Operations */}
          <Card className="p-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
              Operations &amp; Navigation
            </h3>
            <div className="space-y-2">
              <Link
                to="/realty/demands"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <DocumentTextIcon className="size-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Demands &amp; Stages
                    </div>
                    <div className="text-xs text-slate-500">
                      Bulk generate milestone demands
                    </div>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </Link>

              <Link
                to="/realty/receipts"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BanknotesIcon className="size-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Receipts Register
                    </div>
                    <div className="text-xs text-slate-500">
                      Maker-checker approvals &amp; TDS
                    </div>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </Link>

              <Link
                to="/realty/ledger"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <DocumentCheckIcon className="size-5 text-indigo-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Customer Ledger / SOA
                    </div>
                    <div className="text-xs text-slate-500">
                      Live balance &amp; interest waivers
                    </div>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </Link>

              <Link
                to="/realty/letters"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <EnvelopeIcon className="size-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Customer Letters
                    </div>
                    <div className="text-xs text-slate-500">
                      Allotment, demand, NOC templates
                    </div>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </Link>

              <Link
                to="/realty/reports"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ChartBarIcon className="size-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      Financial Reports
                    </div>
                    <div className="text-xs text-slate-500">
                      Collection, Aging, TDS 194-IA, GST
                    </div>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
