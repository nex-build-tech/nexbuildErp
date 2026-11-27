import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  CircleStackIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

export default function StockSummaryPage() {
  const [summary, setSummary] = useState<any>({
    totalValuation: "0.00",
    itemCount: 0,
    lowStockCount: 0,
    items: [],
  });
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
    fetchStockSummary();
  }, [selectedWarehouseId]);

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get("/masters/warehouses");
      setWarehouses(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockSummary = async () => {
    setLoading(true);
    try {
      const url =
        selectedWarehouseId !== "ALL"
          ? `/inventory/stock-summary?warehouseId=${selectedWarehouseId}`
          : "/inventory/stock-summary";
      const res = await axios.get(url);
      setSummary(res.data?.data || { totalValuation: "0.00", itemCount: 0, lowStockCount: 0, items: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = (summary.items || []).filter((it: any) => {
    const matchSearch =
      it.itemName.toLowerCase().includes(search.toLowerCase()) ||
      it.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      it.categoryName?.toLowerCase().includes(search.toLowerCase());
    const matchLowStock = onlyLowStock ? it.isLowStock : true;
    return matchSearch && matchLowStock;
  });

  return (
    <Page title="Stock Summary & Valuation">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <CircleStackIcon className="size-6 text-[#c5a04e]" />
              Stock Summary &amp; Valuation
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Live on-hand inventory balances across project site stores with weighted average rate valuation and reorder replenishment alerts.
            </p>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Inventory Value
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-dark-100 mt-1">
                ₹{Number(summary.totalValuation).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                Weighted Average Cost
              </p>
            </div>
            <div className="size-12 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-[#c5a04e]">
              <BanknotesIcon className="size-7" />
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Materials In Stock
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-dark-100 mt-1">
                {summary.itemCount} SKUs
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Across site stores</p>
            </div>
            <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <BuildingStorefrontIcon className="size-7" />
            </div>
          </Card>

          <Card
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between shadow-sm ${
              onlyLowStock
                ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20"
                : "border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <ExclamationTriangleIcon className="size-4" /> Low Stock Alerts
              </p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {summary.lowStockCount} Items
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {onlyLowStock ? "Filtered: showing low stock only" : "Click to filter replenishment"}
              </p>
            </div>
            <div className="size-12 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600">
              <ExclamationTriangleIcon className="size-7" />
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-xs font-bold text-slate-600 dark:text-dark-300 shrink-0">
                Store Location:
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="p-2 text-xs border rounded-lg bg-white dark:bg-dark-700 border-slate-200 dark:border-dark-600"
              >
                <option value="ALL">All Stores &amp; Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-80">
              <Input
                placeholder="Search material name, SKU code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<MagnifyingGlassIcon className="size-4 text-slate-400" />}
              />
            </div>
          </div>
        </Card>

        {/* Stock Items Table */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-700 overflow-hidden bg-white dark:bg-dark-800">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading stock balances...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No stock balances found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-dark-700/60 text-slate-500 dark:text-dark-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-700">
                  <tr>
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Material Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Warehouse / Store</th>
                    <th className="py-3 px-4 text-right">Available Qty</th>
                    <th className="py-3 px-4 text-right">Reorder Lvl</th>
                    <th className="py-3 px-4 text-right">Wtd Avg Rate</th>
                    <th className="py-3 px-4 text-right">Total Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {filteredItems.map((it: any) => (
                    <tr
                      key={it.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-dark-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {it.itemCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-dark-100">
                        {it.itemName}
                        {it.isLowStock && (
                          <span className="ml-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-dark-400">
                        {it.categoryName || "General"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-dark-200">
                          {it.warehouseName}
                        </div>
                        <div className="text-[10px] text-slate-400">{it.siteName}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-base text-slate-900 dark:text-dark-100">
                        {Number(it.quantity).toFixed(2)} {it.unitCode}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {Number(it.reorderLevel).toFixed(0)} {it.unitCode}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-dark-300">
                        ₹{Number(it.weightedAvgRate).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(it.totalValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
