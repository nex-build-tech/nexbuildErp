import { useState } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  ArrowDownTrayIcon,
  LockClosedIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

export default function TrushiftMusterRollPage() {
  const [selectedMonth, setSelectedMonth] = useState("November 2026");
  const [selectedSite, setSelectedSite] = useState("all");

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const mockStaffAttendance = [
    {
      id: "EMP-001",
      name: "Ramesh Sharma",
      role: "Site Supervisor",
      site: "Kings Nehru Nagar",
      p: 26,
      a: 1,
      l: 1,
      wo: 4,
      overtimeHrs: 14,
      payableDays: 29,
      attendance: [
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P", "P", "P", "HD", "P", "WO",
        "P", "P", "P", "A", "P", "P", "WO",
        "P", "P"
      ],
    },
    {
      id: "EMP-002",
      name: "Pooja Mehta",
      role: "Safety Officer",
      site: "Samarth Vikhroli",
      p: 25,
      a: 0,
      l: 2,
      wo: 4,
      overtimeHrs: 8,
      payableDays: 30,
      attendance: [
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P", "L", "L", "P", "P", "WO",
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P"
      ],
    },
    {
      id: "EMP-003",
      name: "Vikram Jadhav",
      role: "QC Engineer",
      site: "Kings Vikhroli",
      p: 24,
      a: 2,
      l: 1,
      wo: 4,
      overtimeHrs: 18,
      payableDays: 28,
      attendance: [
        "P", "P", "P", "P", "P", "A", "WO",
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P", "A", "P", "L", "P", "WO",
        "P", "P"
      ],
    },
    {
      id: "EMP-004",
      name: "Suresh Patil",
      role: "Billing Engineer",
      site: "Samarth Ghatkopar",
      p: 23,
      a: 3,
      l: 0,
      wo: 4,
      overtimeHrs: 4,
      payableDays: 27,
      attendance: [
        "P", "P", "P", "P", "P", "P", "WO",
        "A", "A", "P", "P", "P", "P", "WO",
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "A", "P", "P", "P", "P", "WO",
        "P", "P"
      ],
    },
    {
      id: "EMP-005",
      name: "Anita Deshmukh",
      role: "Store Keeper",
      site: "Kings Andheri",
      p: 26,
      a: 0,
      l: 0,
      wo: 4,
      overtimeHrs: 10,
      payableDays: 30,
      attendance: [
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P", "P", "P", "P", "P", "WO",
        "P", "P"
      ],
    },
  ];

  const getCellColor = (val: string) => {
    switch (val) {
      case "P":
        return "bg-emerald-50 text-emerald-700 font-bold dark:bg-emerald-950/40 dark:text-emerald-400";
      case "A":
        return "bg-rose-50 text-rose-700 font-bold dark:bg-rose-950/40 dark:text-rose-400";
      case "HD":
        return "bg-amber-50 text-amber-700 font-bold dark:bg-amber-950/40 dark:text-amber-400";
      case "L":
        return "bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/40 dark:text-blue-400";
      case "WO":
        return "bg-gray-100 text-gray-500 font-medium dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-white text-gray-600";
    }
  };

  return (
    <Page title="Trushift - Monthly Muster Roll">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Monthly Muster Roll Register
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400">
                Form IV (Labour Compliance)
              </Badge>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Statutory attendance register with daily punch status, payable days, and overtime calculation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlined" className="flex items-center gap-1.5 text-xs">
              <LockClosedIcon className="w-4 h-4 text-gray-500" />
              Lock Period
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Excel / CSV
            </Button>
          </div>
        </div>

        {/* Filters and Month Picker */}
        <Card className="p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 px-3 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="November 2026">November 2026</option>
                  <option value="October 2026">October 2026</option>
                  <option value="September 2026">September 2026</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <BuildingOffice2Icon className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 px-3 text-xs text-gray-700 dark:text-gray-300"
                >
                  <option value="all">All Sites (5 Active)</option>
                  <option value="SITE-KNN">Kings Nehru Nagar</option>
                  <option value="SITE-KVK">Kings Vikhroli</option>
                  <option value="SITE-SVK">Samarth Vikhroli</option>
                  <option value="SITE-SGK">Samarth Ghatkopar</option>
                  <option value="SITE-KAND">Kings Andheri</option>
                </select>
              </div>
            </div>

            {/* Attendance Code Legend */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">P: Present</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">A: Absent</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">HD: Half Day</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">L: Leave</span>
              <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">WO: Week Off</span>
            </div>
          </div>
        </Card>

        {/* Muster Roll Table */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-3 text-left sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 w-44">
                    Staff Name & Role
                  </th>
                  <th className="py-3 px-2 text-left w-28">Site</th>
                  {daysInMonth.map((day) => (
                    <th key={day} className="py-2 px-1 w-7 min-w-[28px] text-[11px]">
                      {day}
                    </th>
                  ))}
                  <th className="py-3 px-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                    P
                  </th>
                  <th className="py-3 px-2 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                    A
                  </th>
                  <th className="py-3 px-2 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                    L
                  </th>
                  <th className="py-3 px-2 bg-gray-50 dark:bg-gray-800/80">WO</th>
                  <th className="py-3 px-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 font-bold">
                    Payable
                  </th>
                  <th className="py-3 px-2 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">
                    OT Hrs
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {mockStaffAttendance.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="py-2 px-3 text-left font-semibold text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r border-gray-100 dark:border-gray-800">
                      <div>{row.name}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{row.role}</div>
                    </td>
                    <td className="py-2 px-2 text-left text-[11px] text-gray-600 dark:text-gray-400">
                      {row.site}
                    </td>
                    {row.attendance.map((val, idx) => (
                      <td
                        key={idx}
                        className={`py-1 px-0.5 border-r border-gray-100 dark:border-gray-800 text-[10px] ${getCellColor(
                          val
                        )}`}
                      >
                        {val}
                      </td>
                    ))}
                    <td className="py-2 px-2 font-bold text-emerald-600 bg-emerald-50/50">{row.p}</td>
                    <td className="py-2 px-2 font-bold text-rose-600 bg-rose-50/50">{row.a}</td>
                    <td className="py-2 px-2 font-bold text-blue-600 bg-blue-50/50">{row.l}</td>
                    <td className="py-2 px-2 text-gray-600 bg-gray-50/50">{row.wo}</td>
                    <td className="py-2 px-2 font-bold text-indigo-700 bg-indigo-50/50">{row.payableDays}</td>
                    <td className="py-2 px-2 font-semibold text-purple-700 bg-purple-50/50">{row.overtimeHrs}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Page>
  );
}
