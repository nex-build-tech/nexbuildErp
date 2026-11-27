import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input } from "@/components/ui";
import axios from "@/utils/axios";
import { MagnifyingGlassIcon, PlusIcon, TagIcon } from "@heroicons/react/24/outline";

export default function ItemsMaster() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [selectedCat]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const url =
        selectedCat !== "ALL"
          ? `/masters/items?categoryId=${selectedCat}`
          : "/masters/items";
      const res = await axios.get(url);
      setItems(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/masters/categories");
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.code.toLowerCase().includes(search.toLowerCase()) ||
      (i.hsnCode && i.hsnCode.includes(search))
  );

  const getGstBadge = (rate: string) => {
    if (rate === "Exempt" || rate === "0") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300";
    }
    if (rate === "5") {
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300";
    }
    if (rate === "12") {
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300";
    }
    if (rate === "18") {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
    }
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300";
  };

  return (
    <Page title="Items & Materials Master">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <TagIcon className="size-6 text-[#c5a04e]" />
              Items &amp; Materials Master
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Construction raw materials, fittings, tools, and housekeeping supplies with HSN codes &amp; GST rates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Total Items: {filteredItems.length}
            </span>
            <Button color="primary" className="flex items-center gap-1.5 text-xs py-2">
              <PlusIcon className="size-4" /> Add Item
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search by code, item name, HSN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<MagnifyingGlassIcon className="size-4 text-slate-400" />}
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCat("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCat === "ALL"
                    ? "bg-[#c5a04e] text-white"
                    : "bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCat(String(c.id))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    selectedCat === String(c.id)
                      ? "bg-[#c5a04e] text-white"
                      : "bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300 hover:bg-slate-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Items Table */}
        <Card className="rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-dark-750 text-slate-500 dark:text-dark-400 border-b border-slate-200 dark:border-dark-700 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Item Name &amp; Brand</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Unit</th>
                  <th className="px-4 py-3.5">HSN/SAC</th>
                  <th className="px-4 py-3.5 text-center">GST Rate</th>
                  <th className="px-4 py-3.5 text-right">Default Rate (₹)</th>
                  <th className="px-4 py-3.5 text-right">Reorder Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading materials...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No materials found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-dark-750/50 transition"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-dark-200">
                        {item.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-dark-100">
                          {item.name}
                        </div>
                        {item.brand && (
                          <div className="text-[10px] text-slate-400">
                            Brand: {item.brand}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-dark-300">
                        {item.category?.name || "General"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600 dark:text-dark-300">
                        {item.unit?.name} ({item.unit?.code})
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {item.hsnCode || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getGstBadge(
                            item.gstRate
                          )}`}
                        >
                          {item.gstRate === "Exempt" ? "Exempt (0%)" : `${item.gstRate}%`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-dark-100">
                        ₹ {parseFloat(item.defaultRate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {parseFloat(item.reorderLevel || 0).toLocaleString("en-IN")}{" "}
                        {item.unit?.symbol}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Page>
  );
}
