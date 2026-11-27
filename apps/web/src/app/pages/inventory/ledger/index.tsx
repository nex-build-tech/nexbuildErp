import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";

export default function StockLedgerPage() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/inventory/stock-ledger");
      setLedger(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLedger = ledger.filter(
    (l) =>
      l.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      l.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
      l.warehouseName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Page title="Stock Movement Ledger">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <BookOpenIcon className="size-6 text-[#c5a04e]" />
              Stock Movement Ledger
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Double-entry perpetual inventory log tracking all store inward receipts (GRN) and site material dispatches with running balances.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Total Transactions: {ledger.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search reference #, item, store..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<MagnifyingGlassIcon className="size-4 text-slate-400" />}
            />
          </div>
        </Card>

        {/* Ledger Table */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-700 overflow-hidden bg-white dark:bg-dark-800">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading stock transactions...</div>
          ) : filteredLedger.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No stock ledger transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-dark-700/60 text-slate-500 dark:text-dark-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-700">
                  <tr>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Material / SKU</th>
                    <th className="py-3 px-4">Store Location</th>
                    <th className="py-3 px-4 text-right">Qty Change</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                    <th className="py-3 px-4 text-right">Rate (₹)</th>
                    <th className="py-3 px-4 text-right">Total Value</th>
                    <th className="py-3 px-4">Action By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {filteredLedger.map((tx) => {
                    const isInward = Number(tx.quantity) > 0;
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-dark-700/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              isInward
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {isInward ? (
                              <ArrowDownLeftIcon className="size-3" />
                            ) : (
                              <ArrowUpRightIcon className="size-3" />
                            )}
                            {tx.movementType === "grn_inward" ? "GRN Inward" : "Site Issue"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-dark-200">
                          {tx.referenceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-dark-100">
                            {tx.itemName}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">{tx.itemCode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-dark-200">
                            {tx.warehouseName}
                          </div>
                          <div className="text-[10px] text-slate-400">{tx.siteName}</div>
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                            isInward ? "text-emerald-600" : "text-blue-600"
                          }`}
                        >
                          {isInward ? `+${Number(tx.quantity).toFixed(2)}` : Number(tx.quantity).toFixed(2)}{" "}
                          <span className="text-[10px] font-normal">{tx.unitCode}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-dark-100">
                          {Number(tx.balanceAfter).toFixed(2)} {tx.unitCode}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-dark-300">
                          ₹{Number(tx.unitRate).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-dark-200">
                          ₹{Number(tx.totalValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{tx.performedByName || "Store"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
