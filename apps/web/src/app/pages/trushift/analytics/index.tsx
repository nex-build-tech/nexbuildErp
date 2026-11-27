import { useState } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function TrushiftAnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState("November 2026");

  const analyticsSummary = [
    {
      title: "Total Logged Work Hours",
      value: "31,840 hrs",
      subtitle: "+4.2% vs Last Month",
      icon: ClockIcon,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    },
    {
      title: "Approved Overtime",
      value: "1,248 hrs",
      subtitle: "₹1,87,200 Estimated Cost",
      icon: CurrencyRupeeIcon,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
    },
    {
      title: "Average Attendance Rate",
      value: "91.4%",
      subtitle: "Across all 5 construction sites",
      icon: ChartBarIcon,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    },
    {
      title: "Staff in Wage Register",
      value: "148 Staff",
      subtitle: "Ready for Payroll Processing",
      icon: UserGroupIcon,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
    },
  ];

  const payrollPreview = [
    {
      empId: "EMP-001",
      name: "Ramesh Sharma",
      role: "Site Supervisor",
      site: "Kings Nehru Nagar",
      baseMonthly: 45000,
      totalDays: 30,
      payableDays: 29,
      overtimeHrs: 14,
      overtimePay: 3937,
      latePenalty: 0,
      netPayable: 47437,
    },
    {
      id: "EMP-002",
      empId: "EMP-002",
      name: "Pooja Mehta",
      role: "Safety Officer",
      site: "Samarth Vikhroli",
      baseMonthly: 40000,
      totalDays: 30,
      payableDays: 30,
      overtimeHrs: 8,
      overtimePay: 2000,
      latePenalty: 0,
      netPayable: 42000,
    },
    {
      id: "EMP-003",
      empId: "EMP-003",
      name: "Vikram Jadhav",
      role: "QC Engineer",
      site: "Kings Vikhroli",
      baseMonthly: 38000,
      totalDays: 30,
      payableDays: 28,
      overtimeHrs: 18,
      overtimePay: 4275,
      latePenalty: 500,
      netPayable: 39241,
    },
    {
      id: "EMP-004",
      empId: "EMP-004",
      name: "Suresh Patil",
      role: "Billing Engineer",
      site: "Samarth Ghatkopar",
      baseMonthly: 42000,
      totalDays: 30,
      payableDays: 27,
      overtimeHrs: 4,
      overtimePay: 1050,
      latePenalty: 0,
      netPayable: 38850,
    },
    {
      id: "EMP-005",
      empId: "EMP-005",
      name: "Anita Deshmukh",
      role: "Store Keeper",
      site: "Kings Andheri",
      baseMonthly: 32000,
      totalDays: 30,
      payableDays: 30,
      overtimeHrs: 10,
      overtimePay: 2000,
      latePenalty: 0,
      netPayable: 34000,
    },
  ];

  return (
    <Page title="Trushift - Attendance & Wage Analytics">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Attendance & Wage Analytics
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400">
                Payroll Integration
              </Badge>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Calculate payable days, overtime remuneration, and export attendance records for ERP payroll processing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Payroll CSV
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsSummary.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <Card key={idx} className="p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {kpi.title}
                  </span>
                  <div className={`p-2 rounded-lg ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {kpi.value}
                </div>
                <div className="text-xs text-gray-500 mt-1">{kpi.subtitle}</div>
              </Card>
            );
          })}
        </div>

        {/* Wage Calculation Table */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Monthly Wage Calculation Summary ({selectedMonth})
              </h2>
              <p className="text-xs text-gray-500">
                Calculated on basis of valid geofenced punches, approved leaves, and overtime hours
              </p>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 px-3 text-xs font-semibold text-gray-900 dark:text-gray-100"
            >
              <option value="November 2026">November 2026</option>
              <option value="October 2026">October 2026</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Site Location</th>
                  <th className="py-3 px-4">Base Gross</th>
                  <th className="py-3 px-4 text-center">Month Days</th>
                  <th className="py-3 px-4 text-center">Payable Days</th>
                  <th className="py-3 px-4 text-center">OT Hours</th>
                  <th className="py-3 px-4">OT Pay (₹)</th>
                  <th className="py-3 px-4">Deductions (₹)</th>
                  <th className="py-3 px-4 font-bold text-indigo-700">Net Payable (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payrollPreview.map((p) => (
                  <tr key={p.empId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{p.empId} - {p.role}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{p.site}</td>
                    <td className="py-3 px-4 font-mono">₹{p.baseMonthly.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">{p.totalDays}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 bg-emerald-50/40">
                      {p.payableDays}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-purple-600">
                      {p.overtimeHrs}h
                    </td>
                    <td className="py-3 px-4 font-mono text-purple-700">+₹{p.overtimePay.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-rose-600">-₹{p.latePenalty.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30">
                      ₹{p.netPayable.toLocaleString()}
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
