import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button } from "@/components/ui";
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type ReportTab =
  | "collection"
  | "outstanding"
  | "demand_vs_collection"
  | "receipt_register"
  | "flat_status"
  | "customer_directory"
  | "tds_reconciliation"
  | "gst_summary";

export default function RealtyReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("collection");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const fetchReport = async (tab: ReportTab) => {
    try {
      setLoading(true);
      let endpoint = "/realty/reports/collection";
      if (tab === "outstanding") endpoint = "/realty/reports/outstanding-ageing";
      if (tab === "demand_vs_collection") endpoint = "/realty/reports/demand-vs-collection";
      if (tab === "receipt_register") endpoint = "/realty/reports/receipt-register";
      if (tab === "flat_status") endpoint = "/realty/reports/flat-status";
      if (tab === "customer_directory") endpoint = "/realty/reports/customer-directory";
      if (tab === "tds_reconciliation") endpoint = "/realty/reports/tds-reconciliation";
      if (tab === "gst_summary") endpoint = "/realty/reports/gst-summary";

      const params: any = { siteId: 1 };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await axios.get(endpoint, { params });
      setData(res.data?.data !== undefined ? res.data.data : res.data);
    } catch (err) {
      console.error("Failed to load report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const handleExportCSV = () => {
    if (!data?.rows || data.rows.length === 0) return;
    const rows = data.rows;
    const headers = Object.keys(rows[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((row: any) =>
          headers
            .map((h) => {
              const val = row[h];
              if (typeof val === "string" && val.includes(",")) {
                return `"${val}"`;
              }
              return val ?? "";
            })
            .join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Realty_${activeTab}_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: any) => {
    const n = Number(val) || 0;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  return (
    <Page title="Financial & Operations Reports Suite">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <ChartBarIcon className="size-7 text-primary-600" />
              Financial &amp; Operations Reports Suite
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Real estate MIS registers, collection analysis, Section 194-IA TDS compliance, GST liabilities, and flat status audits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={() => fetchReport(activeTab)}
              disabled={loading}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ArrowPathIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              color="primary"
              onClick={handleExportCSV}
              disabled={!data?.rows || data.rows.length === 0}
              className="text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ArrowDownTrayIcon className="size-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
          {[
            { key: "collection", label: "Collections" },
            { key: "outstanding", label: "Outstanding & Aging" },
            { key: "demand_vs_collection", label: "Demand vs Collection" },
            { key: "receipt_register", label: "Receipt Register" },
            { key: "flat_status", label: "Flat Status Inventory" },
            { key: "customer_directory", label: "Customer Directory" },
            { key: "tds_reconciliation", label: "TDS 194-IA (≥50L)" },
            { key: "gst_summary", label: "GST Summary" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ReportTab)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span>From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span>To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <Button variant="outlined" onClick={() => fetchReport(activeTab)} className="text-xs py-1 px-3">
                Apply Filter
              </Button>
            </div>

            <div className="relative w-64">
              <MagnifyingGlassIcon className="size-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search table rows..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
        </Card>

        {/* Summary Banner */}
        {data?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeTab === "collection" && (
              <>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Total Receipts</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {data.summary.totalReceipts}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Gross Collected</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {formatCurrency(data.summary.totalAmount)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">TDS Deducted (194-IA)</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    {formatCurrency(data.summary.totalTds)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Net Bank Inflow</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                    {formatCurrency(data.summary.netCollected)}
                  </div>
                </Card>
              </>
            )}

            {activeTab === "outstanding" && (
              <>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Total Outstanding</div>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                    {formatCurrency(data.summary.totalOutstanding)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">0 - 30 Days</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {formatCurrency(data.summary.agingSummary?.bucket0_30)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">31 - 60 Days</div>
                  <div className="text-xl font-bold text-amber-600 mt-1 font-mono">
                    {formatCurrency(data.summary.agingSummary?.bucket31_60)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">90+ Days (Critical)</div>
                  <div className="text-xl font-bold text-rose-600 mt-1 font-mono">
                    {formatCurrency(data.summary.agingSummary?.bucket90Plus)}
                  </div>
                </Card>
              </>
            )}

            {activeTab === "demand_vs_collection" && (
              <>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Overall Demanded</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {formatCurrency(data.summary.overallDemanded)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Overall Collected</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    {formatCurrency(data.summary.overallCollected)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Outstanding Balance</div>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                    {formatCurrency(data.summary.overallOutstanding)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Efficiency %</div>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {data.summary.overallCollectionPercentage}%
                  </div>
                </Card>
              </>
            )}

            {activeTab === "tds_reconciliation" && (
              <>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Eligible Bookings (≥ 50L)</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {data.summary.totalEligibleBookings}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Total 1% TDS Liability</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {formatCurrency(data.summary.overallTdsDue)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">TDS Deposited by Buyers</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    {formatCurrency(data.summary.overallTdsDeposited)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Pending Form 16B TDS</div>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                    {formatCurrency(data.summary.overallPendingTds)}
                  </div>
                </Card>
              </>
            )}

            {activeTab === "gst_summary" && (
              <>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Taxable Demands Value</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {formatCurrency(data.summary.totalTaxable)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">CGST (2.5%)</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {formatCurrency(data.summary.totalCgst)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">SGST (2.5%)</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {formatCurrency(data.summary.totalSgst)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 uppercase">Total Output GST</div>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                    {formatCurrency(data.summary.totalGst)}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Main Report Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {!data?.rows || data.rows.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                {loading ? "Generating report..." : "No data records found for this query."}
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    {Object.keys(data.rows[0]).map((col) => (
                      <th key={col} className="px-4 py-3 whitespace-nowrap">
                        {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.rows
                    .filter((r: any) => {
                      if (!search) return true;
                      return JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
                    })
                    .map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {Object.keys(row).map((col) => {
                          const val = row[col];
                          const isCurrency =
                            typeof val === "number" &&
                            (col.toLowerCase().includes("amount") ||
                              col.toLowerCase().includes("total") ||
                              col.toLowerCase().includes("rate") ||
                              col.toLowerCase().includes("due") ||
                              col.toLowerCase().includes("received") ||
                              col.toLowerCase().includes("collected") ||
                              col.toLowerCase().includes("demanded") ||
                              col.toLowerCase().includes("cgst") ||
                              col.toLowerCase().includes("sgst") ||
                              col.toLowerCase().includes("gst") ||
                              col.toLowerCase().includes("cost") ||
                              col.toLowerCase().includes("forfeiture") ||
                              col.toLowerCase().includes("refund") ||
                              col.toLowerCase().includes("tds"));

                          return (
                            <td
                              key={col}
                              className={`px-4 py-2.5 whitespace-nowrap ${
                                isCurrency ? "text-right font-mono font-medium" : ""
                              }`}
                            >
                              {isCurrency ? formatCurrency(val) : String(val ?? "-")}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}
