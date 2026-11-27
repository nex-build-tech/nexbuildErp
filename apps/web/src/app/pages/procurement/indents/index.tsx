import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function MaterialIndentsPage() {
  const [indents, setIndents] = useState<any[]>([]);
  const [selectedIndent, setSelectedIndent] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // New Indent Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [newSiteId, setNewSiteId] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newPurpose, setNewPurpose] = useState("");
  const [newLines, setNewLines] = useState<any[]>([
    { itemId: "", quantity: 1, unitRate: 0, remarks: "" },
  ]);

  useEffect(() => {
    fetchIndents();
    fetchMetadata();
  }, []);

  const fetchIndents = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/procurement/indents");
      setIndents(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching indents", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [sRes, iRes] = await Promise.all([
        axios.get("/masters/sites"),
        axios.get("/masters/items"),
      ]);
      setSites(sRes.data?.data || []);
      setItems(iRes.data?.data || []);
      if (sRes.data?.data?.length > 0) {
        setNewSiteId(sRes.data.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching metadata", err);
    }
  };

  const viewDetails = async (id: number) => {
    try {
      const res = await axios.get(`/procurement/indents/${id}`);
      setSelectedIndent(res.data?.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await axios.patch(`/procurement/indents/${id}/status`, { status });
      fetchIndents();
      if (selectedIndent && selectedIndent.id === id) {
        viewDetails(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLine = () => {
    setNewLines([...newLines, { itemId: "", quantity: 1, unitRate: 0, remarks: "" }]);
  };

  const handleRemoveLine = (idx: number) => {
    setNewLines(newLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, value: any) => {
    const updated = [...newLines];
    updated[idx][field] = value;
    if (field === "itemId") {
      const it = items.find((item) => String(item.id) === String(value));
      if (it) {
        updated[idx].unitId = it.unitId;
        updated[idx].unitRate = Number(it.defaultRate) || 0;
      }
    }
    setNewLines(updated);
  };

  const handleCreateIndent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        siteId: Number(newSiteId),
        priority: newPriority,
        purpose: newPurpose,
        items: newLines.filter((l) => l.itemId).map((l) => ({
          itemId: Number(l.itemId),
          quantity: Number(l.quantity),
          unitId: Number(l.unitId),
          estimatedRate: Number(l.unitRate),
          remarks: l.remarks,
        })),
      };
      await axios.post("/procurement/indents", payload);
      setShowCreateModal(false);
      setNewLines([{ itemId: "", quantity: 1, unitRate: 0, remarks: "" }]);
      setNewPurpose("");
      fetchIndents();
    } catch (err) {
      console.error("Failed to create indent", err);
    }
  };

  const filteredIndents = indents.filter((ind) => {
    const matchSearch =
      ind.indentNumber.toLowerCase().includes(search.toLowerCase()) ||
      ind.siteName?.toLowerCase().includes(search.toLowerCase()) ||
      ind.purpose?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || ind.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300";
      case "high":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300";
      case "submitted":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-dark-700 dark:text-dark-300";
    }
  };

  return (
    <Page title="Site Material Indents">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="size-6 text-[#c5a04e]" />
              Site Material Indents &amp; Requisitions
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Field requisitions raised by Site Engineers for materials, tools, and project supplies.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-xs py-2 shadow-sm"
            >
              <PlusIcon className="size-4" /> Raise Material Indent
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              {["ALL", "submitted", "approved", "rejected", "po_created"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    filterStatus === st
                      ? "bg-[#c5a04e] text-white shadow-sm"
                      : "bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL" ? "All Indents" : st.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="w-full md:w-80">
              <Input
                placeholder="Search indent #, site, purpose..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<MagnifyingGlassIcon className="size-4 text-slate-400" />}
              />
            </div>
          </div>
        </Card>

        {/* Indents Table */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-700 overflow-hidden bg-white dark:bg-dark-800">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading indents...</div>
          ) : filteredIndents.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No material indents found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-dark-700/60 text-slate-500 dark:text-dark-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-700">
                  <tr>
                    <th className="py-3 px-4">Indent Number</th>
                    <th className="py-3 px-4">Site / Project</th>
                    <th className="py-3 px-4">Raised By</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {filteredIndents.map((ind) => (
                    <tr
                      key={ind.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-dark-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {ind.indentNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-dark-100">
                          {ind.siteName}
                        </div>
                        <div className="text-[11px] text-slate-400">{ind.purpose}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-dark-300">
                        {ind.requestedByName || "Site Engineer"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPriorityBadge(
                            ind.priority
                          )}`}
                        >
                          {ind.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-dark-200">
                        {ind.itemCount} items
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${getStatusBadge(
                            ind.status
                          )}`}
                        >
                          {ind.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => viewDetails(ind.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-slate-700 dark:text-dark-200 rounded font-semibold text-[11px]"
                        >
                          View Lines
                        </button>
                        {ind.status === "submitted" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(ind.id, "approved")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(ind.id, "rejected")}
                              className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded font-semibold text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Selected Indent Detail Modal */}
        {selectedIndent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-6 bg-white dark:bg-dark-800 rounded-2xl space-y-4 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b pb-3 dark:border-dark-700">
                <div>
                  <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {selectedIndent.indentNumber}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-dark-100 mt-1">
                    {selectedIndent.siteName}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedIndent.purpose}</p>
                </div>
                <button
                  onClick={() => setSelectedIndent(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Requested Materials
                </h3>
                <div className="overflow-x-auto border rounded-xl dark:border-dark-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-dark-700 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5">HSN</th>
                        <th className="p-2.5">Quantity</th>
                        <th className="p-2.5">Est. Rate</th>
                        <th className="p-2.5">Est. Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                      {selectedIndent.items?.map((it: any) => (
                        <tr key={it.id}>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-dark-100">
                            {it.itemName} ({it.itemCode})
                          </td>
                          <td className="p-2.5 font-mono text-slate-500">{it.hsnCode || "-"}</td>
                          <td className="p-2.5 font-bold">
                            {Number(it.quantity).toFixed(2)} {it.unitCode}
                          </td>
                          <td className="p-2.5">₹{Number(it.estimatedRate).toFixed(2)}</td>
                          <td className="p-2.5 font-semibold text-emerald-600">
                            ₹{Number(it.estimatedAmount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button onClick={() => setSelectedIndent(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Raise Indent Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-6 bg-white dark:bg-dark-800 rounded-2xl space-y-4 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b pb-3 dark:border-dark-700">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-dark-100">
                    Raise Material Indent
                  </h2>
                  <p className="text-xs text-slate-500">
                    Submit requirement for site construction supplies or consumables.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateIndent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Site / Project
                    </label>
                    <select
                      value={newSiteId}
                      onChange={(e) => setNewSiteId(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-dark-700 border-slate-200 dark:border-dark-600"
                      required
                    >
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Priority
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-dark-700 border-slate-200 dark:border-dark-600"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-dark-200">
                    Purpose / Work Description
                  </label>
                  <Input
                    placeholder="e.g. 14th floor slab casting, plumbing repairs..."
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                    required
                  />
                </div>

                {/* Dynamic Line Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-dark-200">
                      Materials &amp; Items
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <PlusIcon className="size-3" /> Add Item
                    </button>
                  </div>

                  {newLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center bg-slate-50 dark:bg-dark-700 p-2 rounded-lg"
                    >
                      <select
                        value={line.itemId}
                        onChange={(e) => handleLineChange(idx, "itemId", e.target.value)}
                        className="flex-1 text-xs p-2 border rounded bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-600"
                        required
                      >
                        <option value="">Select Item / Material...</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name} ({it.code})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, "quantity", e.target.value)}
                        className="w-20 text-xs p-2 border rounded bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-600"
                        min="0.1"
                        step="any"
                        required
                      />

                      {newLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold px-1"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t dark:border-dark-700">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#c5a04e] hover:bg-[#b58f3e] text-white text-xs"
                  >
                    Submit Requisition
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
