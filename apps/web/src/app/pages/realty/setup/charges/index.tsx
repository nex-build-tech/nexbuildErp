import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  CurrencyRupeeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface ChargeHeadItem {
  id: number;
  code: string;
  name: string;
  calcType: "fixed" | "per_sqft" | "pct_of_agreement" | "per_month";
  defaultValue: string;
  gstApplicable: boolean;
  gstRate?: string | null;
  sequence: number;
}

export default function ChargeHeadsPriceListPage() {
  const [chargeHeads, setChargeHeads] = useState<ChargeHeadItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    code: string;
    name: string;
    calcType: "fixed" | "per_sqft" | "pct_of_agreement" | "per_month";
    defaultValue: string;
    gstApplicable: boolean;
    gstRate: string;
    sequence: number;
  }>({
    code: "",
    name: "",
    calcType: "fixed",
    defaultValue: "0.00",
    gstApplicable: false,
    gstRate: "18.0000",
    sequence: 1,
  });

  useEffect(() => {
    fetchChargeHeads();
  }, []);

  const fetchChargeHeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/setup/charge-heads");
      setChargeHeads(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Failed to load charge heads", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      code: "",
      name: "",
      calcType: "fixed",
      defaultValue: "0.00",
      gstApplicable: false,
      gstRate: "18.0000",
      sequence: chargeHeads.length + 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ch: ChargeHeadItem) => {
    setEditingId(ch.id);
    setForm({
      code: ch.code,
      name: ch.name,
      calcType: ch.calcType,
      defaultValue: ch.defaultValue,
      gstApplicable: ch.gstApplicable,
      gstRate: ch.gstRate || "18.0000",
      sequence: ch.sequence,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await axios.patch(`/realty/setup/charge-heads/${editingId}`, form);
        alert("✅ Charge head updated!");
      } else {
        await axios.post("/realty/setup/charge-heads", form);
        alert("✅ Charge head created!");
      }
      setModalOpen(false);
      await fetchChargeHeads();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this charge head?")) return;
    try {
      await axios.delete(`/realty/setup/charge-heads/${id}`);
      await fetchChargeHeads();
    } catch (err: any) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <Page title="Charge Heads & Price List">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-100 flex items-center gap-2.5">
              <CurrencyRupeeIcon className="size-7 text-primary-600" />
              Charge Heads &amp; Price List
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Configure standard extra charge heads, statutory GST rates, base rates, and floor rise calculation tables.
            </p>
          </div>

          <Button color="primary" onClick={handleOpenCreate}>
            <PlusIcon className="size-4 mr-1.5" /> Add Charge Head
          </Button>
        </div>

        {/* Pricing Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-4 space-y-1 border">
            <span className="text-xs font-semibold text-slate-500">Base Carpet Rate</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-dark-100">
              ₹26,250 <span className="text-xs font-normal text-slate-400">/ sq ft</span>
            </div>
            <p className="text-[11px] text-slate-400">Standard project baseline</p>
          </Card>

          <Card className="p-4 space-y-1 border">
            <span className="text-xs font-semibold text-slate-500">Floor Rise Escalation</span>
            <div className="text-xl font-bold font-mono text-primary-600">
              +₹50 <span className="text-xs font-normal text-slate-400">/ sq ft / floor</span>
            </div>
            <p className="text-[11px] text-slate-400">Applies above the 4th floor</p>
          </Card>

          <Card className="p-4 space-y-1 border">
            <span className="text-xs font-semibold text-slate-500">Car Parking Charges</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-dark-100">
              ₹5,00,000 <span className="text-xs font-normal text-slate-400">stilt</span>
            </div>
            <p className="text-[11px] text-slate-400">5% GST applicable</p>
          </Card>

          <Card className="p-4 space-y-1 border">
            <span className="text-xs font-semibold text-slate-500">Standard Charge Heads</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-dark-100">
              {chargeHeads.length} <span className="text-xs font-normal text-slate-400">heads</span>
            </div>
            <p className="text-[11px] text-slate-400">Society, Legal, MSEB, Corpus</p>
          </Card>
        </div>

        {/* Charge Heads Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4 dark:border-dark-700">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                Configured Charge Heads Register
              </h3>
              <p className="text-xs text-slate-500">
                These charge heads automatically appear in cost sheets and booking agreement values.
              </p>
            </div>
            <Badge color="primary" className="text-xs">
              {chargeHeads.length} Active Heads
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-dark-750 text-slate-600 dark:text-dark-300 font-bold border-b dark:border-dark-700 uppercase">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Charge Name</th>
                  <th className="py-2.5 px-3">Calculation Type</th>
                  <th className="py-2.5 px-3">Standard Amount / Rate</th>
                  <th className="py-2.5 px-3">GST Applicable</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading charge heads...
                    </td>
                  </tr>
                ) : chargeHeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No charge heads configured yet.
                    </td>
                  </tr>
                ) : (
                  chargeHeads.map((ch, idx) => (
                  <tr key={ch.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{ch.sequence || idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-primary-600">{ch.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-dark-100">
                      {ch.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-dark-700 dark:text-slate-300 uppercase">
                        {ch.calcType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-dark-200">
                      ₹{parseFloat(ch.defaultValue).toLocaleString("en-IN")}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        {ch.calcType === "per_sqft" ? "/ sq ft" : ch.calcType === "per_month" ? "/ month" : ""}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {ch.gstApplicable ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {parseFloat(ch.gstRate || "18").toFixed(0)}% GST
                        </span>
                      ) : (
                        <span className="text-slate-400">Exempt</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(ch)}
                        className="text-slate-500 hover:text-primary-600 transition-colors p-1"
                        title="Edit Charge Head"
                      >
                        <PencilSquareIcon className="size-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(ch.id)}
                        className="text-slate-500 hover:text-rose-600 transition-colors p-1"
                        title="Delete Charge Head"
                      >
                        <TrashIcon className="size-4 inline" />
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-md shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                {editingId ? "Edit Charge Head" : "Add Charge Head"}
              </h3>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LEGAL"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border px-3 py-1.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      Sequence #
                    </label>
                    <input
                      type="number"
                      value={form.sequence}
                      onChange={(e) => setForm({ ...form, sequence: Number(e.target.value) })}
                      className="w-full rounded-xl border px-3 py-1.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Charge Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Legal & Documentation"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      Calculation Basis
                    </label>
                    <select
                      value={form.calcType}
                      onChange={(e) => setForm({ ...form, calcType: e.target.value as any })}
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                    >
                      <option value="fixed">Fixed Amount</option>
                      <option value="per_sqft">Per Sq Ft Carpet</option>
                      <option value="per_month">Per Month</option>
                      <option value="pct_of_agreement">% of Agreement</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      Default Value (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.defaultValue}
                      onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                      className="w-full rounded-xl border px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-dark-750 rounded-xl space-y-2 border">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-dark-300">
                    <input
                      type="checkbox"
                      checked={form.gstApplicable}
                      onChange={(e) => setForm({ ...form, gstApplicable: e.target.checked })}
                      className="rounded"
                    />
                    GST Applicable on this charge
                  </label>

                  {form.gstApplicable && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        GST Rate (%)
                      </label>
                      <select
                        value={form.gstRate}
                        onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                        className="w-full rounded-lg border px-3 py-1.5 text-xs font-mono"
                      >
                        <option value="18.0000">18% Standard Services</option>
                        <option value="5.0000">5% Residential Construction</option>
                        <option value="12.0000">12% Works Contract</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-dark-700">
                  <Button variant="outlined" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Charge Head"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
