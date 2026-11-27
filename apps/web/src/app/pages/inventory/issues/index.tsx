import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  ArrowUpTrayIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function MaterialIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New Issue Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);

  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedContractorId, setSelectedContractorId] = useState("");
  const [issuedToName, setIssuedToName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [issueLines, setIssueLines] = useState<any[]>([
    { itemId: "", quantity: 1, availableQty: 0, unitRate: 0, unitId: 0, unitCode: "" },
  ]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchIssues();
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchStockForWarehouse(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/inventory/issues");
      setIssues(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [sRes, wRes, cRes] = await Promise.all([
        axios.get("/masters/sites"),
        axios.get("/masters/warehouses"),
        axios.get("/masters/contractors"),
      ]);
      setSites(sRes.data?.data || []);
      setWarehouses(wRes.data?.data || []);
      setContractors(cRes.data?.data || []);
      if (sRes.data?.data?.length > 0) setSelectedSiteId(sRes.data.data[0].id);
      if (wRes.data?.data?.length > 0) setSelectedWarehouseId(wRes.data.data[0].id);
      if (cRes.data?.data?.length > 0) setSelectedContractorId(cRes.data.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockForWarehouse = async (whId: string | number) => {
    try {
      const res = await axios.get(`/inventory/stock-summary?warehouseId=${whId}`);
      setStockItems(res.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const viewIssueDetails = async (id: number) => {
    try {
      const res = await axios.get(`/inventory/issues/${id}`);
      setSelectedIssue(res.data?.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLine = () => {
    setIssueLines([
      ...issueLines,
      { itemId: "", quantity: 1, availableQty: 0, unitRate: 0, unitId: 0, unitCode: "" },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setIssueLines(issueLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, value: any) => {
    const updated = [...issueLines];
    updated[idx][field] = value;
    if (field === "itemId") {
      const it = stockItems.find((s) => String(s.itemId) === String(value));
      if (it) {
        updated[idx].availableQty = Number(it.quantity) || 0;
        updated[idx].unitRate = Number(it.weightedAvgRate) || 0;
        updated[idx].unitCode = it.unitCode;
      }
    }
    setIssueLines(updated);
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate quantities against available stock
    for (const l of issueLines) {
      if (Number(l.quantity) > Number(l.availableQty)) {
        setErrorMessage(
          `Requested quantity (${l.quantity}) exceeds available stock (${l.availableQty}) for one or more items.`
        );
        return;
      }
    }

    try {
      const payload = {
        siteId: Number(selectedSiteId),
        warehouseId: Number(selectedWarehouseId),
        contractorId: selectedContractorId ? Number(selectedContractorId) : null,
        issuedToName,
        purpose,
        items: issueLines.map((l) => ({
          itemId: Number(l.itemId),
          quantity: Number(l.quantity),
          unitId: 1, // unit mapped
          unitRate: Number(l.unitRate),
        })),
      };
      const res = await axios.post("/inventory/issues", payload);
      setShowCreateModal(false);
      fetchIssues();
      if (selectedWarehouseId) fetchStockForWarehouse(selectedWarehouseId);
      if (res.data?.data) {
        viewIssueDetails(res.data.data.id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to create material issue");
    }
  };

  const filteredIssues = issues.filter(
    (iss) =>
      iss.issueNumber.toLowerCase().includes(search.toLowerCase()) ||
      iss.issuedToName?.toLowerCase().includes(search.toLowerCase()) ||
      iss.purpose?.toLowerCase().includes(search.toLowerCase()) ||
      iss.siteName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Page title="Site Material Issues">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <ArrowUpTrayIcon className="size-6 text-[#c5a04e]" />
              Site Material Issues &amp; Consumption
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Store dispatches to contractors, engineers, and site activities with strict negative-stock prevention.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-xs py-2 shadow-sm"
            >
              <PlusIcon className="size-4" /> Issue Materials
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search Issue #, recipient, work purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<MagnifyingGlassIcon className="size-4 text-slate-400" />}
            />
          </div>
        </Card>

        {/* Issues Table */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-700 overflow-hidden bg-white dark:bg-dark-800">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading material issues...</div>
          ) : filteredIssues.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No material issues found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-dark-700/60 text-slate-500 dark:text-dark-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-700">
                  <tr>
                    <th className="py-3 px-4">Issue Number</th>
                    <th className="py-3 px-4">Site &amp; Warehouse</th>
                    <th className="py-3 px-4">Issued To</th>
                    <th className="py-3 px-4">Work Purpose</th>
                    <th className="py-3 px-4">Issued By</th>
                    <th className="py-3 px-4 text-right">Total Value</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {filteredIssues.map((iss) => (
                    <tr
                      key={iss.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-dark-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {iss.issueNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-dark-100">
                          {iss.siteName}
                        </div>
                        <div className="text-[10px] text-slate-400">{iss.warehouseName}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-dark-200">
                        {iss.issuedToName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-dark-300 max-w-xs truncate">
                        {iss.purpose}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{iss.issuedByName || "Store Keeper"}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-dark-100">
                        ₹{Number(iss.totalValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border bg-blue-50 text-blue-700 border-blue-200">
                          {iss.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => viewIssueDetails(iss.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-dark-700 dark:text-dark-200 rounded font-semibold text-[11px]"
                        >
                          View Lines
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Issue Details Modal */}
        {selectedIssue && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-6 bg-white dark:bg-dark-800 rounded-2xl space-y-4 shadow-xl border border-slate-200 dark:border-dark-700">
              <div className="flex items-start justify-between border-b pb-3 dark:border-dark-700">
                <div>
                  <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {selectedIssue.issueNumber}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 mt-1">
                    {selectedIssue.siteName} — {selectedIssue.purpose}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Issued To: <strong>{selectedIssue.issuedToName}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="overflow-x-auto border rounded-xl dark:border-dark-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-dark-700 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-right">Quantity</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                    {selectedIssue.items?.map((it: any) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-medium">
                          {it.itemName} ({it.itemCode})
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {Number(it.quantity).toFixed(2)} {it.unitCode}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          ₹{Number(it.unitRate).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-dark-100">
                          ₹{Number(it.totalValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setSelectedIssue(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Issue Material Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-3xl w-full p-6 bg-white dark:bg-dark-800 rounded-2xl space-y-4 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b pb-3 dark:border-dark-700">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-dark-100">
                    Issue Material to Site
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dispatches from warehouse stock are verified against current balances.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleCreateIssue} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Site &amp; Project
                    </label>
                    <select
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
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
                      Issuing Warehouse Store
                    </label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-dark-700 border-slate-200 dark:border-dark-600"
                      required
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Contractor (Optional)
                    </label>
                    <select
                      value={selectedContractorId}
                      onChange={(e) => setSelectedContractorId(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-dark-700 border-slate-200 dark:border-dark-600"
                    >
                      <option value="">Direct Internal Site Work</option>
                      {contractors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.contractorType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Received By (Person / Foreman Name)
                    </label>
                    <Input
                      placeholder="e.g. Ramu Mistry / Suresh Electrician"
                      value={issuedToName}
                      onChange={(e) => setIssuedToName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-dark-200">
                    Activity / Purpose
                  </label>
                  <Input
                    placeholder="e.g. 5th floor slab rebar binding, sample flat painting"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                  />
                </div>

                {/* Issue Line Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-dark-200">
                      Materials to Issue
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <PlusIcon className="size-3" /> Add Material
                    </button>
                  </div>

                  {issueLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-dark-700 p-2 rounded-lg text-xs"
                    >
                      <div className="col-span-6">
                        <select
                          value={line.itemId}
                          onChange={(e) => handleLineChange(idx, "itemId", e.target.value)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-600 text-xs"
                          required
                        >
                          <option value="">Select In-Stock Material...</option>
                          {stockItems.map((s) => (
                            <option key={s.itemId} value={s.itemId}>
                              {s.itemName} (Available: {Number(s.quantity).toFixed(1)} {s.unitCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, "quantity", e.target.value)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-600 text-xs"
                          min="0.1"
                          max={line.availableQty || 99999}
                          step="any"
                          required
                        />
                      </div>

                      <div className="col-span-2 text-slate-500 font-mono text-[11px]">
                        Max: {line.availableQty} {line.unitCode}
                      </div>

                      <div className="col-span-1 text-right">
                        {issueLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-red-500 hover:text-red-700 font-bold px-1"
                          >
                            &times;
                          </button>
                        )}
                      </div>
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
                    Authorize &amp; Post Issue
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
