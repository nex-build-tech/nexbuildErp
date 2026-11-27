import { useState } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  DevicePhoneMobileIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

export default function TrushiftLogsPage() {
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const punchLogs = [
    {
      id: "P-101",
      empId: "EMP-001",
      name: "Ramesh Sharma",
      role: "Site Supervisor",
      site: "Kings Nehru Nagar",
      siteCode: "SITE-KNN",
      date: "2026-11-27",
      time: "09:02 AM",
      type: "Check-in",
      method: "Mobile GPS + Selfie",
      latLng: "19.0625, 72.8842",
      distanceMeters: 14,
      geofenceLimit: 200,
      selfieVerified: true,
      valid: true,
    },
    {
      id: "P-102",
      empId: "EMP-002",
      name: "Pooja Mehta",
      role: "Safety Officer",
      site: "Samarth Vikhroli",
      siteCode: "SITE-SVK",
      date: "2026-11-27",
      time: "09:08 AM",
      type: "Check-in",
      method: "Mobile GPS + Selfie",
      latLng: "19.1097, 72.9252",
      distanceMeters: 32,
      geofenceLimit: 180,
      selfieVerified: true,
      valid: true,
    },
    {
      id: "P-103",
      empId: "EMP-003",
      name: "Vikram Jadhav",
      role: "QC Engineer",
      site: "Kings Vikhroli",
      siteCode: "SITE-KVK",
      date: "2026-11-27",
      time: "09:14 AM",
      type: "Check-in",
      method: "Mobile GPS + Selfie",
      latLng: "19.1113, 72.9286",
      distanceMeters: 45,
      geofenceLimit: 250,
      selfieVerified: true,
      valid: true,
    },
    {
      id: "P-104",
      empId: "EMP-004",
      name: "Suresh Patil",
      role: "Billing Engineer",
      site: "Samarth Ghatkopar",
      siteCode: "SITE-SGK",
      date: "2026-11-27",
      time: "09:28 AM",
      type: "Check-in",
      method: "Mobile GPS + Selfie",
      latLng: "19.0896, 72.9112",
      distanceMeters: 350,
      geofenceLimit: 200,
      selfieVerified: true,
      valid: false,
    },
    {
      id: "P-105",
      empId: "EMP-005",
      name: "Anita Deshmukh",
      role: "Store Keeper",
      site: "Kings Andheri",
      siteCode: "SITE-KAND",
      date: "2026-11-27",
      time: "09:31 AM",
      type: "Check-in",
      method: "Face Biometric",
      latLng: "19.1197, 72.8464",
      distanceMeters: 8,
      geofenceLimit: 300,
      selfieVerified: true,
      valid: true,
    },
  ];

  const filteredLogs = punchLogs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      log.name.toLowerCase().includes(q) ||
      log.empId.toLowerCase().includes(q) ||
      log.id.toLowerCase().includes(q) ||
      log.role.toLowerCase().includes(q);
    const matchesSite =
      selectedSite === "all" ||
      log.site.toLowerCase().includes(selectedSite.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "valid" && log.valid) ||
      (selectedStatus === "breach" && !log.valid);
    return matchesSearch && matchesSite && matchesStatus;
  });

  const verifiedCount = punchLogs.filter((l) => l.valid).length;
  const breachCount = punchLogs.filter((l) => !l.valid).length;

  return (
    <Page title="Trushift - Geotagged Check-in Logs">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Geotagged Check-in Logs
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                Live GPS & Selfie Audit
              </Badge>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Audit employee GPS coordinates, site radius distance checks, and selfie verification logs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlined" className="flex items-center gap-1.5 text-xs">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Audit CSV
            </Button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Total Punches Logged
              </span>
              <div className="p-2 rounded-lg text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30">
                <ClockIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {punchLogs.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Today&apos;s shift check-ins</div>
          </Card>

          <Card className="p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Inside Geofence
              </span>
              <div className="p-2 rounded-lg text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {verifiedCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">GPS + selfie verified</div>
          </Card>

          <Card className="p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Geofence Exceptions
              </span>
              <div className="p-2 rounded-lg text-rose-600 bg-rose-50 dark:bg-rose-900/30">
                <XCircleIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {breachCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">Outside site boundary radius</div>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by staff name, punch ID, EMP ID..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <BuildingOffice2Icon className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 px-3 text-xs text-gray-700 dark:text-gray-300"
              >
                <option value="all">All Sites</option>
                <option value="Nehru Nagar">Kings Nehru Nagar</option>
                <option value="Kings Vikhroli">Kings Vikhroli</option>
                <option value="Samarth Vikhroli">Samarth Vikhroli</option>
                <option value="Ghatkopar">Samarth Ghatkopar</option>
                <option value="Andheri">Kings Andheri</option>
              </select>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 px-3 text-xs text-gray-700 dark:text-gray-300"
            >
              <option value="all">All Statuses</option>
              <option value="valid">Verified Only</option>
              <option value="breach">Geofence Breach</option>
            </select>
          </div>
        </Card>

        {/* Punch Logs Table */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Punch ID</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">GPS Coordinates</th>
                  <th className="py-3 px-4">Distance Check</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      No check-in logs match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-mono text-gray-500">{log.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {log.name}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {log.empId} • {log.role}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {log.site}
                        </div>
                        <div className="text-[11px] font-mono text-gray-500">{log.siteCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-indigo-600 font-medium">{log.time}</div>
                        <div className="text-[11px] text-gray-500">
                          {log.date} • {log.type}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5">
                          <DevicePhoneMobileIcon className="w-4 h-4 text-gray-400" />
                          {log.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                          {log.latLng}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {log.valid
                          ? `Inside (${log.distanceMeters}m / ${log.geofenceLimit}m)`
                          : `Outside (+${log.distanceMeters}m / ${log.geofenceLimit}m)`}
                      </td>
                      <td className="py-3 px-4">
                        {log.valid ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                            Verified Check-in
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400">
                            Geofence Breach
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Page>
  );
}
