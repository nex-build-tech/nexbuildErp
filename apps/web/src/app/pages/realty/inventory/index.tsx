import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  BuildingOffice2Icon,
  Squares2X2Icon,
  TableCellsIcon,
  TruckIcon,
  ClockIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyRupeeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface WingItem {
  id: number;
  name: string;
  totalFloors: number;
  phaseId: number;
  phaseName: string;
}

interface UnitItem {
  id: number;
  uuid: string;
  siteId: number;
  wingId: number;
  floorId: number;
  unitNo: string;
  unitTypeId: number;
  unitTypeCode: string;
  unitTypeName: string;
  category: string;
  carpetArea: string;
  balconyArea?: string | null;
  saleableArea?: string | null;
  facing?: string | null;
  baseRate: string;
  floorRiseRate: string;
  plcAmount: string;
  status: "available" | "hold" | "blocked" | "booked" | "agreement" | "registered" | "possession";
  holdBy?: number | null;
  holdTill?: string | null;
  isInvestor?: boolean;
}

interface FloorElevation {
  id: number;
  name: string;
  levelNo: number;
  units: UnitItem[];
}

interface ParkingSlotItem {
  id: number;
  slotNo: string;
  type: string;
  price: string;
  status: "available" | "hold" | "booked";
  bookingId?: number | null;
}

