import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { useAuthContext } from "@/app/contexts/auth/context";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  CurrencyRupeeIcon,
  PlusIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { FormModal, FormSelect, FormInput, FormActions } from "../_shared/FormModal";

interface CostSheetItem {
  id: number;
  uuid: string;
  siteId: number;
  leadId?: number | null;
  leadName?: string | null;
  leadMobile?: string | null;
  unitId: number;
  unitNo: string;
  schemeId?: number | null;
  schemeName?: string | null;
  rate: string;
  discountPct: string;
  totals: any;
  lines?: any;
  validTill?: string | null;
  status: "draft" | "pending_approval" | "approved" | "rejected" | "shared";
  approvedBy?: number | null;
  approvalRemarks?: string | null;
  createdAt: string;
}

interface UnitOption {
  id: number;
  unitNo: string;
  carpetArea: string;
  baseRate: string;
  status: string;
}

interface SchemeOption {
  id: number;
  name: string;
  gstMode: string;
  maxDiscountPct?: string | null;
}

interface ParkingOption {
  id: number;
  slotNo: string;
  price: string;
  type: string;
  status: string;
}

export default function RealtyCostSheetsPage() {
  const { user } = useAuthContext();
  const roleCode = typeof user?.role === "string" 
    ? user.role.toLowerCase() 
    : (user?.role?.code || "").toLowerCase();
  const isSalesHead = ["sales_head", "super_admin", "boss", "admin"].includes(roleCode);

  const [costSheets, setCostSheets] = useState<CostSheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Approval modals
  const [approvingCs, setApprovingCs] = useState<CostSheetItem | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  const [rejectingCs, setRejectingCs] = useState<CostSheetItem | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  // Print / View Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [activeSheetDetails, setActiveSheetDetails] = useState<any>(null);

  // Options for Generator
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [schemeOptions, setSchemeOptions] = useState<SchemeOption[]>([]);
  const [parkingOptions, setParkingOptions] = useState<ParkingOption[]>([]);

  // Generator Form
  const [formUnitId, setFormUnitId] = useState<number | "">("");
  const [formSchemeId, setFormSchemeId] = useState<number | "">("");
  const [formParkingId, setFormParkingId] = useState<number | "">("");
  const [formDiscountPct, setFormDiscountPct] = useState<number>(0);
  const [formRemarks, setFormRemarks] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    fetchCostSheets();
    loadGeneratorOptions();
  }, []);

  // When form parameters change, recalculate live preview
  useEffect(() => {
    if (formUnitId) {
      calculateLivePreview();
    } else {
      setPreviewData(null);
    }
  }, [formUnitId, formSchemeId, formParkingId, formDiscountPct]);

  const fetchCostSheets = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/inventory/cost-sheets?siteId=1");
      setCostSheets(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Failed to load cost sheets", err);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratorOptions = async () => {
    try {
      const [uRes, scRes, pkRes] = await Promise.all([
        axios.get("/realty/setup/units?siteId=1"),
        axios.get("/realty/setup/schemes?siteId=1"),
        axios.get("/realty/setup/parking-slots?siteId=1"),
      ]);

      const units = uRes.data?.data || uRes.data || [];
      const schemes = scRes.data?.data || scRes.data || [];
      const parkings = pkRes.data?.data || pkRes.data || [];

      setUnitOptions(units);
      setSchemeOptions(schemes);
      setParkingOptions(parkings);

      if (schemes.length > 0) setFormSchemeId((prev) => prev || schemes[0].id);
      if (units.length > 0) setFormUnitId((prev) => prev || units[0].id);
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  const calculateLivePreview = async () => {
    if (!formUnitId) return;
    setCalculating(true);
    try {
      const res = await axios.post("/realty/inventory/cost-sheets/calculate", {
        siteId: 1,
        unitId: Number(formUnitId),
        schemeId: formSchemeId ? Number(formSchemeId) : undefined,
        parkingSlotId: formParkingId ? Number(formParkingId) : undefined,
        discountPct: Number(formDiscountPct) || 0,
      });
      setPreviewData(res.data?.data || res.data);
    } catch (err) {
      console.error("Preview calc failed", err);
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveCostSheet = async () => {
    if (!formUnitId) {
      alert("Please select a unit");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post("/realty/inventory/cost-sheets", {
        siteId: 1,
        unitId: Number(formUnitId),
        schemeId: formSchemeId ? Number(formSchemeId) : undefined,
        parkingSlotId: formParkingId ? Number(formParkingId) : undefined,
        discountPct: Number(formDiscountPct) || 0,
        remarks: formRemarks,
      });

      const data = res.data?.data || res.data;
      if (data.isApprovalRequired) {
        alert("⚠️ Cost sheet created! Requested discount exceeds scheme limit and has been submitted to the Sales Head for approval.");
      } else {
        alert("✅ Cost sheet quotation successfully generated!");
      }

      setCreateModalOpen(false);
      await fetchCostSheets();
    } catch (err: any) {
      alert(`Error saving cost sheet: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPrintModal = async (id: number) => {
    try {
      const res = await axios.get(`/realty/inventory/cost-sheets/${id}`);
      setActiveSheetDetails(res.data?.data || res.data);
      setPrintModalOpen(true);
    } catch (err: any) {
      alert(`Could not load cost sheet: ${err.message}`);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approvingCs) return;
    if (!approvalRemarks.trim()) {
      setApprovalError("Approval remarks are required.");
      return;
    }
    try {
      setApproving(true);
      setApprovalError("");
      await axios.post(`/realty/inventory/cost-sheets/${approvingCs.id}/approve`, {
        remarks: approvalRemarks.trim(),
      });
      setApprovingCs(null);
      setApprovalRemarks("");
      await fetchCostSheets();
      alert("✅ Cost sheet discount approved!");
    } catch (err: any) {
      alert(`Approval failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingCs) return;
    if (!rejectRemarks.trim()) {
      setRejectError("Rejection remarks are required.");
      return;
    }
    try {
      setRejecting(true);
      setRejectError("");
      await axios.post(`/realty/inventory/cost-sheets/${rejectingCs.id}/reject`, {
        remarks: rejectRemarks.trim(),
      });
      setRejectingCs(null);
      setRejectRemarks("");
      await fetchCostSheets();
      alert("❌ Cost sheet discount rejected.");
    } catch (err: any) {
      alert(`Rejection failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setRejecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge color="success">Approved</Badge>;
      case "pending_approval":
        return <Badge color="warning">Pending Approval</Badge>;
      case "rejected":
        return <Badge color="error">Rejected</Badge>;
      case "shared":
        return <Badge color="info">Shared</Badge>;
      default:
        return <Badge color="neutral">Draft</Badge>;
    }
  };

  const renderStatusWithTooltip = (cs: CostSheetItem) => {
    let color: "success" | "warning" | "error" | "info" | "neutral" = "neutral";
    let label: string = cs.status;
    switch (cs.status) {
      case "approved":
        color = "success";
        label = "Approved";
        break;
      case "pending_approval":
        color = "warning";
        label = "Pending Approval";
        break;
      case "rejected":
        color = "error";
        label = "Rejected";
        break;
      case "shared":
        color = "info";
        label = "Shared";
        break;
      default:
        color = "neutral";
        label = "Draft";
    }

    const hasRemark = Boolean(cs.approvalRemarks && cs.approvalRemarks.trim());

    return (
      <div className="relative inline-flex items-center group cursor-help">
        <Badge color={color} className="capitalize text-xs font-medium cursor-help transition-transform group-hover:scale-105 select-none">
          {label}
        </Badge>
        {hasRemark && (
          <span className="ml-1 text-slate-400 group-hover:text-amber-500 transition-colors">
            <ChatBubbleBottomCenterTextIcon className="size-3.5 inline" />
          </span>
        )}

        {hasRemark && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 w-64 p-3 rounded-xl bg-slate-900/95 dark:bg-dark-800 text-white border border-slate-700/80 dark:border-dark-500 shadow-2xl backdrop-blur-md text-xs pointer-events-none transition-all duration-150">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/80 dark:border-dark-600">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Sales Head Remark
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  cs.status === "approved"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
              >
                {cs.status.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-100 text-xs italic break-words leading-relaxed text-left">
              &ldquo;{cs.approvalRemarks}&rdquo;
            </p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95 dark:border-t-dark-800" />
          </div>
        )}
      </div>
    );
  };

  const filteredSheets = costSheets.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (
      searchQuery.trim() &&
      !s.unitNo.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
      !(s.leadName || "").toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
      return false;
    return true;
  });

  return (
    <Page title="Cost Sheets & Quotations">
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-100 flex items-center gap-2.5">
              <CurrencyRupeeIcon className="size-7 text-primary-600" />
              Cost Sheets &amp; Quotations
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              RERA-compliant pricing, statutory taxes, milestone payment schedules, and discount approval workflow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              color="primary"
              onClick={() => {
                if (unitOptions.length === 0) {
                  loadGeneratorOptions();
                }
                if (!formUnitId && unitOptions.length > 0) {
                  setFormUnitId(unitOptions[0].id);
                }
                setCreateModalOpen(true);
              }}
              className="text-xs"
            >
              <PlusIcon className="size-4 mr-1.5" /> Generate Cost Sheet
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <MagnifyingGlassIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by unit number or prospect name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 font-mono"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Register Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4 dark:border-dark-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
              Generated Cost Sheets Register
            </h3>
            <Badge color="primary">{filteredSheets.length} Quotations</Badge>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              <ArrowPathIcon className="size-6 animate-spin mx-auto mb-2 text-primary-600" />
              Loading cost sheets...
            </div>
          ) : filteredSheets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No cost sheets found. Click "Generate Cost Sheet" above to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-dark-750 text-slate-600 dark:text-dark-300 font-bold border-b dark:border-dark-700 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Prospect Lead</th>
                    <th className="py-2.5 px-3">Payment Scheme</th>
                    <th className="py-2.5 px-3">Agreement Value</th>
                    <th className="py-2.5 px-3">Discount</th>
                    <th className="py-2.5 px-3">Grand Total (Incl GST)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {filteredSheets.map((cs) => {
                    const totals = cs.totals || {};
                    return (
                      <tr key={cs.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50">
                        <td className="py-2.5 px-3 font-mono text-slate-400">#{cs.id}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-primary-600">{cs.unitNo}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-dark-200">
                          {cs.leadName || <span className="text-slate-400">Walk-in Client</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-dark-300">
                          {cs.schemeName || "Standard CLP"}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-dark-100">
                          ₹{(totals.netAgreementValue || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {parseFloat(cs.discountPct) > 0 ? (
                            <span className="text-amber-600 font-bold">
                              {parseFloat(cs.discountPct).toFixed(2)}% (₹{(totals.discountAmt || 0).toLocaleString("en-IN")})
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{(totals.grandTotalInclGst || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3">{renderStatusWithTooltip(cs)}</td>
                        <td className="py-2.5 px-3 text-right space-x-1.5">
                          <Button
                            variant="outlined"
                            onClick={() => handleOpenPrintModal(cs.id)}
                            className="text-[11px] py-1 px-2.5"
                          >
                            <PrinterIcon className="size-3.5 mr-1" /> View / Print
                          </Button>

                          {isSalesHead && cs.status === "pending_approval" && (
                            <>
                              <Button
                                color="success"
                                onClick={() => {
                                  setApprovingCs(cs);
                                  setApprovalRemarks("");
                                  setApprovalError("");
                                }}
                                className="text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                title="Approve Discount (Sales Head only)"
                              >
                                Approve
                              </Button>
                              <Button
                                color="error"
                                onClick={() => {
                                  setRejectingCs(cs);
                                  setRejectRemarks("");
                                  setRejectError("");
                                }}
                                className="text-[11px] py-1 px-2.5 border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Reject Discount (Sales Head only)"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODAL 1: COST SHEET GENERATOR */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {createModalOpen && (
          <FormModal
            title="Quotation & Cost Sheet Engine"
            subtitle="Live calculation powered by BuildERP statutory tax engine (5% GST, 6% Stamp Duty, capped registration, TDS 194-IA)"
            icon={<CurrencyRupeeIcon className="w-5 h-5" />}
            onClose={() => setCreateModalOpen(false)}
            maxWidth="2xl"
          >
            <div className="space-y-6">
              {/* Form Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-dark-800/60 p-4 rounded-xl border border-gray-200 dark:border-dark-600">
                <div>
                  <FormSelect
                    label="Select Unit"
                    required
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(Number(e.target.value))}
                    className="font-mono text-xs font-bold"
                  >
                    {unitOptions.length === 0 ? (
                      <option value="">No Units Available</option>
                    ) : (
                      <>
                        <option value="">-- Choose Unit ({unitOptions.length} units) --</option>
                        {unitOptions.map((u) => (
                          <option key={u.id} value={u.id}>
                            Unit {u.unitNo} ({parseFloat(u.carpetArea).toFixed(0)} sqft) - {u.status.toUpperCase()}
                          </option>
                        ))}
                      </>
                    )}
                  </FormSelect>
                </div>

                <div>
                  <FormSelect
                    label="Payment Scheme"
                    value={formSchemeId}
                    onChange={(e) => setFormSchemeId(Number(e.target.value))}
                    className="text-xs font-semibold"
                  >
                    {schemeOptions.length === 0 ? (
                      <option value="">Standard Scheme</option>
                    ) : (
                      <>
                        <option value="">-- Select Payment Scheme --</option>
                        {schemeOptions.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {sc.name}
                          </option>
                        ))}
                      </>
                    )}
                  </FormSelect>
                </div>

                <div>
                  <FormSelect
                    label="Dedicated Parking Slot"
                    value={formParkingId}
                    onChange={(e) => setFormParkingId(e.target.value ? Number(e.target.value) : "")}
                    className="font-mono text-xs"
                  >
                    <option value="">-- No Dedicated Parking (Optional) --</option>
                    {parkingOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.slotNo} ({p.type.toUpperCase()}) - ₹{parseFloat(p.price).toLocaleString("en-IN")}
                      </option>
                    ))}
                  </FormSelect>
                </div>

                <div>
                  <FormInput
                    label="Negotiated Discount (%)"
                    type="number"
                    step="0.1"
                    min="0"
                    max="15"
                    value={formDiscountPct}
                    onChange={(e) => setFormDiscountPct(Number(e.target.value))}
                    className="font-mono font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>

              {/* Warning if discount requires approval */}
              {previewData?.isApprovalRequired && (
                <div className="p-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
                  <ExclamationTriangleIcon className="size-5 shrink-0 text-amber-600" />
                  <span>
                    Requested discount <strong>{formDiscountPct}%</strong> exceeds this scheme's limit of{" "}
                    <strong>{previewData.maxAllowedDiscount}%</strong>. This cost sheet will automatically be submitted
                    for Sales Head approval.
                  </span>
                </div>
              )}

              {/* Live Preview Display */}
              {calculating ? (
                <div className="py-12 text-center text-slate-500 font-medium">
                  <ArrowPathIcon className="size-5 animate-spin mx-auto mb-2 text-primary-600" />
                  Calculating cost sheet...
                </div>
              ) : previewData ? (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-3.5 space-y-1 bg-slate-50/50">
                      <span className="text-[11px] font-semibold text-slate-500">Basic Cost</span>
                      <div className="font-mono text-base font-bold text-slate-800">
                        ₹{previewData.calculation.basicCost.toLocaleString("en-IN")}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {previewData.unit.carpetArea} sqft @ ₹{previewData.calculation.baseRate.toLocaleString("en-IN")}
                      </p>
                    </Card>

                    <Card className="p-3.5 space-y-1 bg-slate-50/50">
                      <span className="text-[11px] font-semibold text-slate-500">Floor Rise &amp; PLC</span>
                      <div className="font-mono text-base font-bold text-primary-600">
                        +₹{(previewData.calculation.floorRiseAmt + previewData.calculation.plcAmt).toLocaleString("en-IN")}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Floor {previewData.unit.floorNo} (Rise: ₹{previewData.calculation.floorRiseAmt.toLocaleString("en-IN")})
                      </p>
                    </Card>

                    <Card className="p-3.5 space-y-1 bg-slate-50/50">
                      <span className="text-[11px] font-semibold text-slate-500">Net Agreement Value</span>
                      <div className="font-mono text-base font-bold text-slate-900">
                        ₹{previewData.calculation.netAgreementValue.toLocaleString("en-IN")}
                      </div>
                      <p className="text-[10px] text-amber-600">
                        Discount: -₹{previewData.calculation.discountAmt.toLocaleString("en-IN")}
                      </p>
                    </Card>

                    <Card className="p-3.5 space-y-1 bg-emerald-50/50 border-emerald-200">
                      <span className="text-[11px] font-semibold text-emerald-800">All-Inclusive Grand Total</span>
                      <div className="font-mono text-base font-extrabold text-emerald-700">
                        ₹{previewData.calculation.grandTotalInclGst.toLocaleString("en-IN")}
                      </div>
                      <p className="text-[10px] text-emerald-600">Taxes &amp; Extra Charges Included</p>
                    </Card>
                  </div>

                  {/* Statutory & Extra Charges Detailed Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Statutory Taxes */}
                    <div className="border rounded-2xl p-4 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-800 dark:text-dark-100 flex items-center justify-between border-b pb-2">
                        <span>Statutory Taxes &amp; Duties</span>
                        <span className="font-mono text-primary-600">
                          ₹{previewData.calculation.statutoryTaxesTotal.toLocaleString("en-IN")}
                        </span>
                      </h4>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">GST on Construction (5%):</span>
                          <span className="font-mono font-bold">
                            ₹{previewData.calculation.gstAmt.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Stamp Duty (6% Maharashtra):</span>
                          <span className="font-mono font-bold">
                            ₹{previewData.calculation.stampDutyAmt.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Metro Cess (1%):</span>
                          <span className="font-mono font-bold">
                            ₹{previewData.calculation.metroCessAmt.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Registration Fee (1% capped @ ₹30k):</span>
                          <span className="font-mono font-bold">
                            ₹{previewData.calculation.registrationAmt.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {previewData.calculation.isTdsApplicable && (
                          <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-800 dark:text-blue-300">
                            <span>TDS 194-IA (1% deductible by buyer):</span>
                            <span className="font-mono font-bold">
                              ₹{previewData.calculation.tdsAmt.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Extra Development Charges */}
                    <div className="border rounded-2xl p-4 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-800 dark:text-dark-100 flex items-center justify-between border-b pb-2">
                        <span>Standard Extra Charges (16 Heads)</span>
                        <span className="font-mono text-primary-600">
                          ₹{previewData.calculation.otherChargesGrandTotal.toLocaleString("en-IN")}
                        </span>
                      </h4>
                      <div className="space-y-1 pt-1 max-h-40 overflow-y-auto pr-1">
                        {previewData.calculation.otherChargesBreakdown.map((ch: any) => (
                          <div key={ch.code} className="flex justify-between text-[11px]">
                            <span className="text-slate-500 truncate mr-2">{ch.name}:</span>
                            <span className="font-mono font-semibold">
                              ₹{ch.totalAmount.toLocaleString("en-IN")}{" "}
                              {ch.gstAmount > 0 && <span className="text-[10px] text-slate-400">(incl 18% GST)</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Milestone Schedule Preview */}
                  {previewData.calculation.paymentSchedule?.length > 0 && (
                    <div className="border rounded-2xl p-4 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-800 dark:text-dark-100 flex items-center justify-between border-b pb-2">
                        <span>Milestone Payment Schedule ({previewData.calculation.paymentSchedule.length} Stages)</span>
                        <Badge color="success">Total 100.00%</Badge>
                      </h4>
                      <div className="overflow-x-auto max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0">
                            <tr>
                              <th className="py-1 px-2">#</th>
                              <th className="py-1 px-2">Stage Milestone</th>
                              <th className="py-1 px-2 text-right">%</th>
                              <th className="py-1 px-2 text-right">Basic Demand</th>
                              <th className="py-1 px-2 text-right">5% GST</th>
                              <th className="py-1 px-2 text-right">Stage Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {previewData.calculation.paymentSchedule.map((st: any) => (
                              <tr key={st.payStageId} className="hover:bg-slate-50/50">
                                <td className="py-1 px-2 font-bold text-primary-600">{st.code}</td>
                                <td className="py-1 px-2 font-sans font-medium text-slate-800">{st.name}</td>
                                <td className="py-1 px-2 text-right font-bold">{st.stagePct}%</td>
                                <td className="py-1 px-2 text-right">₹{st.demandedBasicAmount.toLocaleString("en-IN")}</td>
                                <td className="py-1 px-2 text-right text-slate-400">₹{st.demandedGstAmount.toLocaleString("en-IN")}</td>
                                <td className="py-1 px-2 text-right font-bold text-slate-900">
                                  ₹{st.totalStageAmount.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                      Quotation Remarks / Client Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Valid for 15 days. Subject to management approval."
                      value={formRemarks}
                      onChange={(e) => setFormRemarks(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              ) : null}

              {/* Modal Actions */}
              <FormActions>
                <Button variant="outlined" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleSaveCostSheet} disabled={saving || !previewData}>
                  {saving ? "Generating Cost Sheet..." : "Save & Issue Cost Sheet"}
                </Button>
              </FormActions>
            </div>
          </FormModal>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODAL 2: A4 PRINTABLE COST SHEET MODAL */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {printModalOpen && activeSheetDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-4xl max-h-[92vh] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto print:p-0 print:border-none print:shadow-none">
              {/* Actions Bar (Hidden during window.print()) */}
              <div className="flex items-center justify-between border-b pb-4 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
                    COST SHEET QUOTATION #{activeSheetDetails.costSheet.id}
                  </span>
                  {getStatusBadge(activeSheetDetails.costSheet.status)}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    color="primary"
                    onClick={() => window.print()}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <PrinterIcon className="size-4" /> Print Quotation (A4)
                  </Button>
                  <Button variant="outlined" onClick={() => setPrintModalOpen(false)} className="text-xs">
                    Close
                  </Button>
                </div>
              </div>

              {/* A4 Printable Document Body */}
              <div id="cost-sheet-print-document" className="p-8 space-y-6 text-slate-800 text-xs bg-white">
                {/* Letterhead Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                      {activeSheetDetails.tenant?.name || "Kings Builders & Developers"}
                    </h1>
                    <p className="text-slate-600 font-medium text-[11px] mt-0.5">
                      Site: {activeSheetDetails.site?.name || "Kings Heights Tower A & B"}
                    </p>
                    <p className="text-slate-500 text-[10px] font-mono mt-0.5">
                      MahaRERA Registration No:{" "}
                      <span className="font-bold text-slate-800">
                        {activeSheetDetails.projectSettings?.reraNo || "P51800028471"}
                      </span>
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-md inline-block uppercase">
                      OFFICIAL QUOTATION
                    </span>
                    <div className="font-mono text-[11px] text-slate-500">
                      Date: {new Date(activeSheetDetails.costSheet.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Unit & Prospect Summary */}
                <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Property Details
                    </span>
                    <div className="font-mono text-base font-bold text-slate-900">
                      Unit No: {activeSheetDetails.costSheet.unit?.unitNo}
                    </div>
                    <div className="text-xs text-slate-600">
                      Type: {activeSheetDetails.costSheet.unit?.unitType?.name} (Floor{" "}
                      {activeSheetDetails.costSheet.unit?.floor?.levelNo})
                    </div>
                    <div className="font-mono text-xs text-slate-700">
                      Carpet Area: {parseFloat(activeSheetDetails.costSheet.unit?.carpetArea).toFixed(0)} sq ft
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Client &amp; Quotation Term
                    </span>
                    <div className="font-semibold text-slate-900 text-sm">
                      {activeSheetDetails.costSheet.lead?.name || "Prospective Homebuyer"}
                    </div>
                    <div className="text-slate-600 text-xs">
                      Mobile: {activeSheetDetails.costSheet.lead?.mobile || "N/A"}
                    </div>
                    <div className="font-mono text-[11px] text-amber-700">
                      Valid Till:{" "}
                      {activeSheetDetails.costSheet.validTill
                        ? new Date(activeSheetDetails.costSheet.validTill).toLocaleDateString("en-IN")
                        : "15 Days"}
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown Table */}
                <div className="space-y-2">
                  <h3 className="font-bold uppercase text-[11px] text-slate-700 tracking-wider">
                    I. Agreement Value &amp; Components
                  </h3>
                  <table className="w-full text-left border text-xs">
                    <thead className="bg-slate-100 font-bold border-b text-slate-700">
                      <tr>
                        <th className="p-2">Component</th>
                        <th className="p-2 text-right">Calculation Basis</th>
                        <th className="p-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      <tr>
                        <td className="p-2 font-sans">Base Carpet Cost</td>
                        <td className="p-2 text-right text-slate-500">
                          {activeSheetDetails.costSheet.lines?.carpetArea} sqft @ ₹
                          {activeSheetDetails.costSheet.lines?.baseRate?.toLocaleString("en-IN")}
                        </td>
                        <td className="p-2 text-right font-bold">
                          ₹{activeSheetDetails.costSheet.lines?.basicCost?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                      {activeSheetDetails.costSheet.lines?.floorRiseAmt > 0 && (
                        <tr>
                          <td className="p-2 font-sans">Floor Rise Escalation</td>
                          <td className="p-2 text-right text-slate-500">
                            {activeSheetDetails.costSheet.lines?.floorRiseApplicableFloors} floors @ +₹
                            {activeSheetDetails.costSheet.lines?.floorRiseRate}
                          </td>
                          <td className="p-2 text-right font-bold text-primary-600">
                            +₹{activeSheetDetails.costSheet.lines?.floorRiseAmt?.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )}
                      {activeSheetDetails.costSheet.lines?.plcAmt > 0 && (
                        <tr>
                          <td className="p-2 font-sans">Preferential Location Charge (PLC)</td>
                          <td className="p-2 text-right text-slate-500">Prime Garden View</td>
                          <td className="p-2 text-right font-bold">
                            +₹{activeSheetDetails.costSheet.lines?.plcAmt?.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )}
                      {activeSheetDetails.costSheet.lines?.discountAmt > 0 && (
                        <tr className="bg-amber-50/50">
                          <td className="p-2 font-sans text-amber-900 font-bold">
                            Special Discount ({activeSheetDetails.costSheet.lines?.discountPct}%)
                          </td>
                          <td className="p-2 text-right text-amber-700">Concession</td>
                          <td className="p-2 text-right font-bold text-amber-700">
                            -₹{activeSheetDetails.costSheet.lines?.discountAmt?.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-100 font-bold text-slate-900">
                        <td className="p-2 uppercase">Net Agreement Value (A)</td>
                        <td className="p-2 text-right"></td>
                        <td className="p-2 text-right text-sm">
                          ₹{activeSheetDetails.costSheet.lines?.netAgreementValue?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Statutory Taxes */}
                <div className="space-y-2">
                  <h3 className="font-bold uppercase text-[11px] text-slate-700 tracking-wider">
                    II. Statutory Taxes &amp; Registration (Government Levies)
                  </h3>
                  <table className="w-full text-left border text-xs">
                    <thead className="bg-slate-100 font-bold border-b text-slate-700">
                      <tr>
                        <th className="p-2">Levy</th>
                        <th className="p-2 text-right">Applicable Rate</th>
                        <th className="p-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      <tr>
                        <td className="p-2 font-sans">GST on Under-Construction Property</td>
                        <td className="p-2 text-right text-slate-500">5.0% on Net Agreement</td>
                        <td className="p-2 text-right font-bold">
                          ₹{activeSheetDetails.costSheet.lines?.gstAmt?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans">Stamp Duty (Govt of Maharashtra)</td>
                        <td className="p-2 text-right text-slate-500">6.0% on Net Agreement</td>
                        <td className="p-2 text-right font-bold">
                          ₹{activeSheetDetails.costSheet.lines?.stampDutyAmt?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans">Metro Cess</td>
                        <td className="p-2 text-right text-slate-500">1.0% on Net Agreement</td>
                        <td className="p-2 text-right font-bold">
                          ₹{activeSheetDetails.costSheet.lines?.metroCessAmt?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans">Registration Charges</td>
                        <td className="p-2 text-right text-slate-500">1% capped at ₹30,000</td>
                        <td className="p-2 text-right font-bold">
                          ₹{activeSheetDetails.costSheet.lines?.registrationAmt?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="bg-slate-100 font-bold text-slate-900">
                        <td className="p-2 uppercase">Total Statutory Levies (B)</td>
                        <td className="p-2 text-right"></td>
                        <td className="p-2 text-right text-sm">
                          ₹{activeSheetDetails.costSheet.lines?.statutoryTaxesTotal?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Grand Total All-Inclusive */}
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-between text-emerald-900 font-bold">
                  <div>
                    <span className="text-xs uppercase tracking-wider block">Grand All-Inclusive Total (A + B + Extra Charges)</span>
                    <span className="text-xs font-normal text-emerald-700">
                      Includes Agreement Value, GST, Stamp Duty, Metro Cess, Registration, and Society Charges.
                    </span>
                  </div>
                  <div className="font-mono text-2xl text-emerald-800 font-extrabold">
                    ₹{activeSheetDetails.costSheet.lines?.grandTotalInclGst?.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Bank Details & Terms */}
                <div className="border-t pt-4 text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Bank Account Details for Cheques / RTGS / NEFT:</p>
                  <p className="font-mono text-slate-800">
                    {activeSheetDetails.projectSettings?.bankDetailsText ||
                      "Kings Real Estate LLP - HDFC Bank A/C: 50200084729104, IFSC: HDFC0000128, Branch: Worli Mumbai"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    * This cost sheet is an estimate and quotation. Final prices, statutory taxes, and charges are subject
                    to the formal Agreement for Sale. TDS u/s 194-IA (1%) to be deducted by the buyer and deposited with
                    the Income Tax Department.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Approve Cost Sheet Modal ────────────────────────────────────── */}
        {approvingCs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="max-w-lg w-full bg-white dark:bg-dark-750 border border-slate-200 dark:border-dark-600 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                    <CheckCircleIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                      Approve Discount — Unit {approvingCs.unitNo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-dark-300 mt-0.5">
                      Client: {approvingCs.leadName || "Walk-in Prospect"} • Scheme: {approvingCs.schemeName || "Standard"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setApprovingCs(null);
                    setApprovalRemarks("");
                    setApprovalError("");
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 transition-colors"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
                <ExclamationCircleIcon className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  This cost sheet requests a discount of <strong>{parseFloat(approvingCs.discountPct).toFixed(2)}%</strong>. Approving will authorize the rate concession and mark status as <strong>Approved</strong>.
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-200">
                  Sales Head Approval Remarks <span className="text-rose-500 font-bold">* (Required)</span>
                </label>
                <textarea
                  rows={3}
                  value={approvalRemarks}
                  onChange={(e) => {
                    setApprovalRemarks(e.target.value);
                    if (approvalError && e.target.value.trim()) setApprovalError("");
                  }}
                  placeholder="e.g. Approved special festive discount exception as per Director approval."
                  className={`w-full text-xs p-3 rounded-xl border transition-all duration-150 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-dark-100 focus:outline-none focus:ring-2 ${
                    approvalError
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-300 dark:border-dark-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
                {approvalError && (
                  <p className="text-[11px] text-rose-500 font-medium">{approvalError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-dark-700">
                <Button
                  variant="outlined"
                  disabled={approving}
                  onClick={() => {
                    setApprovingCs(null);
                    setApprovalRemarks("");
                    setApprovalError("");
                  }}
                  className="text-xs py-2 px-4"
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  disabled={approving || !approvalRemarks.trim()}
                  onClick={handleConfirmApprove}
                  className={`text-xs py-2 px-5 font-semibold ${
                    !approvalRemarks.trim()
                      ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-dark-600 text-slate-500"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {approving ? "Approving..." : "Confirm Approval"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Reject Cost Sheet Modal ─────────────────────────────────────── */}
        {rejectingCs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="max-w-lg w-full bg-white dark:bg-dark-750 border border-slate-200 dark:border-dark-600 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner shrink-0">
                    <XMarkIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                      Reject Discount — Unit {rejectingCs.unitNo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-dark-300 mt-0.5">
                      Client: {rejectingCs.leadName || "Walk-in Prospect"} • Scheme: {rejectingCs.schemeName || "Standard"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRejectingCs(null);
                    setRejectRemarks("");
                    setRejectError("");
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 transition-colors"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200 leading-relaxed flex items-start gap-2.5">
                <ExclamationCircleIcon className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  Rejecting this quotation will mark the cost sheet status as <strong>Rejected</strong>.
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-dark-200">
                  Rejection Reason / Remarks <span className="text-rose-500 font-bold">* (Required)</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectRemarks}
                  onChange={(e) => {
                    setRejectRemarks(e.target.value);
                    if (rejectError && e.target.value.trim()) setRejectError("");
                  }}
                  placeholder="e.g. Discount exceeds allowed ceiling for this unit configuration."
                  className={`w-full text-xs p-3 rounded-xl border transition-all duration-150 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-dark-100 focus:outline-none focus:ring-2 ${
                    rejectError
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-300 dark:border-dark-600 focus:border-rose-500 focus:ring-rose-500/20"
                  }`}
                />
                {rejectError && (
                  <p className="text-[11px] text-rose-500 font-medium">{rejectError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-dark-700">
                <Button
                  variant="outlined"
                  disabled={rejecting}
                  onClick={() => {
                    setRejectingCs(null);
                    setRejectRemarks("");
                    setRejectError("");
                  }}
                  className="text-xs py-2 px-4"
                >
                  Cancel
                </Button>
                <Button
                  color="error"
                  disabled={rejecting || !rejectRemarks.trim()}
                  onClick={handleConfirmReject}
                  className={`text-xs py-2 px-5 font-semibold ${
                    !rejectRemarks.trim()
                      ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-dark-600 text-slate-500"
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  }`}
                >
                  {rejecting ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
