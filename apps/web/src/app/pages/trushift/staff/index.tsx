import { useState } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  PencilSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function TrushiftStaffPage() {
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState("all");

  const staffList = [
    {
      id: "EMP-001",
      name: "Ramesh Sharma",
      email: "ramesh.sharma@kingsgroup.com",
      phone: "+91 98201 12345",
      dept: "Site Operations",
      role: "Site Supervisor",
      site: "Kings Nehru Nagar",
      company: "Kings Crown",
      shift: "General Shift (09:00 - 18:00)",
      geofenceEnforced: true,
      appActive: true,
      status: "Active",
    },
    {
      id: "EMP-002",
      name: "Pooja Mehta",
      email: "pooja.mehta@kingsgroup.com",
      phone: "+91 98202 23456",
      dept: "EHS & Safety",
      role: "Safety Officer",
      site: "Samarth Vikhroli",
      company: "Samarth Group",
      shift: "General Shift (09:00 - 18:00)",
      geofenceEnforced: true,
      appActive: true,
      status: "Active",
    },
    {
      id: "EMP-003",
      name: "Vikram Jadhav",
      email: "vikram.jadhav@kingsgroup.com",
      phone: "+91 98203 34567",
      dept: "Quality Assurance",
      role: "QC Engineer",
      site: "Kings Vikhroli",
      company: "Kings Crown",
      shift: "General Shift (09:00 - 18:00)",
      geofenceEnforced: true,
      appActive: true,
      status: "Active",
    },
    {
      id: "EMP-004",
      name: "Suresh Patil",
      email: "suresh.patil@kingsgroup.com",
      phone: "+91 98204 45678",
      dept: "Billing & Contracts",
      role: "Billing Engineer",
      site: "Samarth Ghatkopar",
      company: "Samarth Group",
      shift: "General Shift (09:00 - 18:00)",
      geofenceEnforced: true,
      appActive: true,
      status: "Active",
    },
    {
      id: "EMP-005",
      name: "Anita Deshmukh",
      email: "anita.deshmukh@kingsgroup.com",
      phone: "+91 98205 56789",
      dept: "Stores & Inventory",
      role: "Store Keeper",
      site: "Kings Andheri",
      company: "Kings Builders",
      shift: "Morning Shift (08:00 - 17:00)",
      geofenceEnforced: true,
      appActive: true,
      status: "Active",
    },
  ];

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase());
    const matchesSite =
      selectedSite === "all" || s.site.toLowerCase().includes(selectedSite.toLowerCase());
    return matchesSearch && matchesSite;
  });

  return (
    <Page title="Trushift - Staff & User Directory">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Staff & User Directory
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400">
                148 Enrolled
              </Badge>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage employees, base site assignment, shift allocation, and GPS mobile app access
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs">
              <UserPlusIcon className="w-4 h-4" />
              Onboard New Staff
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, EMP ID, or designation..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BuildingOffice2Icon className="w-5 h-5 text-gray-400" />
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
        </Card>

        {/* Staff Table */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Base Site & Company</th>
                  <th className="py-3 px-4">Assigned Shift</th>
                  <th className="py-3 px-4">GPS Geofence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{staff.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{staff.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{staff.email}</div>
                      <div className="text-[11px] text-gray-500">{staff.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{staff.role}</div>
                      <div className="text-[11px] text-gray-500">{staff.dept}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{staff.site}</div>
                      <div className="text-[11px] text-indigo-600 font-medium">{staff.company}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      {staff.shift}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                        <CheckCircleIcon className="w-4 h-4" />
                        Strict Geofence
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                        {staff.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="flat" className="text-gray-600 hover:text-indigo-600">
                        <PencilSquareIcon className="w-4 h-4" />
                      </Button>
                    </td>
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