export default function RealtyInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"elevation" | "table" | "parking">("elevation");

  // Wings & Elevation Data
  const [wings, setWings] = useState<WingItem[]>([]);
  const [selectedWingId, setSelectedWingId] = useState<number | null>(null);
  const [floors, setFloors] = useState<FloorElevation[]>([]);
  const [allUnits, setAllUnits] = useState<UnitItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    available: 0,
    hold: 0,
    blocked: 0,
    booked: 0,
    registered: 0,
    other: 0,
  });

  // Parking data
  const [parkingSlots, setParkingSlots] = useState<ParkingSlotItem[]>([]);
  const [parkingCounts, setParkingCounts] = useState({ total: 0, available: 0, hold: 0, booked: 0 });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchUnit, setSearchUnit] = useState<string>("");

  // Selected Unit for Drawer / Actions
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);

  // Modals
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [holdHours, setHoldHours] = useState(48);
  const [holdRemarks, setHoldRemarks] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isInvestorBlock, setIsInvestorBlock] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [selectedWingId]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/inventory/grid", {
        params: {
          siteId: 1,
          wingId: selectedWingId || undefined,
        },
      });

      const data = res.data?.data || res.data;
      if (data) {
        setWings(data.wings || []);
        if (!selectedWingId && data.wings?.length > 0) {
          setSelectedWingId(data.selectedWingId || data.wings[0].id);
        }
        setCounts(data.counts || {});
        setFloors(data.floors || []);
        setAllUnits(data.allUnits || []);
      }

      // Also fetch parking grid
      const pkRes = await axios.get("/realty/inventory/parking-grid?siteId=1");
      const pkData = pkRes.data?.data || pkRes.data;
      if (pkData) {
        setParkingSlots(pkData.slots || []);
        setParkingCounts(pkData.counts || {});
      }
    } catch (err) {
      console.error("Failed to load inventory grid", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnitClick = (unit: UnitItem) => {
    setSelectedUnit(unit);
    setActionDrawerOpen(true);
  };

  const handleExecuteHold = async () => {
    if (!selectedUnit) return;
    setActionInProgress(true);
    try {
      await axios.post(`/realty/inventory/units/${selectedUnit.id}/hold`, {
        holdHours,
        remarks: holdRemarks,
      });
      alert(`✅ Unit ${selectedUnit.unitNo} successfully put on hold for ${holdHours} hours.`);
      setHoldModalOpen(false);
      setActionDrawerOpen(false);
      await loadInventory();
    } catch (err: any) {
      alert(`Hold failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleExecuteBlock = async () => {
    if (!selectedUnit) return;
    setActionInProgress(true);
    try {
      await axios.post(`/realty/inventory/units/${selectedUnit.id}/block`, {
        reason: blockReason,
        isInvestor: isInvestorBlock,
      });
      alert(`✅ Unit ${selectedUnit.unitNo} blocked.`);
      setBlockModalOpen(false);
      setActionDrawerOpen(false);
      await loadInventory();
    } catch (err: any) {
      alert(`Block failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleExecuteRelease = async () => {
    if (!selectedUnit) return;
    if (!confirm(`Are you sure you want to release Unit ${selectedUnit.unitNo} back to AVAILABLE?`)) return;
    setActionInProgress(true);
    try {
      await axios.post(`/realty/inventory/units/${selectedUnit.id}/release`);
      alert(`✅ Unit ${selectedUnit.unitNo} is now AVAILABLE.`);
      setActionDrawerOpen(false);
      await loadInventory();
    } catch (err: any) {
      alert(`Release failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRunHoldExpiryCron = async () => {
    try {
      const res = await axios.post("/realty/inventory/cron/release-expired-holds");
      const data = res.data?.data || res.data;
      alert(`⏰ Hold Expiry Cron executed. Released ${data.releasedCount || 0} expired units.`);
      await loadInventory();
    } catch (err: any) {
      alert(`Cron failed: ${err.message}`);
    }
  };

  // Color mapper for unit status
  const getStatusColorClasses = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      case "hold":
        return "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case "blocked":
        return "bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100 hover:border-purple-400 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      case "booked":
      case "agreement":
        return "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 hover:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
      case "registered":
      case "possession":
        return "bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-dark-700 dark:text-slate-300";
    }
  };

  // Filter units
  const filterUnit = (u: UnitItem) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (typeFilter !== "all" && !u.unitTypeCode.toLowerCase().includes(typeFilter.toLowerCase())) return false;
    if (searchUnit.trim() && !u.unitNo.toLowerCase().includes(searchUnit.toLowerCase().trim())) return false;
    return true;
  };

  return (
    <Page title="Unit Inventory & Elevation Grid">
      <div className="space-y-6 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-100 flex items-center gap-2.5">
              <BuildingOffice2Icon className="size-7 text-primary-600" />
              Unit Inventory &amp; Elevation Grid
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Visual floor-by-floor architectural elevation, real-time unit hold/block management, and parking bays.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              onClick={handleRunHoldExpiryCron}
              className="text-xs flex items-center gap-1.5"
              title="Execute hold expiry scanner"
            >
              <ClockIcon className="size-4 text-amber-500" /> Run Hold-Expiry Cron
            </Button>

            <Button
              color="primary"
              onClick={() => (window.location.href = "/realty/cost-sheets")}
              className="text-xs"
            >
              <CurrencyRupeeIcon className="size-4 mr-1" /> Cost Sheets Register
            </Button>
          </div>
        </div>

        {/* View Mode Switcher & Wing Selector */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-dark-800 p-4 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wing / Tower:</span>
            <div className="flex items-center gap-1.5">
              {wings.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWingId(w.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedWingId === w.id
                      ? "bg-primary-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {w.name} ({w.totalFloors} Fl)
                </button>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-700 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("elevation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "elevation"
                  ? "bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-2xs"
                  : "text-slate-600 dark:text-dark-300 hover:text-slate-900"
              }`}
            >
              <Squares2X2Icon className="size-4" /> Elevation Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-2xs"
                  : "text-slate-600 dark:text-dark-300 hover:text-slate-900"
              }`}
            >
              <TableCellsIcon className="size-4" /> Table View ({allUnits.length})
            </button>
            <button
              onClick={() => setViewMode("parking")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "parking"
                  ? "bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-2xs"
                  : "text-slate-600 dark:text-dark-300 hover:text-slate-900"
              }`}
            >
              <TruckIcon className="size-4" /> Parking Bays ({parkingSlots.length})
            </button>
          </div>
        </div>

        {/* Status Count Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-white dark:bg-dark-800 border rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500">Total Units</span>
              <div className="text-xl font-bold font-mono text-slate-800 dark:text-dark-100">{counts.total}</div>
            </div>
            <BuildingOffice2Icon className="size-6 text-slate-400" />
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "available" ? "all" : "available")}
            className={`p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
              statusFilter === "available" ? "ring-2 ring-emerald-500 shadow-xs" : ""
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Available</span>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {counts.available}
              </div>
            </div>
            <CheckCircleIcon className="size-6 text-emerald-600" />
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "hold" ? "all" : "hold")}
            className={`p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
              statusFilter === "hold" ? "ring-2 ring-amber-500 shadow-xs" : ""
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">On Hold</span>
              <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">{counts.hold}</div>
            </div>
            <ClockIcon className="size-6 text-amber-600" />
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "blocked" ? "all" : "blocked")}
            className={`p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
              statusFilter === "blocked" ? "ring-2 ring-purple-500 shadow-xs" : ""
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">Blocked</span>
              <div className="text-xl font-bold font-mono text-purple-700 dark:text-purple-400">{counts.blocked}</div>
            </div>
            <LockClosedIcon className="size-6 text-purple-600" />
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "booked" ? "all" : "booked")}
            className={`p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
              statusFilter === "booked" ? "ring-2 ring-blue-500 shadow-xs" : ""
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">Booked</span>
              <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400">{counts.booked}</div>
            </div>
            <CheckCircleIcon className="size-6 text-blue-600" />
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === "registered" ? "all" : "registered")}
            className={`p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
              statusFilter === "registered" ? "ring-2 ring-indigo-500 shadow-xs" : ""
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300">Registered</span>
              <div className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-400">
                {counts.registered}
              </div>
            </div>
            <CheckCircleIcon className="size-6 text-indigo-600" />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <MagnifyingGlassIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by unit number (e.g. 101, 2304, G-01)..."
              value={searchUnit}
              onChange={(e) => setSearchUnit(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 font-semibold"
            >
              <option value="all">All Typologies</option>
              <option value="COMM-SHOP">Commercial Shops</option>
              <option value="1BHK">1 BHK</option>
              <option value="2BHK">2 BHK</option>
              <option value="2.5BHK">2.5 BHK</option>
              <option value="3BHK">3 BHK</option>
              <option value="4BHK">4 BHK</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800 font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="hold">On Hold</option>
              <option value="blocked">Blocked</option>
              <option value="booked">Booked</option>
              <option value="registered">Registered</option>
            </select>

            {(statusFilter !== "all" || typeFilter !== "all" || searchUnit) && (
              <Button
                variant="outlined"
                onClick={() => {
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setSearchUnit("");
                }}
                className="text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: ELEVATION GRID (SIGNATURE SCREEN) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === "elevation" && (
          <Card className="p-6 space-y-4 shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between border-b pb-3 dark:border-dark-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                  <span>Wing Elevation: Top Floor (23) to Ground (0)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Click any unit tile to view specifications, put on hold, block, or generate an instant cost sheet.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>{floors.length} Levels</span>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500 font-medium">
                <ArrowPathIcon className="size-6 animate-spin mx-auto mb-2 text-primary-600" />
                Loading architectural elevation...
              </div>
            ) : floors.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No floors found for this wing. Run Bulk Structure Generator in Setup.
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-slate-100 dark:divide-dark-700/60">
                {floors.map((fl) => {
                  const filteredFloorUnits = fl.units.filter(filterUnit);
                  if (filteredFloorUnits.length === 0 && (statusFilter !== "all" || typeFilter !== "all" || searchUnit)) {
                    return null; // hide row if filters active and no matches
                  }

                  return (
                    <div key={fl.id} className="pt-3 flex flex-col md:flex-row md:items-center gap-3">
                      {/* Floor Level Label */}
                      <div className="w-28 shrink-0 flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-dark-200 px-2.5 py-1 bg-slate-100 dark:bg-dark-700 rounded-lg">
                          {fl.levelNo === 0 ? "GROUND" : `FL ${fl.levelNo}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                          {fl.units.length} units
                        </span>
                      </div>

                      {/* Floor Unit Tiles */}
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
                        {filteredFloorUnits.map((u) => {
                          const isHeld = u.status === "hold";
                          const isBlocked = u.status === "blocked";
                          return (
                            <button
                              key={u.id}
                              onClick={() => handleUnitClick(u)}
                              className={`relative p-2.5 rounded-xl border text-left transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${getStatusColorClasses(
                                u.status
                              )}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-xs font-extrabold tracking-tight">
                                  {u.unitNo}
                                </span>
                                {isHeld && <ClockIcon className="size-3.5 text-amber-600 animate-pulse" />}
                                {isBlocked && <LockClosedIcon className="size-3.5 text-purple-600" />}
                              </div>

                              <div className="text-[11px] font-semibold truncate leading-tight">
                                {u.unitTypeCode}
                              </div>

                              <div className="flex items-center justify-between text-[10px] opacity-75 mt-1 font-mono">
                                <span>{parseFloat(u.carpetArea).toFixed(0)} sqft</span>
                                <span className="uppercase">{u.facing || "E"}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: TABLE VIEW */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === "table" && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4 dark:border-dark-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100">
                Inventory Units Register
              </h3>
              <Badge color="primary">{allUnits.filter(filterUnit).length} Matching Units</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-dark-750 text-slate-600 dark:text-dark-300 font-bold border-b dark:border-dark-700 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Unit No</th>
                    <th className="py-2.5 px-3">Typology</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Carpet Area</th>
                    <th className="py-2.5 px-3">Base Rate</th>
                    <th className="py-2.5 px-3">Floor Rise</th>
                    <th className="py-2.5 px-3">Facing</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {allUnits.filter(filterUnit).slice(0, 50).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-750/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary-600">{u.unitNo}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-dark-200">{u.unitTypeName}</td>
                      <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-slate-500">{u.category}</td>
                      <td className="py-2.5 px-3 font-mono">{parseFloat(u.carpetArea).toFixed(0)} sq ft</td>
                      <td className="py-2.5 px-3 font-mono">₹{parseFloat(u.baseRate).toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">+₹{parseFloat(u.floorRiseRate).toFixed(0)}</td>
                      <td className="py-2.5 px-3 font-semibold uppercase">{u.facing || "East"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColorClasses(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="outlined"
                          onClick={() => handleUnitClick(u)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: PARKING VIEW */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === "parking" && (
          <Card className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 dark:border-dark-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                  <TruckIcon className="size-5 text-primary-600" />
                  Parking Bays &amp; Allocations
                </h3>
                <p className="text-xs text-slate-500">
                  Stilt and covered car parking inventory for Kings Heights.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge color="success">{parkingCounts.available} Available</Badge>
                <Badge color="warning">{parkingCounts.hold} On Hold</Badge>
                <Badge color="primary">{parkingCounts.booked} Booked</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {parkingSlots.map((ps) => {
                const isAvail = ps.status === "available";
                const isBooked = ps.status === "booked";
                return (
                  <div
                    key={ps.id}
                    className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                      isAvail
                        ? "bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 hover:border-emerald-500"
                        : isBooked
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                        : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    <TruckIcon
                      className={`size-7 mx-auto ${
                        isAvail ? "text-slate-400" : isBooked ? "text-blue-600" : "text-amber-500"
                      }`}
                    />
                    <div className="font-mono text-sm font-bold text-slate-900 dark:text-dark-100">
                      {ps.slotNo}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">
                      {ps.type}
                    </div>
                    <div className="font-mono text-xs font-bold text-emerald-600">
                      ₹{parseFloat(ps.price).toLocaleString("en-IN")}
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isAvail
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : isBooked
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {ps.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* UNIT DETAIL & ACTION DRAWER */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {actionDrawerOpen && selectedUnit && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs">
            <div className="bg-white dark:bg-dark-800 w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-slate-200 dark:border-dark-700 animate-slide-left">
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-start justify-between border-b pb-4 dark:border-dark-700">
                  <div>
                    <span className="text-xs font-bold uppercase text-primary-600 tracking-wider">
                      Unit Specification
                    </span>
                    <h2 className="text-2xl font-mono font-extrabold text-slate-900 dark:text-dark-100">
                      Unit {selectedUnit.unitNo}
                    </h2>
                    <p className="text-xs text-slate-500">{selectedUnit.unitTypeName}</p>
                  </div>

                  <button
                    onClick={() => setActionDrawerOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-dark-200"
                  >
                    <XCircleIcon className="size-6" />
                  </button>
                </div>

                {/* Status Banner */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${getStatusColorClasses(
                    selectedUnit.status
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase">Status: {selectedUnit.status}</span>
                  </div>
                  {selectedUnit.holdTill && (
                    <span className="text-[11px] font-mono font-bold">
                      Till: {new Date(selectedUnit.holdTill).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-dark-750 rounded-xl space-y-1">
                    <span className="text-slate-400 font-semibold">Carpet Area</span>
                    <div className="font-mono text-sm font-bold text-slate-800 dark:text-dark-100">
                      {parseFloat(selectedUnit.carpetArea).toFixed(0)} sq ft
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-dark-750 rounded-xl space-y-1">
                    <span className="text-slate-400 font-semibold">Base Rate</span>
                    <div className="font-mono text-sm font-bold text-slate-800 dark:text-dark-100">
                      ₹{parseFloat(selectedUnit.baseRate).toLocaleString("en-IN")} / sqft
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-dark-750 rounded-xl space-y-1">
                    <span className="text-slate-400 font-semibold">Floor Rise</span>
                    <div className="font-mono text-sm font-bold text-primary-600">
                      +₹{parseFloat(selectedUnit.floorRiseRate).toFixed(0)} / floor
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-dark-750 rounded-xl space-y-1">
                    <span className="text-slate-400 font-semibold">Facing / View</span>
                    <div className="font-semibold text-slate-800 dark:text-dark-100 uppercase">
                      {selectedUnit.facing || "East Garden"}
                    </div>
                  </div>
                </div>

                {/* Quick Actions List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Available Actions
                  </h4>

                  {selectedUnit.status === "available" && (
                    <>
                      <Button
                        color="primary"
                        className="w-full justify-center text-xs py-2.5 font-bold"
                        onClick={() => {
                          setHoldModalOpen(true);
                        }}
                      >
                        <ClockIcon className="size-4 mr-2" /> Put on Hold (48h Default)
                      </Button>

                      <Button
                        variant="outlined"
                        className="w-full justify-center text-xs py-2.5 font-bold border-purple-500 text-purple-600 hover:bg-purple-50"
                        onClick={() => {
                          setBlockModalOpen(true);
                        }}
                      >
                        <LockClosedIcon className="size-4 mr-2" /> Block Unit (Management / Investor)
                      </Button>
                    </>
                  )}

                  {(selectedUnit.status === "hold" || selectedUnit.status === "blocked") && (
                    <Button
                      variant="outlined"
                      className="w-full justify-center text-xs py-2.5 font-bold text-rose-600 border-rose-300 hover:bg-rose-50"
                      onClick={handleExecuteRelease}
                      disabled={actionInProgress}
                    >
                      <XCircleIcon className="size-4 mr-2" /> Release Unit to Available
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    className="w-full justify-center text-xs py-2.5 font-bold"
                    onClick={() => {
                      window.location.href = `/realty/cost-sheets?unitId=${selectedUnit.id}`;
                    }}
                  >
                    <CurrencyRupeeIcon className="size-4 mr-2" /> Generate Cost Sheet
                  </Button>
                </div>
              </div>

              {/* Close Button */}
              <div className="border-t pt-4 dark:border-dark-700">
                <Button variant="outlined" className="w-full justify-center text-xs" onClick={() => setActionDrawerOpen(false)}>
                  Close Drawer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HOLD UNIT MODAL */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {holdModalOpen && selectedUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-md shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                <ClockIcon className="size-5 text-amber-500" />
                Put Unit {selectedUnit.unitNo} on Hold
              </h3>
              <p className="text-xs text-slate-500">
                Reserves the unit temporarily for a prospective client. Hold expires automatically via nightly cron.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Hold Duration (Hours)
                  </label>
                  <select
                    value={holdHours}
                    onChange={(e) => setHoldHours(Number(e.target.value))}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  >
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={48}>48 Hours (2 Days - Standard)</option>
                    <option value={72}>72 Hours (3 Days - Weekend Special)</option>
                    <option value={120}>120 Hours (5 Days - Management Approved)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Prospect / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Client Mr. Rajesh Sharma site visit follow-up"
                    value={holdRemarks}
                    onChange={(e) => setHoldRemarks(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-dark-700">
                <Button variant="outlined" onClick={() => setHoldModalOpen(false)}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleExecuteHold} disabled={actionInProgress}>
                  {actionInProgress ? "Applying Hold..." : "Confirm Hold"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* BLOCK UNIT MODAL */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {blockModalOpen && selectedUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 w-full max-w-md shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                <LockClosedIcon className="size-5 text-purple-600" />
                Block Unit {selectedUnit.unitNo}
              </h3>
              <p className="text-xs text-slate-500">
                Blocks unit from public sale (e.g. investor quota, management hold, or legal hold).
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-dark-300 block mb-1">
                    Block Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reserved for Investor Series A"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-dark-300">
                  <input
                    type="checkbox"
                    checked={isInvestorBlock}
                    onChange={(e) => setIsInvestorBlock(e.target.checked)}
                    className="rounded"
                  />
                  Mark as Investor Quota
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-dark-700">
                <Button variant="outlined" onClick={() => setBlockModalOpen(false)}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleExecuteBlock} disabled={actionInProgress}>
                  {actionInProgress ? "Blocking..." : "Confirm Block"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
