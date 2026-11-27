import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<any[]>([]);
  const [selectedPo, setSelectedPo] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Create PO Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30 Days Net from date of GRN");
  const [poLines, setPoLines] = useState<any[]>([
    { itemId: "", quantity: 1, unitRate: 0, discountPercent: 0, gstRate: "18" },
  ]);
  const [liveGstResult, setLiveGstResult] = useState<any | null>(null);

  useEffect(() => {
    fetchPos();
    fetchMetadata();
  }, []);

  useEffect(() => {
    // Recalculate live GST preview whenever lines or vendor change
    calculateLiveTax();
  }, [poLines, selectedVendorId]);

  const fetchPos = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/procurement/pos");
      setPos(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching purchase orders", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [vRes, sRes, iRes] = await Promise.all([
        axios.get("/masters/vendors"),
        axios.get("/masters/sites"),
        axios.get("/masters/items"),
      ]);
      setVendors(vRes.data?.data || []);
      setSites(sRes.data?.data || []);
      setItems(iRes.data?.data || []);
      if (vRes.data?.data?.length > 0) setSelectedVendorId(vRes.data.data[0].id);
      if (sRes.data?.data?.length > 0) setSelectedSiteId(sRes.data.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const viewPoDetails = async (id: number) => {
    try {
      const res = await axios.get(`/procurement/pos/${id}`);
      setSelectedPo(res.data?.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await axios.patch(`/procurement/pos/${id}/status`, { status });
      fetchPos();
      if (selectedPo && selectedPo.id === id) {
        viewPoDetails(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportTallyXml = () => {
    window.open("/api/v1/integrations/tally/purchase-vouchers-xml", "_blank");
  };

  const handleShareWhatsApp = async (poId: number) => {
    try {
      const res = await axios.post(`/procurement/pos/${poId}/share-whatsapp`);
      alert(`📲 PO successfully shared via WhatsApp to ${res.data?.data?.recipient || "vendor"}!`);
    } catch {
      alert("Failed to send WhatsApp message. Please check provider connection.");
    }
  };

  const handleRequestApprovalWhatsApp = async (poId: number) => {
    try {
      const res = await axios.post(`/procurement/pos/${poId}/request-approval-whatsapp`);
      alert(`📲 Interactive WhatsApp approval request sent to Director (${res.data?.data?.recipient})!`);
    } catch {
      alert("Failed to send WhatsApp approval request.");
    }
  };

  const calculateLiveTax = async () => {
    const validLines = poLines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      setLiveGstResult(null);
      return;
    }
    const vendor = vendors.find((v) => String(v.id) === String(selectedVendorId));
    try {
      const res = await axios.post("/procurement/calculate-gst", {
        vendorStateCode: vendor?.stateCode || "27",
        lines: validLines.map((l) => ({
          hsnCode: l.hsnCode || "999999",
          qty: Number(l.quantity),
          rate: Number(l.unitRate),
          discountPercent: Number(l.discountPercent) || 0,
          gstRate: l.gstRate === "Exempt" ? "Exempt" : Number(l.gstRate),
        })),
      });
      setLiveGstResult(res.data);
    } catch (err) {
      console.error("Live GST calculation error", err);
    }
  };

  const handleAddLine = () => {
    setPoLines([
      ...poLines,
      { itemId: "", quantity: 1, unitRate: 0, discountPercent: 0, gstRate: "18" },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setPoLines(poLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, value: any) => {
    const updated = [...poLines];
    updated[idx][field] = value;
    if (field === "itemId") {
      const it = items.find((item) => String(item.id) === String(value));
      if (it) {
        updated[idx].unitId = it.unitId;
        updated[idx].unitRate = Number(it.defaultRate) || 0;
        updated[idx].gstRate = it.gstRate;
        updated[idx].hsnCode = it.hsnCode;
      }
    }
    setPoLines(updated);
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        vendorId: Number(selectedVendorId),
        siteId: Number(selectedSiteId),
        paymentTerms,
        items: poLines.filter((l) => l.itemId).map((l) => ({
          itemId: Number(l.itemId),
          quantity: Number(l.quantity),
          unitId: Number(l.unitId),
          unitRate: Number(l.unitRate),
          discountPercent: Number(l.discountPercent) || 0,
          gstRate: l.gstRate,
          hsnCode: l.hsnCode,
        })),
      };
      const res = await axios.post("/procurement/pos", payload);
      setShowCreateModal(false);
      setPoLines([{ itemId: "", quantity: 1, unitRate: 0, discountPercent: 0, gstRate: "18" }]);
      fetchPos();
      if (res.data?.data) {
        viewPoDetails(res.data.data.id);
      }
    } catch (err) {
      console.error("Failed to create PO", err);
    }
  };

  const filteredPos = pos.filter((po) => {
    const matchSearch =
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      po.siteName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || po.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300";
      case "issued":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300";
      case "pending_approval":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-dark-700 dark:text-dark-300";
    }
  };

  return (
    <Page title="Purchase Orders">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <DocumentTextIcon className="size-6 text-[#c5a04e]" />
              Purchase Orders (PO)
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Legally binding procurement contracts with automated HSN/GST tax calculations, approvals, and printable invoices.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportTallyXml}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs py-2 shadow-sm"
            >
              <ArrowDownTrayIcon className="size-4" /> Export Tally XML
            </Button>
            <Button
              color="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-xs py-2 shadow-sm"
            >
              <PlusIcon className="size-4" /> Create Purchase Order
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              {["ALL", "pending_approval", "approved", "issued"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    filterStatus === st
                      ? "bg-[#c5a04e] text-white shadow-sm"
                      : "bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL" ? "All Orders" : st.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="w-full md:w-80">
              <Input
                placeholder="Search PO #, vendor, site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<MagnifyingGlassIcon className="size-4 text-slate-400" />}
              />
            </div>
          </div>
        </Card>

        {/* PO Table */}
        <Card className="rounded-2xl border border-slate-200 dark:border-dark-700 overflow-hidden bg-white dark:bg-dark-800">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading purchase orders...</div>
          ) : filteredPos.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No purchase orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-dark-700/60 text-slate-500 dark:text-dark-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-700">
                  <tr>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier / Vendor</th>
                    <th className="py-3 px-4">Delivery Site</th>
                    <th className="py-3 px-4">Tax Type</th>
                    <th className="py-3 px-4">Taxable</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {filteredPos.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-dark-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {po.poNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-dark-100">
                          {po.vendorName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          GSTIN: {po.vendorGstin || "URP"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-dark-300">
                        {po.siteName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            po.isInterState
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {po.isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        ₹{Number(po.taxableAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-dark-100">
                        ₹{Number(po.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${getStatusBadge(
                            po.status
                          )}`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => viewPoDetails(po.id)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold text-[11px] inline-flex items-center gap-1 shadow-sm"
                        >
                          <PrinterIcon className="size-3.5" /> View / Print
                        </button>
                        {po.status === "pending_approval" && (
                          <button
                            onClick={() => handleUpdateStatus(po.id, "approved")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        {po.status === "approved" && (
                          <button
                            onClick={() => handleUpdateStatus(po.id, "issued")}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[11px]"
                          >
                            Issue to Vendor
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Full A4 Printable Purchase Order Modal */}
        {selectedPo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full p-8 bg-white dark:bg-dark-800 rounded-2xl space-y-6 shadow-2xl border border-slate-200 dark:border-dark-700 max-h-[92vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
              {/* Actions bar (hidden in print) */}
              <div className="flex items-center justify-between border-b pb-4 dark:border-dark-700 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-lg">
                    {selectedPo.poNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusBadge(
                      selectedPo.status
                    )}`}
                  >
                    {selectedPo.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleShareWhatsApp(selectedPo.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5"
                    title="Send PO to vendor via WhatsApp"
                  >
                    <PaperAirplaneIcon className="size-4" /> Share via WhatsApp
                  </Button>
                  {selectedPo.status === "pending_approval" && (
                    <Button
                      onClick={() => handleRequestApprovalWhatsApp(selectedPo.id)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs flex items-center gap-1.5"
                      title="Send interactive approval request to Director"
                    >
                      <ChatBubbleLeftRightIcon className="size-4" /> WhatsApp Approval
                    </Button>
                  )}
                  <Button
                    onClick={() => window.print()}
                    className="bg-[#c5a04e] hover:bg-[#b58f3e] text-white text-xs flex items-center gap-1.5"
                  >
                    <PrinterIcon className="size-4" /> Print PO (A4)
                  </Button>
                  <button
                    onClick={() => setSelectedPo(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Printable Document Sheet */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-800 font-sans space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="size-8 text-[#c5a04e] fill-current">
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                      </svg>
                      <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase">
                          KINGS BUILDERS &amp; DEVELOPERS
                        </h1>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Premier Luxury &amp; Infrastructure Projects
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2 max-w-sm">
                      Plot 42, Lokhandwala Complex, Andheri West, Mumbai, Maharashtra 400053
                    </p>
                    <p className="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
                      GSTIN: 27AABCK9999F1Z1 | PAN: AABCK9999F
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold text-xs uppercase tracking-wider">
                      PURCHASE ORDER
                    </span>
                    <p className="font-mono font-bold text-sm text-slate-900 mt-1">
                      {selectedPo.poNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      Date: {new Date(selectedPo.poDate).toLocaleDateString("en-IN")}
                    </p>
                    <p className="text-xs text-slate-500">
                      Tax Class: {selectedPo.isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}
                    </p>
                  </div>
                </div>

                {/* Vendor and Ship-To Details */}
                <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      SUPPLIER / VENDOR
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                      {selectedPo.vendorName}
                    </h3>
                    <p className="text-slate-600 mt-0.5">{selectedPo.vendorAddress || "Mumbai, India"}</p>
                    <p className="font-mono mt-1">GSTIN: {selectedPo.vendorGstin || "URP"}</p>
                    <p className="font-mono">State: {selectedPo.vendorStateCode || "27"}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      DELIVER TO / SITE ADDRESS
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                      {selectedPo.siteName}
                    </h3>
                    <p className="text-slate-600 mt-0.5">{selectedPo.siteAddress}</p>
                    <p className="text-slate-600">
                      {selectedPo.siteCity} - {selectedPo.sitePincode}
                    </p>
                    <p className="font-medium text-amber-700 mt-1">
                      Payment Terms: {selectedPo.paymentTerms}
                    </p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto border rounded-xl border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                      <tr>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2">Item Description</th>
                        <th className="p-2 text-center">HSN</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Rate (₹)</th>
                        <th className="p-2 text-right">Taxable (₹)</th>
                        <th className="p-2 text-center">GST %</th>
                        <th className="p-2 text-right">Tax (₹)</th>
                        <th className="p-2 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPo.items?.map((it: any, i: number) => {
                        const tax = selectedPo.isInterState
                          ? Number(it.igstAmount)
                          : Number(it.cgstAmount) + Number(it.sgstAmount);
                        return (
                          <tr key={it.id}>
                            <td className="p-2 text-center text-slate-400">{i + 1}</td>
                            <td className="p-2 font-medium">
                              {it.itemName}
                              <span className="block font-mono text-[10px] text-slate-400">
                                {it.itemCode}
                              </span>
                            </td>
                            <td className="p-2 text-center font-mono text-slate-500">
                              {it.hsnCode}
                            </td>
                            <td className="p-2 text-right font-bold">
                              {Number(it.quantity).toFixed(0)} {it.unitCode}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {Number(it.unitRate).toFixed(2)}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {Number(it.taxableAmount).toFixed(2)}
                            </td>
                            <td className="p-2 text-center font-semibold text-amber-700">
                              {it.gstRate}%
                            </td>
                            <td className="p-2 text-right font-mono text-slate-600">
                              {tax.toFixed(2)}
                            </td>
                            <td className="p-2 text-right font-mono font-bold">
                              {Number(it.totalAmount).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Tax & Total Summary */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 border-t pt-4">
                  <div className="space-y-2 text-xs flex-1">
                    <p className="font-semibold text-slate-700">Amount in Words:</p>
                    <p className="italic bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-amber-900 font-medium">
                      {selectedPo.amountInWords}
                    </p>

                    <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700">Terms &amp; Conditions:</p>
                      <p className="whitespace-pre-line">{selectedPo.termsAndConditions}</p>
                    </div>
                  </div>

                  <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Taxable Amount:</span>
                      <span className="font-mono font-semibold">
                        ₹{Number(selectedPo.taxableAmount).toFixed(2)}
                      </span>
                    </div>

                    {!selectedPo.isInterState ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">CGST Amount:</span>
                          <span className="font-mono font-semibold">
                            ₹{Number(selectedPo.cgstAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">SGST Amount:</span>
                          <span className="font-mono font-semibold">
                            ₹{Number(selectedPo.sgstAmount).toFixed(2)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-slate-600">IGST (Inter-State):</span>
                        <span className="font-mono font-semibold">
                          ₹{Number(selectedPo.igstAmount).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-600">Round Off:</span>
                      <span className="font-mono">₹{Number(selectedPo.roundOff).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between border-t border-slate-300 pt-2 font-bold text-sm text-slate-900">
                      <span>Grand Total:</span>
                      <span className="font-mono text-base text-[#c5a04e]">
                        ₹{Number(selectedPo.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signatory Box */}
                <div className="border-t pt-8 flex justify-between text-xs text-slate-500">
                  <div>
                    <p className="font-semibold text-slate-700">Prepared By:</p>
                    <p className="mt-6 font-medium text-slate-800">
                      {selectedPo.createdByName || "Purchase Manager"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-700">For KINGS BUILDERS &amp; DEVELOPERS</p>
                    <div className="h-10"></div>
                    <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block">
                      Authorized Signatory
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Create Purchase Order Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-3xl w-full p-6 bg-white dark:bg-dark-800 rounded-2xl space-y-4 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b pb-3 dark:border-dark-700">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                    <DocumentTextIcon className="size-5 text-[#c5a04e]" />
                    Create Purchase Order
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live calculation of Indian GST taxes (Intra-state vs Inter-state) and round-off.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreatePo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Supplier / Vendor
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-dark-700 border-slate-200 dark:border-dark-600"
                      required
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.stateCode === "27" ? "Maharashtra - Intra" : `State ${v.stateCode} - Inter`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-dark-200">
                      Delivery Site
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
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-dark-200">
                    Payment Terms
                  </label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    required
                  />
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-dark-200">
                      Order Items
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <PlusIcon className="size-3" /> Add Item Line
                    </button>
                  </div>

                  {poLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-dark-700 p-2.5 rounded-lg text-xs"
                    >
                      <div className="col-span-5">
                        <select
                          value={line.itemId}
                          onChange={(e) => handleLineChange(idx, "itemId", e.target.value)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-600 text-xs"
                          required
                        >
                          <option value="">Select Item / Material...</option>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name} ({it.code}) - {it.gstRate}%
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, "quantity", e.target.value)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-600 text-xs"
                          min="0.1"
                          step="any"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Rate (₹)"
                          value={line.unitRate}
                          onChange={(e) => handleLineChange(idx, "unitRate", e.target.value)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-600 text-xs"
                          min="0"
                          step="any"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <span className="font-mono font-semibold text-slate-800 dark:text-dark-200">
                          ₹{(Number(line.quantity) * Number(line.unitRate)).toFixed(2)}
                        </span>
                      </div>

                      <div className="col-span-1 text-right">
                        {poLines.length > 1 && (
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

                {/* Live Tax Preview Banner */}
                {liveGstResult && (
                  <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-xs space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span>Taxable Amount:</span>
                      <span className="font-mono font-bold">
                        ₹{liveGstResult.taxableTotal.toFixed(2)}
                      </span>
                    </div>
                    {liveGstResult.igstTotal > 0 ? (
                      <div className="flex justify-between text-purple-700 dark:text-purple-300">
                        <span>IGST (Inter-State):</span>
                        <span className="font-mono font-bold">
                          ₹{liveGstResult.igstTotal.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                          <span>CGST:</span>
                          <span className="font-mono">₹{liveGstResult.cgstTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                          <span>SGST:</span>
                          <span className="font-mono">₹{liveGstResult.sgstTotal.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-dark-100 border-t border-amber-200 pt-1">
                      <span>Estimated Grand Total:</span>
                      <span className="font-mono text-[#c5a04e]">
                        ₹{liveGstResult.grandTotal.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic pt-1">
                      {liveGstResult.amountInWords}
                    </p>
                  </div>
                )}

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
                    Submit Purchase Order
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
