import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  CalculatorIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PrinterIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function RaBillsPage() {
  const [raBills, setRaBills] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Selected RA Bill for Certificate & MB View Modal
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Generate RA Bill Modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState("");
  const [activeWoDetail, setActiveWoDetail] = useState<any | null>(null);

  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().split("T")[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split("T")[0]);
  const [materialDeduction, setMaterialDeduction] = useState("0.00");
  const [otherDeductions, setOtherDeductions] = useState("0.00");
  const [remarks, setRemarks] = useState("Site measurements verified with MB Book entry");

  // Measurement lines
  const [measurements, setMeasurements] = useState<any[]>([
    {
      woItemId: "",
      locationRef: "Ground Floor Slab",
      description: "Concrete pouring",
      numberOfUnits: 1,
      length: 10,
      breadth: 4,
      depth: 0.15,
      totalQty: 6.0,
      rate: 2150,
      amount: 12900,
    },
  ]);

  useEffect(() => {
    fetchRaBills();
    fetchWorkOrders();
  }, []);

  const fetchRaBills = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/contractors-billing/ra-bills");
      setRaBills(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching RA bills:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const res = await axios.get("/contractors-billing/work-orders");
      const list = res.data?.data || [];
      setWorkOrders(list);
      if (list.length > 0) {
        setSelectedWoId(String(list[0].id));
        loadWoDetails(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadWoDetails = async (id: number) => {
    try {
      const res = await axios.get(`/contractors-billing/work-orders/${id}`);
      setActiveWoDetail(res.data?.data);
      if (res.data?.data?.items?.length > 0) {
        const firstItem = res.data.data.items[0];
        setMeasurements([
          {
            woItemId: firstItem.id,
            locationRef: "Floor / Grid Reference",
            description: firstItem.description,
            numberOfUnits: 1,
            length: 10,
            breadth: 5,
            depth: 0.2,
            totalQty: 10.0,
            rate: Number(firstItem.rate),
            amount: 10.0 * Number(firstItem.rate),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedWoId(String(id));
    loadWoDetails(id);
  };

  const openCertificateModal = async (id: number) => {
    try {
      const res = await axios.get(`/contractors-billing/ra-bills/${id}`);
      setSelectedBill(res.data?.data);
      setShowCertificateModal(true);
    } catch (err) {
      console.error("Error loading RA bill details:", err);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await axios.patch(`/contractors-billing/ra-bills/${id}/status`, { status });
      fetchRaBills();
      if (selectedBill && selectedBill.id === id) {
        openCertificateModal(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Measurement formula calculation
  const updateMeasurementLine = (idx: number, field: string, val: any) => {
    const updated = [...measurements];
    const row = { ...updated[idx], [field]: val };

    if (field === "woItemId") {
      const boqItem = (activeWoDetail?.items || []).find((b: any) => String(b.id) === String(val));
      if (boqItem) {
        row.description = boqItem.description;
        row.rate = Number(boqItem.rate);
      }
    }

    // Recalculate Qty = No. * L * B * D (if specified) or just units
    const nos = Number(row.numberOfUnits) || 1;
    const l = Number(row.length) || 1;
    const b = Number(row.breadth) || 1;
    const d = Number(row.depth) || 1;

    let computedQty = nos;
    if (row.length || row.breadth || row.depth) {
      computedQty = nos * l * b * d;
    }
    if (field === "totalQty") {
      computedQty = Number(val) || 0;
    } else {
      row.totalQty = Math.round(computedQty * 1000) / 1000;
    }

    const rate = Number(row.rate) || 0;
    row.amount = Math.round(row.totalQty * rate * 100) / 100;

    updated[idx] = row;
    setMeasurements(updated);
  };

  const addMeasurementRow = () => {
    const defaultItem = activeWoDetail?.items?.[0];
    setMeasurements([
      ...measurements,
      {
        woItemId: defaultItem?.id || "",
        locationRef: "Site Location",
        description: defaultItem?.description || "",
        numberOfUnits: 1,
        length: 1,
        breadth: 1,
        depth: 1,
        totalQty: 1,
        rate: defaultItem ? Number(defaultItem.rate) : 0,
        amount: defaultItem ? Number(defaultItem.rate) : 0,
      },
    ]);
  };

  const removeMeasurementRow = (idx: number) => {
    if (measurements.length <= 1) return;
    setMeasurements(measurements.filter((_, i) => i !== idx));
  };

  // Gross, Retention, TDS, Net Calculations
  const calcGross = measurements.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  const retPercent = activeWoDetail ? Number(activeWoDetail.retentionPercent) || 5 : 5;
  const tdsPercent = activeWoDetail ? Number(activeWoDetail.tdsPercent) || 1 : 1;
  const calcRetention = (calcGross * retPercent) / 100;
  const calcTds = (calcGross * tdsPercent) / 100;
  const matRec = Number(materialDeduction) || 0;
  const othRec = Number(otherDeductions) || 0;
  const calcNet = calcGross - calcRetention - calcTds - matRec - othRec;

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId) {
      alert("Please select a Work Order.");
      return;
    }
    setGenerating(true);
    try {
      await axios.post("/contractors-billing/ra-bills", {
        woId: Number(selectedWoId),
        billDate,
        periodStart,
        periodEnd,
        materialDeduction: matRec,
        otherDeductions: othRec,
        remarks,
        measurements: measurements.map((m) => ({
          woItemId: m.woItemId ? Number(m.woItemId) : undefined,
          locationRef: m.locationRef,
          description: m.description,
          numberOfUnits: Number(m.numberOfUnits) || 1,
          length: m.length ? Number(m.length) : null,
          breadth: m.breadth ? Number(m.breadth) : null,
          depth: m.depth ? Number(m.depth) : null,
          totalQty: Number(m.totalQty) || 0,
          rate: Number(m.rate) || 0,
          amount: Number(m.amount) || 0,
        })),
      });
      setShowGenerateModal(false);
      fetchRaBills();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate RA bill.");
    } finally {
      setGenerating(false);
    }
  };

  // Filtered RA bills
  const filteredBills = raBills.filter((bill) => {
    const matchSearch =
      bill.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
      bill.woNumber?.toLowerCase().includes(search.toLowerCase()) ||
      bill.contractorName?.toLowerCase().includes(search.toLowerCase()) ||
      bill.siteName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || bill.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalGrossSum = raBills.reduce((acc, b) => acc + (Number(b.grossAmount) || 0), 0);
  const totalRetentionSum = raBills.reduce((acc, b) => acc + (Number(b.retentionAmount) || 0), 0);
  const totalTdsSum = raBills.reduce((acc, b) => acc + (Number(b.tdsAmount) || 0), 0);
  const totalNetSum = raBills.reduce((acc, b) => acc + (Number(b.netPayable) || 0), 0);

  return (
    <Page title="Running Account (RA) Bills & Measurement Books">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <CalculatorIcon className="size-6 text-[#c5a04e]" />
              Running Account (RA) Bills &amp; Measurement Book (MB)
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Verify physical measurements (No. × L × B × D), withhold 5% retention, deduct 1% TDS u/s 194C, recover developer-supplied materials, and certify contractor payment certificates.
            </p>
          </div>
          <Button
            color="primary"
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium shadow-sm transition"
          >
            <PlusIcon className="size-5" />
            Generate RA Bill
          </Button>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Certified Work</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-dark-100 mt-1">
                ₹{totalGrossSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Physical site progress</p>
            </div>
            <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <CurrencyRupeeIcon className="size-6" />
            </div>
          </Card>

          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Retention Withheld (5%)</p>
              <h3 className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                ₹{totalRetentionSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Defect liability reserve</p>
            </div>
            <div className="size-11 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
              <ShieldCheckIcon className="size-6" />
            </div>
          </Card>

          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TDS u/s 194C Deducted</p>
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                ₹{totalTdsSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">Statutory IT deposit</p>
            </div>
            <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
              <CheckBadgeIcon className="size-6" />
            </div>
          </Card>

          <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Certified Payable</p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{totalNetSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Net contractor disbursement</p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <CurrencyRupeeIcon className="size-6" />
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by RA Bill #, WO #, Contractor, or Site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border-slate-300 dark:border-dark-600"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-slate-700 dark:text-dark-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="certified">Certified</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </Card>

        {/* RA Bills Table */}
        <Card className="rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-dark-300">
              <thead className="bg-slate-50 dark:bg-dark-900 border-b border-slate-200 dark:border-dark-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">RA Bill No.</th>
                  <th className="py-3 px-4">Work Order Ref</th>
                  <th className="py-3 px-4">Contractor &amp; Site</th>
                  <th className="py-3 px-4 text-right">Gross Work (₹)</th>
                  <th className="py-3 px-4 text-right">Retention (5%)</th>
                  <th className="py-3 px-4 text-right">TDS (1%)</th>
                  <th className="py-3 px-4 text-right">Material Rec.</th>
                  <th className="py-3 px-4 text-right">Net Payable (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Loading Running Account bills...
                    </td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No Running Account bills found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-dark-100">{bill.billNumber}</div>
                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          RA-{String(bill.raNumber).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-dark-300">
                        {bill.woNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-dark-100">{bill.contractorName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <BuildingOfficeIcon className="size-3.5" />
                          {bill.siteName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800 dark:text-dark-200">
                        ₹{Number(bill.grossAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-purple-600">
                        -₹{Number(bill.retentionAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-amber-600">
                        -₹{Number(bill.tdsAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                        {Number(bill.materialDeduction) > 0
                          ? `-₹${Number(bill.materialDeduction).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "₹0.00"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        ₹{Number(bill.netPayable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            bill.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                              : bill.status === "approved"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                              : bill.status === "certified"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                              : "bg-slate-100 text-slate-700 dark:bg-dark-700 dark:text-dark-300"
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          onClick={() => openCertificateModal(bill.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#c5a04e]/10 hover:bg-[#c5a04e]/20 text-[#c5a04e] inline-flex items-center gap-1.5"
                        >
                          <EyeIcon className="size-3.5" />
                          Certificate &amp; MB
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* MODAL 1: A4 PRINTABLE RA BILL CERTIFICATE & MEASUREMENT SHEET */}
        {showCertificateModal && selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-dark-700 overflow-hidden">
              {/* Modal Actions Header */}
              <div className="px-6 py-3.5 border-b border-slate-200 dark:border-dark-700 flex items-center justify-between bg-slate-50 dark:bg-dark-900 print:hidden">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-800 dark:text-dark-100 text-base">
                    {selectedBill.billNumber}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 uppercase">
                    Status: {selectedBill.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedBill.status === "certified" && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedBill.id, "approved")}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Approve Bill (Director)
                    </Button>
                  )}
                  {selectedBill.status === "approved" && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedBill.id, "paid")}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Record Payment (Accounts)
                    </Button>
                  )}
                  <Button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#c5a04e] hover:bg-[#b08d3e] text-white flex items-center gap-1.5"
                  >
                    <PrinterIcon className="size-4" />
                    Print Certificate (A4)
                  </Button>
                  <button
                    onClick={() => setShowCertificateModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 ml-2"
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                </div>
              </div>

              {/* Printable A4 Certificate Body */}
              <div id="ra-certificate-sheet" className="p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-800 text-xs">
                {/* Header Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-wider">
                      KINGS BUILDERS &amp; DEVELOPERS
                    </h1>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Civil Engineers, Real Estate Developers &amp; Infrastructure Contractors
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Site Office: {selectedBill.siteName} &bull; {selectedBill.siteAddress || "Sector 12, Kharghar, Navi Mumbai"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded">
                      INTERIM PAYMENT CERTIFICATE
                    </span>
                    <div className="font-mono text-sm font-black text-slate-900 mt-2">
                      {selectedBill.billNumber}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Bill Date: <span className="font-semibold">{new Date(selectedBill.billDate).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Subcontract Details Grid */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Subcontractor</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedBill.contractorName}</p>
                    <p className="text-slate-600 text-[11px]">Contractor Code: {selectedBill.contractorCode || "N/A"}</p>
                    <p className="text-slate-600 text-[11px]">PAN: <span className="font-mono font-semibold">{selectedBill.contractorPan || "N/A"}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Work Order Reference</span>
                    <p className="font-mono font-bold text-slate-900 text-sm">{selectedBill.woNumber}</p>
                    <p className="text-slate-700 font-medium text-[11px]">{selectedBill.woTitle}</p>
                    <p className="text-slate-600 text-[11px]">
                      Bill Period: {selectedBill.periodStart ? new Date(selectedBill.periodStart).toLocaleDateString("en-IN") : "Start"} to {selectedBill.periodEnd ? new Date(selectedBill.periodEnd).toLocaleDateString("en-IN") : "Date"}
                    </p>
                  </div>
                </div>

                {/* PART A: Measurement Book (MB) Statement */}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
                    <span>Part A &mdash; Measurement Book (MB) Detailed Measurements</span>
                    <span className="text-slate-500 text-[11px] font-normal">Physical Verification on Site</span>
                  </h3>
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                        <tr>
                          <th className="py-2 px-2.5">Item Description</th>
                          <th className="py-2 px-2.5">Location / Grid</th>
                          <th className="py-2 px-2 text-center">Nos</th>
                          <th className="py-2 px-2 text-right">L (m)</th>
                          <th className="py-2 px-2 text-right">B (m)</th>
                          <th className="py-2 px-2 text-right">D (m)</th>
                          <th className="py-2 px-2 text-right font-black">Quantity</th>
                          <th className="py-2 px-2.5 text-right">Rate (₹)</th>
                          <th className="py-2 px-2.5 text-right font-black">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(selectedBill.measurements || []).map((m: any) => (
                          <tr key={m.id}>
                            <td className="py-2 px-2.5 font-medium text-slate-900">
                              {m.description || "Subcontract Work"}
                            </td>
                            <td className="py-2 px-2.5 text-slate-600">
                              {m.locationRef}
                            </td>
                            <td className="py-2 px-2 text-center font-mono">
                              {Number(m.numberOfUnits)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              {m.length ? Number(m.length).toFixed(2) : "-"}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              {m.breadth ? Number(m.breadth).toFixed(2) : "-"}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              {m.depth ? Number(m.depth).toFixed(2) : "-"}
                            </td>
                            <td className="py-2 px-2 text-right font-black text-slate-900">
                              {Number(m.totalQty).toFixed(3)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono">
                              ₹{Number(m.rate).toFixed(2)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                              ₹{Number(m.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PART B: Financial Certificate & Statutory Recoveries */}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
                    Part B &mdash; Financial Certification &amp; Deductions Abstract
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                      <div className="font-bold text-slate-800">Certification Remarks:</div>
                      <p className="text-slate-600 leading-relaxed italic">
                        &ldquo;{selectedBill.remarks || "Measurements certified by Site Engineer from site Measurement Book. Work verified conforming to IS specifications."}&rdquo;
                      </p>
                      <div className="pt-2 text-[11px] text-slate-500">
                        Certified By: <span className="font-semibold text-slate-700">{selectedBill.certifiedByName || "Site Engineer"}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 border border-slate-300 rounded p-3 bg-slate-50/50">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="font-semibold text-slate-700">Gross Value of Work Done:</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(selectedBill.grossAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between py-0.5 text-purple-700">
                        <span>Less: Security Retention (5.00%):</span>
                        <span className="font-semibold">
                          -₹{Number(selectedBill.retentionAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between py-0.5 text-amber-700">
                        <span>Less: TDS u/s 194C (1.00%):</span>
                        <span className="font-semibold">
                          -₹{Number(selectedBill.tdsAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {Number(selectedBill.materialDeduction) > 0 && (
                        <div className="flex justify-between py-0.5 text-rose-700">
                          <span>Less: Material Recovery (Developer Supplied):</span>
                          <span className="font-semibold">
                            -₹{Number(selectedBill.materialDeduction).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {Number(selectedBill.otherDeductions) > 0 && (
                        <div className="flex justify-between py-0.5 text-rose-700">
                          <span>Less: Other Deductions / Penalties:</span>
                          <span className="font-semibold">
                            -₹{Number(selectedBill.otherDeductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                        <span>NET PAYABLE AMOUNT:</span>
                        <span className="text-emerald-700 text-base">
                          ₹{Number(selectedBill.netPayable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="pt-2 text-[11px] text-slate-600 italic">
                        Amount in words: <span className="font-semibold text-slate-800">{selectedBill.amountInWords}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Signatures & Approval Block */}
                <div className="pt-8 grid grid-cols-4 gap-4 text-center text-xs">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Prepared By</p>
                    <p className="text-[11px] text-slate-500">Site Engineer</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Checked &amp; Certified</p>
                    <p className="text-[11px] text-slate-500">Project Manager / QS</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Subcontractor Acceptance</p>
                    <p className="text-[11px] text-slate-500">Authorized Signatory</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-800">Passed For Payment</p>
                    <p className="text-[11px] text-slate-500">Managing Director</p>
                  </div>
                </div>
              </div>

              {/* Close Button Footer */}
              <div className="px-6 py-3.5 border-t border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 flex justify-end print:hidden">
                <Button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-5 py-2 text-sm rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-dark-700 text-slate-800 dark:text-dark-200 font-medium"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: GENERATE NEW RA BILL */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-dark-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-700 flex items-center justify-between bg-slate-50 dark:bg-dark-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-[#c5a04e]">
                    <PlusIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-dark-100 text-lg">
                      Generate Running Account (RA) Bill
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enter physical measurements (No. × L × B × D) with automatic 5% retention, 1% TDS and material recoveries.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <form onSubmit={handleGenerateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
                {/* Work Order & Period Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Subcontract Work Order <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedWoId}
                      onChange={handleWoChange}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-slate-800 dark:text-dark-100 font-medium"
                    >
                      {workOrders.map((wo) => (
                        <option key={wo.id} value={String(wo.id)}>
                          {wo.woNumber} &mdash; {wo.contractorName} ({wo.title})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Bill Date
                    </label>
                    <Input
                      type="date"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      className="w-full text-sm rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Period From
                    </label>
                    <Input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full text-sm rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-dark-300 mb-1.5">
                      Period To
                    </label>
                    <Input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full text-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* Subcontract Metadata Card */}
                {activeWoDetail && (
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold uppercase">Contractor</span>
                      <p className="font-bold text-slate-900 dark:text-dark-100">{activeWoDetail.contractorName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold uppercase">Project Site</span>
                      <p className="font-bold text-slate-900 dark:text-dark-100">{activeWoDetail.siteName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold uppercase">Retention Rate</span>
                      <p className="font-bold text-purple-600">{Number(activeWoDetail.retentionPercent)}% of Gross</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold uppercase">TDS Rate</span>
                      <p className="font-bold text-emerald-600">{Number(activeWoDetail.tdsPercent)}% u/s 194C</p>
                    </div>
                  </div>
                )}

                {/* Measurement Book Lines */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-900 dark:text-dark-100 flex items-center gap-1.5">
                      <CalculatorIcon className="size-4 text-[#c5a04e]" />
                      Measurement Book (MB) Entries &mdash; Dimensions Formula
                    </label>
                    <button
                      type="button"
                      onClick={addMeasurementRow}
                      className="text-xs font-semibold text-[#c5a04e] hover:underline flex items-center gap-1"
                    >
                      <PlusIcon className="size-3.5" />
                      Add Measurement Line
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-dark-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-dark-700">
                        <tr>
                          <th className="py-2.5 px-3 w-48">BOQ Item</th>
                          <th className="py-2.5 px-3">Location / Grid Ref</th>
                          <th className="py-2.5 px-2 w-16 text-center">Nos</th>
                          <th className="py-2.5 px-2 w-16 text-right">L</th>
                          <th className="py-2.5 px-2 w-16 text-right">B</th>
                          <th className="py-2.5 px-2 w-16 text-right">D</th>
                          <th className="py-2.5 px-2 w-20 text-right font-bold">Qty</th>
                          <th className="py-2.5 px-2 w-24 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-3 w-28 text-right font-bold">Amount (₹)</th>
                          <th className="py-2.5 px-2 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-dark-700">
                        {measurements.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50">
                            <td className="p-2">
                              <select
                                value={m.woItemId}
                                onChange={(e) => updateMeasurementLine(idx, "woItemId", e.target.value)}
                                className="w-full py-1 px-1.5 text-xs rounded border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800"
                              >
                                {(activeWoDetail?.items || []).map((bi: any) => (
                                  <option key={bi.id} value={String(bi.id)}>
                                    {bi.itemCode} - {bi.description?.slice(0, 25)}...
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <Input
                                type="text"
                                placeholder="e.g. Ground Floor Slab"
                                value={m.locationRef}
                                onChange={(e) => updateMeasurementLine(idx, "locationRef", e.target.value)}
                                className="w-full text-xs py-1 px-2"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="1"
                                value={m.numberOfUnits}
                                onChange={(e) => updateMeasurementLine(idx, "numberOfUnits", e.target.value)}
                                className="w-full text-xs text-center py-1 px-1"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={m.length}
                                onChange={(e) => updateMeasurementLine(idx, "length", e.target.value)}
                                className="w-full text-xs text-right py-1 px-1"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={m.breadth}
                                onChange={(e) => updateMeasurementLine(idx, "breadth", e.target.value)}
                                className="w-full text-xs text-right py-1 px-1"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={m.depth}
                                onChange={(e) => updateMeasurementLine(idx, "depth", e.target.value)}
                                className="w-full text-xs text-right py-1 px-1"
                              />
                            </td>
                            <td className="p-2 text-right font-black text-slate-800 dark:text-dark-100">
                              {Number(m.totalQty).toFixed(3)}
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={m.rate}
                                onChange={(e) => updateMeasurementLine(idx, "rate", e.target.value)}
                                className="w-full text-xs text-right py-1 px-1"
                              />
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900 dark:text-dark-100">
                              ₹{Number(m.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeMeasurementRow(idx)}
                                disabled={measurements.length <= 1}
                                className="text-slate-400 hover:text-rose-500 disabled:opacity-30"
                              >
                                <XMarkIcon className="size-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Deductions & Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-dark-750 border border-slate-200 dark:border-dark-700">
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-dark-100 text-xs uppercase tracking-wider">
                      Adjustments &amp; Material Recoveries
                    </h4>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Developer Supplied Material Recovery (₹)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={materialDeduction}
                        onChange={(e) => setMaterialDeduction(e.target.value)}
                        placeholder="Cost of steel/cement supplied"
                        className="w-full text-sm rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Other Deductions / Water &amp; Electricity / Penalties (₹)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={otherDeductions}
                        onChange={(e) => setOtherDeductions(e.target.value)}
                        placeholder="Other deductions"
                        className="w-full text-sm rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Engineer Remarks / Certification Notes
                      </label>
                      <Input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full text-sm rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Live Calculation Preview */}
                  <div className="space-y-2 border-l border-slate-200 dark:border-dark-700 md:pl-6">
                    <h4 className="font-bold text-slate-900 dark:text-dark-100 text-xs uppercase tracking-wider mb-2">
                      Live Billing Abstract
                    </h4>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-500">Gross Measured Value:</span>
                      <span className="font-bold text-slate-900 dark:text-dark-100">
                        ₹{calcGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs py-1 text-purple-600">
                      <span>Less: Security Retention ({retPercent}%):</span>
                      <span className="font-semibold">
                        -₹{calcRetention.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs py-1 text-amber-600">
                      <span>Less: TDS u/s 194C ({tdsPercent}%):</span>
                      <span className="font-semibold">
                        -₹{calcTds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {matRec > 0 && (
                      <div className="flex justify-between text-xs py-1 text-rose-600">
                        <span>Less: Material Recovery:</span>
                        <span className="font-semibold">
                          -₹{matRec.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {othRec > 0 && (
                      <div className="flex justify-between text-xs py-1 text-rose-600">
                        <span>Less: Other Deductions:</span>
                        <span className="font-semibold">
                          -₹{othRec.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-300 dark:border-dark-600 text-sm font-black">
                      <span className="text-slate-900 dark:text-dark-100">Net Payable Amount:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-base">
                        ₹{calcNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-700">
                  <Button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-dark-200 font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={generating}
                    className="px-5 py-2 text-sm rounded-xl bg-[#c5a04e] hover:bg-[#b08d3e] text-white font-medium shadow-sm transition"
                  >
                    {generating ? "Generating..." : "Generate & Certify RA Bill"}
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
