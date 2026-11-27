import { useState, useEffect, useMemo } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button } from "@/components/ui";
import axios from "@/utils/axios";
import {
  DocumentChartBarIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  CurrencyRupeeIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  ViewColumnsIcon,
  InboxArrowDownIcon,
  DocumentTextIcon,
  CircleStackIcon,
  ChartBarIcon,
  TruckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

type ReportType =
  | "po-register"
  | "grn-register"
  | "stock-summary"
  | "stock-ledger"
  | "item-movement"
  | "site-consumption"
  | "vendor-purchase"
  | "gst-input"
  | "stock-ageing"
  | "tds-register"
  | "retention-ledger";

interface ColumnDef {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: (val: any, row: any) => React.ReactNode;
  exportFormat?: (val: any, row: any) => string;
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("po-register");
  const [data, setData] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filters & Controls
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Column Visibility Toggle State
  const [showColToggle, setShowColToggle] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchReportData(activeReport);
  }, [activeReport]);

  const fetchReportData = async (type: ReportType) => {
    setLoading(true);
    setSearchQuery("");
    setSortColumn("");
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let endpoint = `/dashboard/reports/${type}`;
      if (type === "gst-input") endpoint = "/dashboard/reports/gst-input-summary";
      if (type === "stock-ageing") endpoint = "/dashboard/reports/stock-ageing";

      const res = await axios.get(endpoint, { params });
      const resData = res.data?.data;

      if (Array.isArray(resData)) {
        setData(resData);
        setMetadata(null);
      } else if (resData?.rows && Array.isArray(resData.rows)) {
        setData(resData.rows);
        setMetadata(resData);
      } else if (resData?.brackets && Array.isArray(resData.brackets)) {
        setData(resData.brackets);
        setMetadata(resData);
      } else {
        setData([]);
        setMetadata(null);
      }
    } catch (err) {
      console.error(`Error loading report ${type}:`, err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Define Columns per Report
  const columns: ColumnDef[] = useMemo(() => {
    switch (activeReport) {
      case "po-register":
        return [
          { key: "poNumber", label: "PO Number", align: "left" },
          { key: "orderDate", label: "Date", align: "left", format: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "-" },
          { key: "vendorName", label: "Vendor / Supplier", align: "left" },
          { key: "siteName", label: "Delivery Site", align: "left" },
          { key: "taxableAmount", label: "Taxable (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "cgstAmount", label: "CGST (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "sgstAmount", label: "SGST (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "igstAmount", label: "IGST (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "totalAmount", label: "Total PO Value (₹)", align: "right", format: (v) => <span className="font-bold">₹{Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span> },
          { key: "status", label: "Status", align: "center", format: (v) => <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{v}</span> },
        ];

      case "grn-register":
        return [
          { key: "grnNumber", label: "GRN Number", align: "left" },
          { key: "receiptDate", label: "Inward Date", align: "left", format: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "-" },
          { key: "poNumber", label: "PO Ref", align: "left" },
          { key: "vendorName", label: "Vendor", align: "left" },
          { key: "siteName", label: "Site / Store", align: "left" },
          { key: "challanNumber", label: "Delivery Challan", align: "left" },
          { key: "invoiceNumber", label: "Tax Invoice No", align: "left" },
          { key: "itemsCount", label: "SKU Lines", align: "center" },
          { key: "totalValue", label: "Receipt Value (₹)", align: "right", format: (v) => <span className="font-bold">₹{Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span> },
          { key: "status", label: "QC Status", align: "center", format: (v) => <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{v}</span> },
        ];

      case "stock-summary":
        return [
          { key: "itemCode", label: "Item Code", align: "left" },
          { key: "itemName", label: "Item Description", align: "left" },
          { key: "categoryName", label: "Category", align: "left" },
          { key: "warehouseName", label: "Warehouse / Yard", align: "left" },
          { key: "quantity", label: "On-Hand Qty", align: "right", format: (v, r) => `${v} ${r.unitCode || ""}` },
          { key: "weightedAvgRate", label: "Avg Cost Rate (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "totalValue", label: "Stock Valuation (₹)", align: "right", format: (v) => <span className="font-bold text-[#c5a04e]">₹{Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span> },
          { key: "reorderLevel", label: "Safety Reorder", align: "right" },
        ];

      case "stock-ledger":
        return [
          { key: "documentDate", label: "Date", align: "left", format: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "-" },
          { key: "movementType", label: "Type", align: "center", format: (v) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${v === "INWARD_GRN" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"}`}>{v}</span> },
          { key: "documentNumber", label: "Doc Number", align: "left" },
          { key: "itemCode", label: "Item Code", align: "left" },
          { key: "itemName", label: "Material Name", align: "left" },
          { key: "inQuantity", label: "In Qty", align: "right", format: (v) => v ? Number(v).toFixed(2) : "-" },
          { key: "outQuantity", label: "Out Qty", align: "right", format: (v) => v ? Number(v).toFixed(2) : "-" },
          { key: "balanceQuantity", label: "Bal Qty", align: "right", format: (v, r) => <span className="font-bold">{Number(v || 0).toFixed(2)} {r.unitCode}</span> },
          { key: "unitCost", label: "Rate (₹)", align: "right", format: (v) => `₹${Number(v || 0).toFixed(2)}` },
          { key: "totalCost", label: "Value (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
        ];

      case "item-movement":
        return [
          { key: "itemCode", label: "Item Code", align: "left" },
          { key: "itemName", label: "Item Name", align: "left" },
          { key: "categoryName", label: "Category", align: "left" },
          { key: "totalReceived", label: "Total Received", align: "right", format: (v, r) => `${v} ${r.unitCode}` },
          { key: "totalIssued", label: "Total Issued", align: "right", format: (v, r) => `${v} ${r.unitCode}` },
          { key: "currentBalance", label: "Current Balance", align: "right", format: (v, r) => <span className="font-bold">{v} {r.unitCode}</span> },
          { key: "valuation", label: "Valuation (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "velocity", label: "Movement Velocity", align: "center", format: (v) => {
            const cls = v === "FAST" ? "bg-emerald-100 text-emerald-800" : v === "MEDIUM" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800";
            return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{v || "FAST"}</span>;
          }},
        ];

      case "site-consumption":
        return [
          { key: "issueNumber", label: "Issue No", align: "left" },
          { key: "issueDate", label: "Issue Date", align: "left", format: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "-" },
          { key: "siteName", label: "Project Site", align: "left" },
          { key: "contractorName", label: "Contractor", align: "left" },
          { key: "woNumber", label: "Work Order Ref", align: "left" },
          { key: "itemCode", label: "Code", align: "left" },
          { key: "itemName", label: "Material Issued", align: "left" },
          { key: "quantity", label: "Qty Issued", align: "right", format: (v, r) => `${v} ${r.unitCode}` },
          { key: "unitCost", label: "Unit Rate (₹)", align: "right", format: (v) => `₹${Number(v || 0).toFixed(2)}` },
          { key: "totalCost", label: "Total Cost (₹)", align: "right", format: (v) => <span className="font-bold text-amber-600">₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span> },
        ];

      case "vendor-purchase":
        return [
          { key: "vendorCode", label: "Vendor Code", align: "left" },
          { key: "vendorName", label: "Vendor Name", align: "left" },
          { key: "gstin", label: "GSTIN", align: "left" },
          { key: "stateCode", label: "State Code", align: "center" },
          { key: "poCount", label: "Total POs", align: "center" },
          { key: "taxableValue", label: "Taxable Value (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "cgst", label: "CGST (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "sgst", label: "SGST (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "igst", label: "IGST (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "totalSpend", label: "Total Spend (₹)", align: "right", format: (v) => <span className="font-bold text-[#c5a04e]">₹{Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span> },
        ];

      case "gst-input":
        return [
          { key: "gstRate", label: "GST Rate (%)", align: "left", format: (v) => <span className="font-bold">{v}%</span> },
          { key: "taxableValue", label: "Taxable Value (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "cgst", label: "CGST (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "sgst", label: "SGST (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "igst", label: "IGST (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "totalTax", label: "Total Input Tax Credit (₹)", align: "right", format: (v) => <span className="font-bold text-emerald-600">₹{Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span> },
        ];

      case "stock-ageing":
        return [
          { key: "itemCode", label: "Item Code", align: "left" },
          { key: "itemName", label: "Item Description", align: "left" },
          { key: "totalQuantity", label: "Total Stock", align: "right", format: (v, r) => `${v} ${r.unitCode}` },
          { key: "valuation", label: "Valuation (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "bucket0to30", label: "0-30 Days", align: "right" },
          { key: "bucket31to60", label: "31-60 Days", align: "right" },
          { key: "bucket61to90", label: "61-90 Days", align: "right" },
          { key: "bucket90Plus", label: "> 90 Days (Slow)", align: "right", format: (v) => Number(v) > 0 ? <span className="text-rose-600 font-bold">{v}</span> : v },
          { key: "status", label: "Health", align: "center", format: (v) => <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{v || "FRESH"}</span> },
        ];

      case "tds-register":
        return [
          { key: "billNumber", label: "RA Bill No", align: "left" },
          { key: "billDate", label: "Bill Date", align: "left", format: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "-" },
          { key: "contractorName", label: "Contractor Name", align: "left" },
          { key: "pan", label: "PAN", align: "left", format: (v) => <span className="font-mono">{v}</span> },
          { key: "siteName", label: "Project Site", align: "left" },
          { key: "grossAmount", label: "Gross Billed (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "tdsRate", label: "TDS %", align: "center", format: (v) => `${v}%` },
          { key: "tdsAmount", label: "TDS Deducted (₹)", align: "right", format: (v) => <span className="font-bold text-amber-600">₹{Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span> },
          { key: "netPayable", label: "Net Payable (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
        ];

      case "retention-ledger":
        return [
          { key: "billNumber", label: "RA Bill No", align: "left" },
          { key: "contractorName", label: "Contractor", align: "left" },
          { key: "woNumber", label: "Work Order", align: "left" },
          { key: "siteName", label: "Project Site", align: "left" },
          { key: "grossAmount", label: "Gross Work (₹)", align: "right", format: (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { key: "retentionRate", label: "Held %", align: "center", format: (v) => `${v}%` },
          { key: "retentionAmount", label: "Retention Held (₹)", align: "right", format: (v) => <span className="font-bold text-purple-600">₹{Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span> },
          { key: "releaseDueDate", label: "DLP Release Date", align: "left", format: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "6 Mos Post Completion" },
          { key: "status", label: "Liability Status", align: "center", format: () => <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">HELD IN RESERVE</span> },
        ];

      default:
        return [];
    }
  }, [activeReport]);

  // Filtered & Sorted Rows
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val || "").toLowerCase().includes(q))
      );
    }

    // Sort by column
    if (sortColumn) {
      result.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        if (typeof valA === "number" || (!isNaN(Number(valA)) && !isNaN(Number(valB)))) {
          return sortDirection === "asc" ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        }

        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection]);

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  // Export to CSV / Excel
  const exportToCsv = () => {
    if (processedData.length === 0) return;
    const visibleCols = columns.filter((col) => !hiddenCols[col.key]);

    // CSV Header
    const headerRow = visibleCols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");

    // CSV Data Rows
    const dataRows = processedData.map((row) => {
      return visibleCols
        .map((c) => {
          let val = row[c.key];
          if (val === null || val === undefined) val = "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...dataRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kings_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Page title="Kings Builders - Financial & Operational Reports">
      <div className="w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <DocumentChartBarIcon className="size-6 text-[#c5a04e]" />
              Enterprise Construction Reports Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Statutory GSTITC, Section 194C TDS, Stock Ledger, Movement Velocity, and Contractor Retention Ledgers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.open("/api/v1/integrations/tally/purchase-vouchers-xml", "_blank")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
            >
              <ArrowDownTrayIcon className="size-4" />
              Tally XML
            </Button>
            <Button
              color="primary"
              onClick={exportToCsv}
              className="bg-[#c5a04e] hover:bg-[#b08d3e] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition"
            >
              <ArrowDownTrayIcon className="size-4" />
              Export CSV / Excel
            </Button>
            <Button
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <PrinterIcon className="size-4" />
              Print PDF
            </Button>
          </div>
        </div>

        {/* 11 Reports Navigation Tabs Bar */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-2 border border-slate-200 dark:border-dark-700 shadow-xs overflow-x-auto print:hidden">
          <div className="flex items-center space-x-1 min-w-max">
            {[
              { id: "po-register", label: "PO Register", icon: DocumentTextIcon },
              { id: "grn-register", label: "GRN Register", icon: InboxArrowDownIcon },
              { id: "stock-summary", label: "Stock Summary", icon: CircleStackIcon },
              { id: "stock-ledger", label: "Stock Ledger", icon: ChartBarIcon },
              { id: "item-movement", label: "Item Velocity", icon: ArrowPathIcon },
              { id: "site-consumption", label: "Site Consumption", icon: BuildingOfficeIcon },
              { id: "vendor-purchase", label: "Vendor Spend", icon: TruckIcon },
              { id: "gst-input", label: "GST Input (ITC)", icon: CurrencyRupeeIcon },
              { id: "stock-ageing", label: "Stock Ageing", icon: CalendarDaysIcon },
              { id: "tds-register", label: "Section 194C TDS", icon: CheckBadgeIcon },
              { id: "retention-ledger", label: "Retention Liability", icon: ShieldCheckIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeReport === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveReport(tab.id as ReportType)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? "bg-[#c5a04e] text-white shadow-sm shadow-amber-500/30"
                      : "text-slate-600 dark:text-dark-300 hover:bg-slate-100 dark:hover:bg-dark-700"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Toolbar: Date Range, Search, Column Toggle, Apply */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-xs print:hidden space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search filter */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="size-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Quick search across records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 focus:outline-hidden focus:border-[#c5a04e]"
              />
            </div>

            {/* Date range filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900"
              />
              <span className="text-xs font-semibold text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900"
              />
              <Button
                color="primary"
                onClick={() => fetchReportData(activeReport)}
                className="bg-[#c5a04e] hover:bg-[#b08d3e] text-white px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                Apply
              </Button>
            </div>

            {/* Column Visibility Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setShowColToggle(!showColToggle)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-700 text-xs font-semibold text-slate-700 dark:text-dark-200 hover:bg-slate-50 dark:hover:bg-dark-750"
              >
                <ViewColumnsIcon className="size-4 text-slate-400" />
                Columns ({columns.filter((c) => !hiddenCols[c.key]).length}/{columns.length})
              </button>

              {showColToggle && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-xl p-3 z-30 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Toggle Columns
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {columns.map((col) => (
                      <label key={col.key} className="flex items-center gap-2 text-xs text-slate-700 dark:text-dark-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!hiddenCols[col.key]}
                          onChange={(e) =>
                            setHiddenCols({ ...hiddenCols, [col.key]: !e.target.checked })
                          }
                          className="rounded text-[#c5a04e] focus:ring-[#c5a04e]"
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => setHiddenCols({})}
                    className="w-full text-center text-[11px] text-[#c5a04e] hover:underline pt-1 border-t border-slate-100 dark:border-dark-700"
                  >
                    Reset All Visible
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Optional Metadata Banner for TDS / Retention / GST */}
        {metadata && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metadata.totalGrossAmount && (
              <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
                <span className="text-[11px] uppercase font-bold text-slate-400">Total Gross Certified</span>
                <div className="text-xl font-black text-slate-900 dark:text-dark-100 mt-1">
                  ₹{Number(metadata.totalGrossAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </Card>
            )}
            {metadata.totalTdsDeducted && (
              <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
                <span className="text-[11px] uppercase font-bold text-amber-600">Total Section 194C TDS</span>
                <div className="text-xl font-black text-amber-600 mt-1">
                  ₹{Number(metadata.totalTdsDeducted).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </Card>
            )}
            {metadata.totalRetentionHeld && (
              <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
                <span className="text-[11px] uppercase font-bold text-purple-600">Total Retention Held (5%)</span>
                <div className="text-xl font-black text-purple-600 mt-1">
                  ₹{Number(metadata.totalRetentionHeld).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Report Data Table */}
        <Card className="rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-dark-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-dark-700">
                <tr>
                  {columns
                    .filter((c) => !hiddenCols[c.key])
                    .map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`py-3 px-3 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-dark-800 transition ${
                          col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                        }`}
                      >
                        <div className={`inline-flex items-center gap-1 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
                          <span>{col.label}</span>
                          <ArrowsUpDownIcon className={`size-3 text-slate-400 ${sortColumn === col.key ? "text-[#c5a04e] font-bold" : ""}`} />
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-700">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <ArrowPathIcon className="size-4 animate-spin text-[#c5a04e]" />
                        Loading report data...
                      </div>
                    </td>
                  </tr>
                ) : processedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center text-slate-400 text-xs">
                      No matching records found for this period.
                    </td>
                  </tr>
                ) : (
                  processedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50 transition">
                      {columns
                        .filter((c) => !hiddenCols[c.key])
                        .map((col) => (
                          <td
                            key={col.key}
                            className={`py-2.5 px-3 ${
                              col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                            }`}
                          >
                            {col.format ? col.format(row[col.key], row) : (row[col.key] ?? "-")}
                          </td>
                        ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-dark-900 border-t border-slate-200 dark:border-dark-700 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {processedData.length} records</span>
            <span className="font-mono text-[11px]">FY 2026-27 &bull; Kings Builders &amp; Developers</span>
          </div>
        </Card>
      </div>
    </Page>
  );
}
