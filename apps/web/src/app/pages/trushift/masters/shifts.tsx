import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  ClockIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function TrushiftShiftsMasterPage() {
  const shifts = [
    {
      id: 1,
      code: "GEN",
      name: "General Shift",
      startTime: "09:00",
      endTime: "18:00",
      gracePeriodMins: 15,
      halfDayAfterMins: 120,
      minWorkHoursFullDay: 8.0,
      activeStaffCount: 112,
      isDefault: true,
      status: "Active",
    },
    {
      id: 2,
      code: "MORN",
      name: "Morning Early Shift",
      startTime: "07:00",
      endTime: "16:00",
      gracePeriodMins: 10,
      halfDayAfterMins: 120,
      minWorkHoursFullDay: 8.0,
      activeStaffCount: 24,
      isDefault: false,
      status: "Active",
    },
    {
      id: 3,
      code: "NIGHT",
      name: "Night Concrete Pouring Shift",
      startTime: "21:00",
      endTime: "06:00",
      gracePeriodMins: 15,
      halfDayAfterMins: 120,
      minWorkHoursFullDay: 8.0,
      activeStaffCount: 12,
      isDefault: false,
      status: "Active",
    },
  ];

  return (
    <Page title="Trushift - Shift Timings & Rules Master">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Shift Timings & Rules
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400">
                Shift Master
              </Badge>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Define operational work shifts, in/out tolerances, grace period buffers, and half-day thresholds
            </p>
          </div>
          <div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs">
              <PlusIcon className="w-4 h-4" />
              Add Work Shift
            </Button>
          </div>
        </div>

        {/* Shift Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shifts.map((shift) => (
            <Card key={shift.id} className="p-5 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-900/40 dark:text-indigo-300">
                      {shift.code}
                    </span>
                    {shift.isDefault && (
                      <Badge className="bg-blue-100 text-blue-800 text-[10px]">Default</Badge>
                    )}
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">{shift.status}</Badge>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{shift.name}</h3>

                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-gray-500 uppercase font-semibold">Shift Timing</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1 mt-0.5">
                      <ClockIcon className="w-4 h-4 text-indigo-600" />
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-gray-500 uppercase font-semibold">Full Day Target</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                      {shift.minWorkHoursFullDay} Hours
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Grace Period Allowed:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {shift.gracePeriodMins} Minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Half-Day Threshold:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Late by &gt; {shift.halfDayAfterMins} Mins
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Employees:</span>
                    <span className="font-bold text-indigo-600">{shift.activeStaffCount} Staff</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                <Button variant="flat" className="text-xs text-gray-600">
                  <PencilSquareIcon className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="flat" className="text-xs text-rose-600">
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );
}
