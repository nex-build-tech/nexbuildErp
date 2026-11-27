import { useState } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function TrushiftHolidaysMasterPage() {
  const [selectedYear, setSelectedYear] = useState("2026");

  const holidays = [
    {
      id: 1,
      date: "2026-01-26",
      name: "Republic Day",
      type: "National Holiday",
      dayOfWeek: "Monday",
      applicableSites: "All Sites",
      status: "Mandatory Paid",
    },
    {
      id: 2,
      date: "2026-03-25",
      name: "Holi",
      type: "Festival Holiday",
      dayOfWeek: "Wednesday",
      applicableSites: "All Sites",
      status: "Mandatory Paid",
    },
    {
      id: 3,
      date: "2026-05-01",
      name: "Maharashtra Day / Labour Day",
      type: "State Holiday",
      dayOfWeek: "Friday",
      applicableSites: "All Mumbai Sites",
      status: "Mandatory Paid",
    },
    {
      id: 4,
      date: "2026-08-15",
      name: "Independence Day",
      type: "National Holiday",
      dayOfWeek: "Saturday",
      applicableSites: "All Sites",
      status: "Mandatory Paid",
    },
    {
      id: 5,
      date: "2026-10-02",
      name: "Gandhi Jayanti",
      type: "National Holiday",
      dayOfWeek: "Friday",
      applicableSites: "All Sites",
      status: "Mandatory Paid",
    },
    {
      id: 6,
      date: "2026-11-08",
      name: "Diwali (Laxmi Pujan)",
      type: "Festival Holiday",
      dayOfWeek: "Sunday",
      applicableSites: "All Sites",
      status: "Mandatory Paid",
    },
  ];

  return (
    <Page title="Trushift - Holidays Calendar Master">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Holidays Calendar
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400">
                FY 2026-27
              </Badge>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure statutory paid holidays, state holidays, and site-specific operational calendar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 px-3 text-xs font-semibold text-gray-900 dark:text-gray-100"
            >
              <option value="2026">Year 2026</option>
              <option value="2027">Year 2027</option>
            </select>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs">
              <PlusIcon className="w-4 h-4" />
              Add Holiday
            </Button>
          </div>
        </div>

        {/* Holidays Table */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Holiday Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Applicability</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{h.date}</td>
                    <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{h.dayOfWeek}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">{h.name}</td>
                    <td className="py-3 px-4">{h.type}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{h.applicableSites}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-emerald-100 text-emerald-800">{h.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="flat" className="text-gray-500 hover:text-indigo-600">
                        <PencilSquareIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="flat" className="text-gray-500 hover:text-rose-600">
                        <TrashIcon className="w-4 h-4" />
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
