import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  InboxArrowDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";

export default function GrnPage() {
  const [grns, setGrns] = useState<any[]>([]);
  const [selectedGrn, setSelectedGrn] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New GRN Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openPos, setOpenPos] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [gatePassNo, setGatePassNo] = useState("");
  const [inspectionRemarks, setInspectionRemarks] = useState("");
  const [grnLines, setGrnLines] = useState<any[]>([]);

  useEffect(() => {
    fetchGrns();
    fetchOpenPos();
  }, []);

  const fetchGrns = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/inventory/grns");
      setGrns(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenPos = async () => {
    try {
      const res = await axios.get("/procurement/pos");
      // Filter POs eligible for receipt: approved or partially_received
      const eligible = (res.data?.data || []).filter(
        (p: any) => p.status === "approved" || p.status === "partially_received"
      );
      setOpenPos(eligible);
      if (eligible.length > 0) {
        handleSelectPo(eligible[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPo = async (poId: string | number) => {
    setSelectedPoId(String(poId));
    try {
      const res = await axios.get(`/procurement/pos/${poId}`);
      const po = res.data?.data;
      if (po && po.items) {
        setGrnLines(
          po.items.map((it: any) => ({
            poItemId: it.id,
            itemId: it.itemId,
            itemName: it.itemName,
            itemCode: it.itemCode,
            unitId: it.unitId,
            unitCode: it.unitCode,
            unitRate: it.unitRate,
            orderedQty: Number(it.quantity) - Number(it.receivedQuantity || 0),
            acceptedQty: Number(it.quantity) - Number(it.receivedQuantity || 0),
            rejectedQty: 0,
            rejectionReason: "",
            batchNo: "",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewGrnDetails = async (id: number) => {
    try {
      const res = await axios.get(`/inventory/grns/${id}`);
      setSelectedGrn(res.data?.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLineQtyChange = (idx: number, field: "acceptedQty" | "rejectedQty", val: number) => {
    const updated = [...grnLines];
    updated[idx][field] = val;
    setGrnLines(updated);
  };

  const handleCreateGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        poId: Number(selectedPoId),
        challanNo,
        invoiceNo,
        vehicleNo,
        gatePassNo,
        inspectionRemarks,
        items: grnLines.map((l) => ({
          poItemId: l.poItemId,
          itemId: l.itemId,
          orderedQty: Number(l.orderedQty),
          receivedQty: Number(l.acceptedQty) + Number(l.rejectedQty),
          acceptedQty: Number(l.acceptedQty),
          rejectedQty: Number(l.rejectedQty),
          unitId: l.unitId,
          unitRate: Number(l.unitRate),
          rejectionReason: l.rejectionReason,
          batchNo: l.batchNo,
        })),
      };
      const res = await axios.post("/inventory/grns", payload);
      setShowCreateModal(false);
      fetchGrns();
      fetchOpenPos();
      if (res.data?.data) {
        viewGrnDetails(res.data.data.id);
      }
    } catch (err) {
      console.error("Failed to create GRN", err);
    }
  };

  const filteredGrns = grns.filter(
    (g) =>
      g.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
      g.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
      g.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      g.siteName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Page title="Goods Receipt Notes (Store Inward)">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <InboxArrowDownIcon className="size-6 text-[#c5a04e]" />
              Goods Receipt Notes (GRN / Store Inward)
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Store inward inspection against PO delivery challans with accepted/rejected quality audits and automatic stock ledger posting.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-xs py-2 shadow-sm"
            >
              <PlusIcon className="size-4" /> New Store Inward (GRN)
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search GRN #, PO #, vendor, site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<MagnifyingGlassIcon className="size-4 text-slate-400" />}
            />
          </div>
        </Card>

        {/* GRN Table */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-700 overflow-hidden bg-white dark:bg-dark-800">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading GRN records...</div>
          ) : filteredGrns.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No goods receipt notes found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-dark-700/60 text-slate-500 dark:text-dark-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-700">
                  <tr>
                    <th className="py-3 px-4">GRN Number</th>
                    <th className="py-3 px-4">PO Ref</th>
                    <th className="py-3 px-4">Supplier / Vendor</th>
                    <th className="py-3 px-4">Delivery Site &amp; Store</th>
                    <th className="py-3 px-4">Challan / Invoice</th>
                    <th className="py-3 px-4">Vehicle #</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {filteredGrns.map((g) => (
                    <tr
                      key={g.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-dark-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {g.grnNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-dark-300">
                        {g.poNumber || "Direct Inward"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-dark-100">
                        {g.vendorName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-dark-200">
                          {g.siteName}
                        </div>
                        <div className="text-[10px] text-slate-400">{g.warehouseName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-dark-300">
                        <div>Challan: {g.challanNo || "-"}</div>
                        <div className="text-[10px] text-slate-400">Inv: {g.invoiceNo || "-"}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-dark-300">
                        {g.vehicleNo || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                          {g.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => viewGrnDetails(g.id)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold text-[11px] inline-flex items-center gap-1 shadow-sm"
                        >
                          <PrinterIcon className="size-3.5" /> Inspection Sheet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Full A4 Printable GRN Sheet Modal */}
        {selectedGrn && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full p-8 bg-white dark:bg-dark-800 rounded-2xl space-y-6 shadow-2xl border border-slate-200 dark:border-dark-700 max-h-[92vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
              <div className="flex items-center justify-between border-b pb-4 dark:border-dark-700 print:hidden">
                <span className="font-mono text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-lg">
                  {selectedGrn.grnNumber}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => window.print()}
                    className="bg-[#c5a04e] hover:bg-[#b58f3e] text-white text-xs flex items-center gap-1.5"
                  >
                    <PrinterIcon className="size-4" /> Print GRN (A4)
                  </Button>
                  <button
                    onClick={() => setSelectedGrn(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Printable Inward Inspection Sheet */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-800 font-sans space-y-6">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase">
                      KINGS BUILDERS &amp; DEVELOPERS
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      Site Materials Inward &amp; Quality Inspection Report
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Site: <strong>{selectedGrn.siteName}</strong> | Warehouse: <strong>{selectedGrn.warehouseName}</strong>
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-xs uppercase tracking-wider">
                      GOODS RECEIPT NOTE
                    </span>
                    <p className="font-mono font-bold text-sm text-slate-900 mt-1">
                      {selectedGrn.grnNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      Inward Date: {new Date(selectedGrn.receivedDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">SUPPLIER</span>
                    <h4 className="font-bold text-slate-900 mt-0.5">{selectedGrn.vendorName}</h4>
                    <p className="font-mono text-slate-500">GSTIN: {selectedGrn.vendorGstin || "N/A"}</p>
                    <p className="font-medium text-amber-700 mt-1">PO #: {selectedGrn.poNumber}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">CHALLAN &amp; BILL</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      Challan #: {selectedGrn.challanNo || "N/A"}
                    </p>
                    <p className="text-slate-600">Invoice #: {selectedGrn.invoiceNo || "N/A"}</p>
                    <p className="text-slate-600">Gate Pass: {selectedGrn.gatePassNo || "GP-DEFAULT"}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">TRANSIT / VEHICLE</span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                      Vehicle: {selectedGrn.vehicleNo || "Direct Site Delivery"}
                    </p>
                    <p className="text-slate-600">Receiver: {selectedGrn.receivedByName || "Store Keeper"}</p>
                    <p className="text-emerald-700 font-semibold mt-1">Status: VERIFIED &amp; POSTED</p>
                  </div>
                </div>

                {/* Inspection Items Table */}
                <div className="overflow-x-auto border rounded-xl border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                      <tr>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2">Material Description</th>
                        <th className="p-2 text-center">Batch #</th>
                        <th className="p-2 text-right">Ordered</th>
                        <th className="p-2 text-right">Received</th>
                        <th className="p-2 text-right text-emerald-700">Accepted</th>
                        <th className="p-2 text-right text-rose-700">Rejected</th>
                        <th className="p-2 text-right">Unit Rate (₹)</th>
                        <th className="p-2 text-right">Inward Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedGrn.items?.map((it: any, i: number) => (
                        <tr key={it.id}>
                          <td className="p-2 text-center text-slate-400">{i + 1}</td>
                          <td className="p-2 font-medium">
                            {it.itemName}
                            <span className="block font-mono text-[10px] text-slate-400">
                              {it.itemCode}
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono text-slate-500">
                            {it.batchNo || "BATCH-OK"}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {Number(it.orderedQty).toFixed(2)} {it.unitCode}
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">
                            {Number(it.receivedQty).toFixed(2)} {it.unitCode}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-600">
                            {Number(it.acceptedQty).toFixed(2)} {it.unitCode}
                          </td>
                          <td className="p-2 text-right font-mono text-rose-600">
                            {Number(it.rejectedQty).toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-mono">
                            ₹{Number(it.unitRate).toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-mono font-bold">
                            ₹{Number(it.totalValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Quality Inspection Remarks: </span>
                  {selectedGrn.inspectionRemarks}
                </div>

                {/* Sign-off */}
                <div className="border-t pt-8 flex justify-between text-xs text-slate-500">
                  <div>
                    <p className="font-semibold text-slate-700">Inspected &amp; Unloaded By:</p>
                    <p className="mt-6 font-medium text-slate-800">Site Store Keeper</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-700">Quality Checked &amp; Approved By:</p>
                    <p className="mt-6 font-bold text-slate-900">Site In-charge / Project Engineer</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* New GRN Creation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-3xl w-full p-6 bg-white dark:bg-dark-800 rounded-2xl space-y-4 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b pb-3 dark:border-dark-700">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                    <DocumentCheckIcon className="size-5 text-[#c5a04e]" />
                    New Store Inward (GRN Entry)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Receive materials delivered against an approved Purchase Order.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateGrn} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Select Purchase Order (PO)
                    </label>
                    <select
                      value={selectedPoId}
                      onChange={(e) => handleSelectPo(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-dark-700 border-slate-200 dark:border-dark-600 font-mono"
                      required
                    >
                      {openPos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.poNumber} — {p.vendorName} ({p.siteName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Vehicle Number
                    </label>
                    <Input
                      placeholder="e.g. MH-02-AB-1234"
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Delivery Challan #
                    </label>
                    <Input
                      placeholder="e.g. CH-2026-001"
                      value={challanNo}
                      onChange={(e) => setChallanNo(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Vendor Invoice / Bill #
                    </label>
                    <Input
                      placeholder="e.g. INV-2026-99"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Site Gate Pass #
                    </label>
                    <Input
                      placeholder="e.g. GP/KH/101"
                      value={gatePassNo}
                      onChange={(e) => setGatePassNo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Inspection Items Table */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-dark-200">
                    Inspection &amp; Quantity Acceptance
                  </label>
                  <div className="border rounded-xl overflow-hidden dark:border-dark-700">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-dark-700 text-slate-600 dark:text-dark-300 font-semibold">
                        <tr>
                          <th className="p-2">Item</th>
                          <th className="p-2 text-center">Ordered</th>
                          <th className="p-2 text-center">Accepted</th>
                          <th className="p-2 text-center">Rejected</th>
                          <th className="p-2">Batch / Heat #</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                        {grnLines.map((line, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">
                              {line.itemName}
                              <span className="block font-mono text-[10px] text-slate-400">
                                {line.itemCode}
                              </span>
                            </td>
                            <td className="p-2 text-center font-mono font-bold">
                              {line.orderedQty} {line.unitCode}
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                value={line.acceptedQty}
                                onChange={(e) =>
                                  handleLineQtyChange(idx, "acceptedQty", Number(e.target.value))
                                }
                                className="w-20 text-center p-1 border rounded font-mono font-bold text-emerald-600 bg-white dark:bg-dark-800"
                                min="0"
                                step="any"
                                required
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                value={line.rejectedQty}
                                onChange={(e) =>
                                  handleLineQtyChange(idx, "rejectedQty", Number(e.target.value))
                                }
                                className="w-16 text-center p-1 border rounded font-mono text-rose-600 bg-white dark:bg-dark-800"
                                min="0"
                                step="any"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Batch/Test cert"
                                value={line.batchNo}
                                onChange={(e) => {
                                  const updated = [...grnLines];
                                  updated[idx].batchNo = e.target.value;
                                  setGrnLines(updated);
                                }}
                                className="w-full p-1 border rounded text-xs bg-white dark:bg-dark-800"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-dark-200">
                    Inspection Remarks
                  </label>
                  <Input
                    placeholder="e.g. Unloaded at Tower A store yard, zero transit damage"
                    value={inspectionRemarks}
                    onChange={(e) => setInspectionRemarks(e.target.value)}
                  />
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
                    Confirm Store Inward &amp; Post to Stock
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
