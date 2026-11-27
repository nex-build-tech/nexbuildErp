import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function TrushiftLeavesMasterPage() {
  const leaveTypes = [
    {
      id: 1,
      code: "CL",
      name: "Casual Leave",
      annualQuota: 12,
      carryForwardMax: 0,
      paidStatus: "Paid",
      minNoticeDays: 2,
      requiresApproval: true,
      encashable: false,
    },
    {
      id: 2,
      code: "SL",
      name: "Sick Leave / Medical Leave",
      annualQuota: 10,
      carryForwardMax: 5,
      paidStatus: "Paid",
      minNoticeDays: 0,
      requiresApproval: true,
      encashable: false,
    },
    {
      id: 3,
      code: "PL",
      name: "Privilege Leave / Earned Leave",
      annualQuota: 18,
      carryForwardMax: 30,
      paidStatus: "Paid",
      minNoticeDays: 14,
      requiresApproval: true,
      encashable: true,
    },
    {
      id: 4,
      code: "CO",
      name: "Compensatory Off (Comp-off)",
      annualQuota: 0,
      carryForwardMax: 60,
      paidStatus: "Paid",
      minNoticeDays: 1,
      requiresApproval: true,
      encashable: false,
    },
    {
      id: 5,
      code: "LWP",
      name: "Leave Without Pay",
      annualQuota: 99,
      carryForwardMax: 0,
      paidStatus: "Unpaid",
      minNoticeDays: 3,
      requiresApproval: true,
      encashable: false,
    },
  ];

  return (
    <Page title="Trushift - Leave Types & Quotas Master">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Leave Types & Quotas Master
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400">
                Policy Rules
              </Badge>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure annual leave quotas, encashment policies, carry-forward limits, and approval workflows
            </p>
          </div>
          <div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs">
              <PlusIcon className="w-4 h-4" />
              Add Leave Type
            </Button>
          </div>
        </div>

        {/* Leaves Table */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Leave Name</th>
                  <th className="py-3 px-4">Annual Quota</th>
                  <th className="py-3 px-4">Carry Forward Max</th>
                  <th className="py-3 px-4">Paid / Unpaid</th>
                  <th className="py-3 px-4">Notice Required</th>
                  <th className="py-3 px-4">Encashable</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {leaveTypes.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{leave.code}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">{leave.name}</td>
                    <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">
                      {leave.annualQuota ? `${leave.annualQuota} Days/Yr` : "On Earn Basis"}
                    </td>
                    <td className="py-3 px-4">{leave.carryForwardMax ? `${leave.carryForwardMax} Days` : "Lapses"}</td>
                    <td className="py-3 px-4">
                      <Badge className={leave.paidStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                        {leave.paidStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{leave.minNoticeDays} Day(s)</td>
                    <td className="py-3 px-4 font-medium">
                      {leave.encashable ? (
                        <span className="text-emerald-600 font-semibold">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
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
