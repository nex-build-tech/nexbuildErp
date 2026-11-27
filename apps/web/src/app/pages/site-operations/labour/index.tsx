import { useState, useEffect } from "react";
import axios from "axios";
import { Page } from "@/components/shared/Page";
import {
  UserGroupIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface ContractorEntry {
  contractorId: number | null;
  contractorName: string;
  tradeCategory: string;
  skilledMale: number;
  skilledFemale: number;
  semiSkilledMale: number;
  semiSkilledFemale: number;
  unskilledMale: number;
  unskilledFemale: number;
  supervisors: number;
  overtimeHours: number;
  workLocation: string;
  remarks: string;
}

export default function LabourAttendancePage() {
  const [submitting, setSubmitting] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("1");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [shift, setShift] = useState<string>("Day");
  const [entries, setEntries] = useState<ContractorEntry[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalHeads: 0,
    skilled: 0,
    semiSkilled: 0,
    unskilled: 0,
    supervisors: 0,
    overtimeHours: 0,
  });

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchAttendance();
      fetchSummary();
    }
  }, [selectedSite, attendanceDate, shift]);

  const fetchPrerequisites = async () => {
    try {
      const [sitesRes, contRes] = await Promise.all([
        axios.get("/masters/sites"),
        axios.get("/masters/contractors"),
      ]);
      const siteList = sitesRes.data?.data || [];
      const contList = contRes.data?.data || [];
      setSites(siteList);
      if (siteList.length > 0) {
        setSelectedSite(String(siteList[0].id));
      }

      // Initialize entries template from active contractors
      initEntries(contList);
    } catch {
      // ignore
    }
  };

  const initEntries = (contList: any[]) => {
    const list: ContractorEntry[] = contList.map((c) => ({
      contractorId: c.id,
      contractorName: c.name,
      tradeCategory: c.trade || "Civil Construction",
      skilledMale: 0,
      skilledFemale: 0,
      semiSkilledMale: 0,
      semiSkilledFemale: 0,
      unskilledMale: 0,
      unskilledFemale: 0,
      supervisors: 0,
      overtimeHours: 0,
      workLocation: "Tower A & B",
      remarks: "",
    }));

    // Add Departmental Labour line
    list.push({
      contractorId: null,
      contractorName: "Kings Builders Departmental Labour",
      tradeCategory: "Stores & General Civil",
      skilledMale: 0,
      skilledFemale: 0,
      semiSkilledMale: 0,
      semiSkilledFemale: 0,
      unskilledMale: 0,
      unskilledFemale: 0,
      supervisors: 0,
      overtimeHours: 0,
      workLocation: "Central Store & Yard",
      remarks: "",
    });

    setEntries(list);
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get("/labour/attendance", {
        params: { siteId: selectedSite, date: attendanceDate, shift },
      });
      const data = res.data?.data || [];
      setHistoryLogs(data);

      // If existing attendance exists for this site/date/shift, populate entries
      if (data.length > 0) {
        setEntries((prev) =>
          prev.map((p) => {
            const match = data.find(
              (d: any) =>
                (d.contractorId === p.contractorId || (!d.contractorId && !p.contractorId)) &&
                d.shift === shift
            );
            if (match) {
              return {
                ...p,
                skilledMale: match.skilledMale || 0,
                skilledFemale: match.skilledFemale || 0,
                semiSkilledMale: match.semiSkilledMale || 0,
                semiSkilledFemale: match.semiSkilledFemale || 0,
                unskilledMale: match.unskilledMale || 0,
                unskilledFemale: match.unskilledFemale || 0,
                supervisors: match.supervisors || 0,
                overtimeHours: Number(match.overtimeHours) || 0,
                workLocation: match.workLocation || p.workLocation,
                remarks: match.remarks || "",
              };
            }
            return p;
          })
        );
      }
    } catch {
      // ignore
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get("/labour/summary", {
        params: { siteId: selectedSite },
      });
      if (res.data?.data?.totals) {
        setSummary(res.data.data.totals);
      }
    } catch {
      // ignore
    }
  };

  const updateCount = (
    idx: number,
    field: keyof ContractorEntry,
    delta: number
  ) => {
    setEntries((prev) => {
      const copy = [...prev];
      const current = Number(copy[idx]![field]) || 0;
      const next = Math.max(0, current + delta);
      (copy[idx] as any)[field] = next;
      return copy;
    });
  };

  const handleBulkSubmit = async () => {
    setSubmitting(true);
    try {
      await axios.post("/labour/attendance/bulk", {
        siteId: Number(selectedSite),
        attendanceDate,
        shift,
        entries,
      });
      alert("✅ Today's Labour Muster Roll saved successfully!");
      fetchAttendance();
      fetchSummary();
    } catch {
      alert("Failed to save labour attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute live totals across all entries
  const liveTotalWorkers = entries.reduce(
    (acc, e) =>
      acc +
      e.skilledMale +
      e.skilledFemale +
      e.semiSkilledMale +
      e.semiSkilledFemale +
      e.unskilledMale +
      e.unskilledFemale +
      e.supervisors,
    0
  );

  const liveTotalOvertime = entries.reduce((acc, e) => acc + (Number(e.overtimeHours) || 0), 0);

  return (
    <Page title="Labour Attendance & Headcount">
      <div className="flex flex-col gap-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-lg">
              <UserGroupIcon className="w-6 h-6" />
              <span>Labour Muster Roll</span>
            </div>

            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 px-3 py-1.5 focus:ring-primary-500"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 px-3 py-1.5 focus:ring-primary-500"
            />

            <div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-600 p-0.5 bg-gray-50 dark:bg-dark-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShift("Day")}
                className={`px-3 py-1 rounded-md transition ${
                  shift === "Day"
                    ? "bg-white dark:bg-dark-800 text-primary-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Day Shift
              </button>
              <button
                type="button"
                onClick={() => setShift("Night")}
                className={`px-3 py-1 rounded-md transition ${
                  shift === "Night"
                    ? "bg-white dark:bg-dark-800 text-primary-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Night Shift
              </button>
            </div>

            <button
              onClick={() => {
                fetchAttendance();
                fetchSummary();
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleBulkSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>{submitting ? "Saving..." : "Save Today's Muster Roll"}</span>
          </button>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Today's Headcount</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-primary-600 dark:text-primary-400">
                {liveTotalWorkers}
              </span>
              <span className="text-xs text-gray-400">workers on site</span>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Overtime Deployed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {liveTotalOvertime}
              </span>
              <span className="text-xs text-gray-400">man-hours</span>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Project Cumulative</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-gray-800 dark:text-gray-200">
                {summary.totalHeads || 0}
              </span>
              <span className="text-xs text-gray-400">mandays logged</span>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Cumulative Overtime</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {Number(summary.overtimeHours || 0).toFixed(0)}
              </span>
              <span className="text-xs text-gray-400">total OT hours</span>
            </div>
          </div>
        </div>

        {/* Rapid Count-Based Attendance Tally Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
              Contractor-wise Headcount Tally
            </h3>
            <span className="text-xs text-gray-400">
              Tap + / - buttons or type count directly
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {entries.map((entry, idx) => {
              const contractorTotal =
                entry.skilledMale +
                entry.skilledFemale +
                entry.semiSkilledMale +
                entry.semiSkilledFemale +
                entry.unskilledMale +
                entry.unskilledFemale +
                entry.supervisors;

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-5 shadow-sm"
                >
                  {/* Contractor Title Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-100 dark:border-dark-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                          {entry.contractorName}
                        </span>
                        <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded">
                          {entry.tradeCategory}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 mt-0.5 block">
                        Location: {entry.workLocation}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-gray-400">Subtotal</span>
                        <p className="font-bold font-mono text-lg text-primary-600 dark:text-primary-400 leading-none">
                          {contractorTotal}{" "}
                          <span className="text-xs font-normal text-gray-500">Heads</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Counter Buttons Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                    {/* 1. Skilled Male */}
                    <div className="bg-gray-50 dark:bg-dark-700/40 p-2.5 rounded-lg text-center">
                      <span className="text-gray-500 block mb-1">Skilled (M)</span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "skilledMale", -1)}
                          className="w-7 h-7 rounded bg-gray-200 dark:bg-dark-600 hover:bg-gray-300 dark:hover:bg-dark-500 flex items-center justify-center font-bold"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={entry.skilledMale}
                          onChange={(e) => updateCount(idx, "skilledMale", Number(e.target.value) - entry.skilledMale)}
                          className="w-10 text-center font-bold font-mono bg-transparent border-0 p-0 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "skilledMale", 1)}
                          className="w-7 h-7 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400 hover:bg-primary-200 flex items-center justify-center font-bold"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 2. Skilled Female */}
                    <div className="bg-gray-50 dark:bg-dark-700/40 p-2.5 rounded-lg text-center">
                      <span className="text-gray-500 block mb-1">Skilled (F)</span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "skilledFemale", -1)}
                          className="w-7 h-7 rounded bg-gray-200 dark:bg-dark-600 hover:bg-gray-300 flex items-center justify-center font-bold"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={entry.skilledFemale}
                          onChange={(e) => updateCount(idx, "skilledFemale", Number(e.target.value) - entry.skilledFemale)}
                          className="w-10 text-center font-bold font-mono bg-transparent border-0 p-0 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "skilledFemale", 1)}
                          className="w-7 h-7 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400 hover:bg-primary-200 flex items-center justify-center font-bold"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 3. Semi-Skilled Male */}
                    <div className="bg-gray-50 dark:bg-dark-700/40 p-2.5 rounded-lg text-center">
                      <span className="text-gray-500 block mb-1">Semi-Sk (M)</span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "semiSkilledMale", -1)}
                          className="w-7 h-7 rounded bg-gray-200 dark:bg-dark-600 hover:bg-gray-300 flex items-center justify-center font-bold"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={entry.semiSkilledMale}
                          onChange={(e) => updateCount(idx, "semiSkilledMale", Number(e.target.value) - entry.semiSkilledMale)}
                          className="w-10 text-center font-bold font-mono bg-transparent border-0 p-0 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "semiSkilledMale", 1)}
                          className="w-7 h-7 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400 hover:bg-primary-200 flex items-center justify-center font-bold"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 4. Semi-Skilled Female */}
                    <div className="bg-gray-50 dark:bg-dark-700/40 p-2.5 rounded-lg text-center">
                      <span className="text-gray-500 block mb-1">Semi-Sk (F)</span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "semiSkilledFemale", -1)}
                          className="w-7 h-7 rounded bg-gray-200 dark:bg-dark-600 hover:bg-gray-300 flex items-center justify-center font-bold"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={entry.semiSkilledFemale}
                          onChange={(e) => updateCount(idx, "semiSkilledFemale", Number(e.target.value) - entry.semiSkilledFemale)}
                          className="w-10 text-center font-bold font-mono bg-transparent border-0 p-0 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "semiSkilledFemale", 1)}
                          className="w-7 h-7 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400 hover:bg-primary-200 flex items-center justify-center font-bold"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 5. Unskilled Male */}
                    <div className="bg-gray-50 dark:bg-dark-700/40 p-2.5 rounded-lg text-center">
                      <span className="text-gray-500 block mb-1">Helper (M)</span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "unskilledMale", -1)}
                          className="w-7 h-7 rounded bg-gray-200 dark:bg-dark-600 hover:bg-gray-300 flex items-center justify-center font-bold"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={entry.unskilledMale}
                          onChange={(e) => updateCount(idx, "unskilledMale", Number(e.target.value) - entry.unskilledMale)}
                          className="w-10 text-center font-bold font-mono bg-transparent border-0 p-0 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "unskilledMale", 1)}
                          className="w-7 h-7 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400 hover:bg-primary-200 flex items-center justify-center font-bold"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 6. Unskilled Female */}
                    <div className="bg-gray-50 dark:bg-dark-700/40 p-2.5 rounded-lg text-center">
                      <span className="text-gray-500 block mb-1">Helper (F)</span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "unskilledFemale", -1)}
                          className="w-7 h-7 rounded bg-gray-200 dark:bg-dark-600 hover:bg-gray-300 flex items-center justify-center font-bold"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={entry.unskilledFemale}
                          onChange={(e) => updateCount(idx, "unskilledFemale", Number(e.target.value) - entry.unskilledFemale)}
                          className="w-10 text-center font-bold font-mono bg-transparent border-0 p-0 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => updateCount(idx, "unskilledFemale", 1)}
                          className="w-7 h-7 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-400 hover:bg-primary-200 flex items-center justify-center font-bold"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 7. Supervisors & OT */}
                    <div className="bg-gray-50 dark:bg-dark-700/40 p-2 rounded-lg flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">Supv</span>
                        <input
                          type="number"
                          min="0"
                          value={entry.supervisors}
                          onChange={(e) => updateCount(idx, "supervisors", Number(e.target.value) - entry.supervisors)}
                          className="w-10 text-center font-bold font-mono bg-white dark:bg-dark-600 rounded p-1 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-amber-600 font-medium">OT hrs</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={entry.overtimeHours}
                          onChange={(e) => {
                            const copy = [...entries];
                            copy[idx]!.overtimeHours = Number(e.target.value) || 0;
                            setEntries(copy);
                          }}
                          className="w-12 text-center font-bold font-mono bg-white dark:bg-dark-600 rounded p-1 text-xs text-amber-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History / Previous Logs Table */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-5 shadow-sm">
          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-3">
            Muster Roll History Logs
          </h4>
          {historyLogs.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              No previous attendance records found for selected filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-dark-700/70 border-b border-gray-200 dark:border-dark-700 font-semibold text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Contractor</th>
                    <th className="p-2.5">Trade</th>
                    <th className="p-2.5 text-center">Skilled</th>
                    <th className="p-2.5 text-center">Semi-Skilled</th>
                    <th className="p-2.5 text-center">Unskilled</th>
                    <th className="p-2.5 text-center">Supv</th>
                    <th className="p-2.5 text-center font-bold">Total</th>
                    <th className="p-2.5 text-right">OT Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                  {historyLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-2.5 text-gray-500 font-mono">
                        {new Date(log.attendanceDate).toLocaleDateString("en-IN")} ({log.shift})
                      </td>
                      <td className="p-2.5 font-medium text-gray-900 dark:text-gray-100">
                        {log.contractorName || "Kings Builders Dept"}
                      </td>
                      <td className="p-2.5 text-gray-600 dark:text-gray-400">{log.tradeCategory}</td>
                      <td className="p-2.5 text-center font-mono">
                        {log.skilledMale + log.skilledFemale}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {log.semiSkilledMale + log.semiSkilledFemale}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {log.unskilledMale + log.unskilledFemale}
                      </td>
                      <td className="p-2.5 text-center font-mono">{log.supervisors}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-primary-600 dark:text-primary-400">
                        {log.totalWorkers}
                      </td>
                      <td className="p-2.5 text-right font-mono text-amber-600">
                        {Number(log.overtimeHours) > 0 ? `${log.overtimeHours}h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
