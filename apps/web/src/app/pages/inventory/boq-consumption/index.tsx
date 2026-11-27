import { useState, useEffect } from "react";
import axios from "axios";
import { Page } from "@/components/shared/Page";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ChartBarSquareIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function BoqConsumptionPage() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("1");
  const [data, setData] = useState<{ summary: any; items: any[] }>({
    summary: {
      totalBudgetedAmount: 0,
      totalConsumedAmount: 0,
      overallUtilizationPercent: 0,
      itemCount: 0,
      breachedCount: 0,
      cautionCount: 0,
      normalCount: 0,
    },
    items: [],
  });
  const [packageFilter, setPackageFilter] = useState<string>("");

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchComparison();
    }
  }, [selectedSite]);

  const fetchSites = async () => {
    try {
      const res = await axios.get("/masters/sites");
      const list = res.data?.data || [];
      setSites(list);
      if (list.length > 0) {
        setSelectedSite(String(list[0].id));
      }
    } catch {
      // ignore
    }
  };

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/boq/consumption-comparison", {
        params: { siteId: selectedSite },
      });
      setData(res.data?.data || { summary: {}, items: [] });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = packageFilter
    ? data.items.filter((it) => it.workPackage === packageFilter)
    : data.items;

  const workPackages = Array.from(new Set(data.items.map((it) => it.workPackage)));

  const exportCsv = () => {
    if (filteredItems.length === 0) return;
    const headers = [
      "Item Code",
      "Description",
      "Work Package",
      "UOM",
      "Budgeted Qty",
      "Consumed Qty",
      "Received Qty",
      "Remaining Qty",
      "Utilization %",
      "Budgeted Value (INR)",
      "Consumed Value (INR)",
      "Status",
    ];

    const rows = filteredItems.map((it) => [
      `"${it.itemCode}"`,
      `"${it.description}"`,
      `"${it.workPackage}"`,
      `"${it.uom}"`,
      it.budgetedQty,
      it.consumedQty,
      it.receivedQty,
      it.remainingQty,
      `${it.utilizationPercent}%`,
      it.budgetedAmount,
      it.consumedAmount,
      it.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BOQ_Consumption_Report_Site_${selectedSite}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Page title="Site Consumption vs BOQ Baseline">
      <div className="flex flex-col gap-6">
        {/* Control bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-lg">
              <ChartBarSquareIcon className="w-6 h-6" />
              <span>BOQ Variance Analysis</span>
            </div>

            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 px-3 py-1.5 focus:ring-primary-500"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>

            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 px-3 py-1.5 focus:ring-primary-500"
            >
              <option value="">All Work Packages</option>
              {workPackages.map((wp) => (
                <option key={wp} value={wp}>
                  {wp}
                </option>
              ))}
            </select>

            <button
              onClick={fetchComparison}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 px-3 py-2 rounded-lg transition"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 px-3 py-2 rounded-lg transition"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Total BOQ Budget</span>
            <p className="text-xl font-bold font-mono text-gray-900 dark:text-gray-100 mt-1">
              ₹{(Number(data.summary.totalBudgetedAmount) || 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
            <span className="text-[11px] text-gray-400 mt-1 block">Baseline Material Cost</span>
          </div>

          <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Actual Consumed Cost</span>
            <p className="text-xl font-bold font-mono text-primary-600 dark:text-primary-400 mt-1">
              ₹{(Number(data.summary.totalConsumedAmount) || 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
            <span className="text-[11px] text-gray-400 mt-1 block">Materials Issued to Work</span>
          </div>

          <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">BOQ Utilization Rate</span>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {data.summary.overallUtilizationPercent}%
            </p>
            <span className="text-[11px] text-gray-400 mt-1 block">Budget consumption pace</span>
          </div>

          <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Over-Budget Warnings</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-rose-600">
                {data.summary.breachedCount}
              </span>
              <span className="text-xs text-gray-400">breached / {data.summary.cautionCount} near limit</span>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">Exceeding tolerance threshold</span>
          </div>
        </div>

        {/* Main Comparison Table */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
              Material-wise Consumption vs Budget
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              Showing {filteredItems.length} BOQ Line Items
            </span>
          </div>

          {loading ? (
            <TableSkeleton rows={5} columns={8} />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No BOQ Baseline Items Found"
              description="Upload or define BOQ quantities for this site to monitor consumption vs budget."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-dark-700/70 border-b border-gray-200 dark:border-dark-700 font-semibold text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="p-3">Material Item</th>
                    <th className="p-3">Work Package</th>
                    <th className="p-3 text-right">BOQ Budget</th>
                    <th className="p-3 text-right">Consumed</th>
                    <th className="p-3 text-right">In Store</th>
                    <th className="p-3 text-center w-48">Utilization %</th>
                    <th className="p-3 text-right">Budget Value</th>
                    <th className="p-3 text-right">Consumed Value</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                  {filteredItems.map((item) => {
                    const pct = item.utilizationPercent;
                    const barColor =
                      item.status === "BREACHED"
                        ? "bg-rose-500"
                        : item.status === "CAUTION"
                        ? "bg-amber-500"
                        : "bg-emerald-500";

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-700/30 transition">
                        <td className="p-3">
                          <span className="font-mono text-gray-400 text-[11px] block">{item.itemCode}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.description}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{item.workPackage}</td>
                        <td className="p-3 text-right font-mono text-gray-600 dark:text-gray-300">
                          {Number(item.budgetedQty).toLocaleString("en-IN")} {item.uom}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-primary-600 dark:text-primary-400">
                          {Number(item.consumedQty).toLocaleString("en-IN")} {item.uom}
                        </td>
                        <td className="p-3 text-right font-mono text-gray-500">
                          {Number(item.receivedQty).toLocaleString("en-IN")} {item.uom}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-dark-600 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold w-12 text-right">
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-gray-500">
                          ₹{Number(item.budgetedAmount).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                          ₹{Number(item.consumedAmount).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              item.status === "BREACHED"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                                : item.status === "CAUTION"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            }`}
                          >
                            {item.status === "BREACHED" && <ExclamationTriangleIcon className="w-3 h-3" />}
                            {item.status === "NORMAL" && <CheckCircleIcon className="w-3 h-3" />}
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
