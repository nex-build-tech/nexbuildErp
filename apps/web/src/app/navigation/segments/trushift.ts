import { NavigationTree } from "@/@types/navigation";

const ROOT = "/trushift";

const path = (root: string, item: string) => `${root}${item}`;

export const trushiftAttendance: NavigationTree = {
  id: "trushiftAttendance",
  type: "root",
  title: "Trushift Attendance",
  icon: "trushiftAttendance",
  childs: [
    {
      id: "trushift.dashboard",
      path: path(ROOT, "/dashboard"),
      type: "item",
      title: "Attendance Command Center",
      transKey: "nav.trushift.dashboard",
      icon: "trushift.dashboard",
    },
    {
      id: "trushift.musterRoll",
      path: path(ROOT, "/muster-roll"),
      type: "item",
      title: "Monthly Muster Roll",
      transKey: "nav.trushift.musterRoll",
      icon: "trushift.musterRoll",
    },
    {
      id: "trushift.logs",
      path: path(ROOT, "/logs"),
      type: "item",
      title: "Geotagged Check-in Logs",
      transKey: "nav.trushift.logs",
      icon: "trushift.logs",
    },
    {
      id: "trushift.staff",
      path: path(ROOT, "/staff"),
      type: "item",
      title: "Staff & User Directory",
      transKey: "nav.trushift.staff",
      icon: "trushift.staff",
    },
    {
      id: "trushift.masters",
      path: path(ROOT, "/masters/shifts"),
      type: "collapse",
      title: "Attendance Masters",
      icon: "trushift.masters",
      childs: [
        {
          id: "trushift.masters.shifts",
          path: path(ROOT, "/masters/shifts"),
          type: "item",
          title: "Shift Timings & Rules",
          icon: "trushift.masters.shifts",
        },
        {
          id: "trushift.masters.holidays",
          path: path(ROOT, "/masters/holidays"),
          type: "item",
          title: "Holidays Calendar",
          icon: "trushift.masters.holidays",
        },
        {
          id: "trushift.masters.leaves",
          path: path(ROOT, "/masters/leaves"),
          type: "item",
          title: "Leave Types & Quotas",
          icon: "trushift.masters.leaves",
        },
        {
          id: "trushift.masters.geofence",
          path: path(ROOT, "/masters/geofence"),
          type: "item",
          title: "Site Geofence Settings",
          icon: "trushift.masters.geofence",
        },
      ],
    },
    {
      id: "trushift.analytics",
      path: path(ROOT, "/analytics"),
      type: "item",
      title: "Analytics & Wage Export",
      transKey: "nav.trushift.analytics",
      icon: "trushift.analytics",
    },
  ],
};
