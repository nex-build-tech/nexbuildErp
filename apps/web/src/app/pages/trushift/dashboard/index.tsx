import { Link } from "react-router";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  ArrowRightIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

export default function TrushiftDashboardPage() {

  const kpis = [
    {
      title: "Total Registered Staff",
      value: "148",
      subtitle: "Across 5 Active Sites",
      icon: UserGroupIcon,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    },
    {
      title: "Present Today",
      value: "132",
      subtitle: "89.2% Turnout Rate",
      icon: CheckCircleIcon,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    },
    {
      title: "Geofence Verified",
      value: "98.4%",
      subtitle: "130/132 Inside Site Radius",
      icon: MapPinIcon,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
    },
    {
      title: "Late Arrivals (>15m)",
      value: "9",
      subtitle: "Grace period exceeded",
      icon: ClockIcon,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    },
    {
      title: "Absent / On Leave",
      value: "16",
      subtitle: "11 Approved Leaves, 5 Unplanned",
      icon: XCircleIcon,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-900/30",
    },
  ];

  const siteAttendance = [
    {
      name: "Kings Nehru Nagar",
      company: "Kings Crown",
      code: "SITE-KNN",
      present: 38,
      total: 42,
      geofence: "200m Active",
      latLng: "19.0624, 72.8841",
      turnout: 90,
    },
    {
      name: "Kings Vikhroli",
      company: "Kings Crown",
      code: "SITE-KVK",
      present: 31,
      total: 35,
      geofence: "250m Active",
      latLng: "19.1110, 72.9284",
      turnout: 88,
    },
    {
      name: "Samarth Vikhroli",
      company: "Samarth Group",
      code: "SITE-SVK",
      present: 27,
      total: 29,
      geofence: "180m Active",
      latLng: "19.1095, 72.9250",
      turnout: 93,
    },
    {
      name: "Samarth Ghatkopar",
      company: "Samarth Group",
      code: "SITE-SGK",
      present: 22,
      total: 25,
      geofence: "200m Active",
      latLng: "19.0864, 72.9089",
      turnout: 88,
    },
    {
      name: "Kings Andheri",
      company: "Kings Builders",
      code: "SITE-KAND",
      present: 14,
      total: 17,
      geofence: "300m Active",
      latLng: "19.1197, 72.8464",
      turnout: 82,
    },
  ];

  const recentPunches = [
    {
      id: "P-101",
      name: "Ramesh Sharma",
      role: "Site Supervisor",
      site: "Kings Nehru Nagar",
      time: "09:02 AM",
      type: "Check-in",
      method: "Mobile GPS",
      geofenceStatus: "Inside (14m from center)",
      valid: true,
    },
    {
      id: "P-102",
      name: "Pooja Mehta",
      role: "Safety Officer",
      site: "Samarth Vikhroli",
      time: "09:08 AM",
      type: "Check-in",
      method: "Mobile GPS",
      geofenceStatus: "Inside (32m from center)",
      valid: true,
    },
    {
      id: "P-103",
      name: "Vikram Jadhav",
      role: "QC Engineer",
      site: "Kings Vikhroli",
      time: "09:14 AM",
      type: "Check-in",
      method: "Mobile GPS",
      geofenceStatus: "Inside (45m from center)",
      valid: true,
    },
    {
      id: "P-104",
      name: "Suresh Patil",
      role: "Billing Engineer",
      site: "Samarth Ghatkopar",
      time: "09:28 AM",
      type: "Check-in",
      method: "Mobile GPS",
      geofenceStatus: "Outside (+350m breach)",
      valid: false,
    },
    {
      id: "P-105",
      name: "Anita Deshmukh",
      role: "Store Keeper",
      site: "Kings Andheri",
      time: "09:31 AM",
      type: "Check-in",
      method: "Face Biometric",
      geofenceStatus: "Inside (Terminal #2)",
      valid: true,
    },
  ];

  return (
    <Page title="Trushift - Attendance Command Center">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-sm">
                TS
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  Trushift Attendance
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                    Live Geofenced
                  </Badge>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time workforce monitoring, GPS geofenced check-ins, and muster roll analytics
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlined" className="flex items-center gap-1.5 text-xs">
              <ArrowPathIcon className="w-4 h-4" />
              Refresh Feed
            </Button>
            <Link to="/trushift/muster-roll">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs">
                Muster Roll Register
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi, idx) => {
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

        {/* Middle Section: Site-wise Distribution & Real-time Live Punches */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Site-wise attendance breakdown */}
          <Card className="lg:col-span-2 p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BuildingOffice2Icon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Site-wise Attendance & Geofence Status
                </h2>
              </div>
              <span className="text-xs text-gray-500">Today's Turnout</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {siteAttendance.map((site, index) => (
                <div key={index} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {site.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono">
                        {site.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{site.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {site.geofence} ({site.latLng})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-36">
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-gray-700 dark:text-gray-300">
                          {site.present} / {site.total}
                        </span>
                        <span className="text-indigo-600 font-bold">{site.turnout}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${site.turnout}%` }}
                        />
                      </div>
                    </div>
                    <Link to="/trushift/logs">
                      <Button variant="flat" className="text-xs text-indigo-600 hover:text-indigo-800">
                        Logs
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Access Navigation Panel */}
          <Card className="p-5 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Attendance Modules
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Configure Trushift shifts, site geofences, and monthly payroll registers.
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    title: "Monthly Muster Roll",
                    desc: "Full monthly register & Excel export",
                    link: "/trushift/muster-roll",
                  },
                  {
                    title: "Geotagged Check-in Logs",
                    desc: "Live GPS coordinates & selfie audit",
                    link: "/trushift/logs",
                  },
                  {
                    title: "Staff & User Directory",
                    desc: "Employee shift and site assignments",
                    link: "/trushift/staff",
                  },
                  {
                    title: "Shift Timings & Rules",
                    desc: "Grace period, half-day, in/out slots",
                    link: "/trushift/masters/shifts",
                  },
                  {
                    title: "Site Geofence Settings",
                    desc: "GPS coordinates & radius mapping",
                    link: "/trushift/masters/geofence",
                  },
                  {
                    title: "Wage & Overtime Analytics",
                    desc: "Work hours, late penalties, overtime",
                    link: "/trushift/analytics",
                  },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.link}
                    className="block p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                        {item.title}
                      </div>
                      <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{item.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Live Punches Feed */}
        <Card className="p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Live Geotagged Punches Feed
              </h2>
              <p className="text-xs text-gray-500">
                Real-time stream of check-ins captured with GPS coordinates and geofence verification
              </p>
            </div>
            <Link to="/trushift/logs">
              <Button variant="outlined" className="text-xs">
                View All Punch Logs
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Punch ID</th>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Role / Designation</th>
                  <th className="py-2.5 px-4">Site</th>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Device Method</th>
                  <th className="py-2.5 px-4">Geofence Status</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentPunches.map((punch) => (
                  <tr key={punch.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-mono text-gray-500">{punch.id}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                      {punch.name}
                    </td>
                    <td className="py-3 px-4">{punch.role}</td>
                    <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      {punch.site}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-600">{punch.time}</td>
                    <td className="py-3 px-4 flex items-center gap-1.5">
                      <DevicePhoneMobileIcon className="w-4 h-4 text-gray-400" />
                      {punch.method}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{punch.geofenceStatus}</td>
                    <td className="py-3 px-4">
                      {punch.valid ? (
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
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Page>
  );
}
