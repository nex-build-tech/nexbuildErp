import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import axios from "@/utils/axios";
import {
  MapPinIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function TrushiftGeofenceMasterPage() {
  const [sites, setSites] = useState<any[]>([]);

  const defaultSites = [
    {
      id: 1,
      name: "Kings Nehru Nagar",
      code: "SITE-KNN",
      companyName: "Kings Crown",
      latitude: 19.0624000,
      longitude: 72.8841000,
      geofenceRadius: 200,
      status: "active",
      enforceStrict: true,
      activeStaffCount: 42,
    },
    {
      id: 2,
      name: "Kings Vikhroli",
      code: "SITE-KVK",
      companyName: "Kings Crown",
      latitude: 19.1110000,
      longitude: 72.9284000,
      geofenceRadius: 250,
      status: "active",
      enforceStrict: true,
      activeStaffCount: 35,
    },
    {
      id: 3,
      name: "Samarth Vikhroli",
      code: "SITE-SVK",
      companyName: "Samarth Group",
      latitude: 19.1095000,
      longitude: 72.9250000,
      geofenceRadius: 180,
      status: "active",
      enforceStrict: true,
      activeStaffCount: 29,
    },
    {
      id: 4,
      name: "Samarth Ghatkopar",
      code: "SITE-SGK",
      companyName: "Samarth Group",
      latitude: 19.0864000,
      longitude: 72.9089000,
      geofenceRadius: 200,
      status: "active",
      enforceStrict: true,
      activeStaffCount: 25,
    },
    {
      id: 5,
      name: "Kings Andheri",
      code: "SITE-KAND",
      companyName: "Kings Builders",
      latitude: 19.1197000,
      longitude: 72.8464000,
      geofenceRadius: 300,
      status: "active",
      enforceStrict: true,
      activeStaffCount: 17,
    },
  ];

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await axios.get("/masters/sites");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSites(res.data);
      } else {
        setSites(defaultSites);
      }
    } catch {
      setSites(defaultSites);
    }
  };

  return (
    <Page title="Trushift - Site Geofence Settings">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Site Geofence Settings
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                GPS Geofence Policy
              </Badge>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure GPS coordinates, active boundary radii (meters), and mobile attendance enforcement per site
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlined" onClick={fetchSites} className="flex items-center gap-1.5 text-xs">
              <ArrowPathIcon className="w-4 h-4" />
              Refresh Sites
            </Button>
            <Link to="/masters/sites">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs">
                <BuildingOffice2Icon className="w-4 h-4" />
                Manage Sites & Coordinates
              </Button>
            </Link>
          </div>
        </div>

        {/* Geofence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <Card key={site.id} className="p-5 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold">
                    {site.code}
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    {site.status === "inactive" ? "Inactive" : "Active Geofence"}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{site.name}</h3>
                <div className="text-xs text-indigo-600 font-medium mt-0.5">
                  Parent Company: {site.companyName || "Kings Crown"}
                </div>

                <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg space-y-2 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5 text-indigo-600" />
                      GPS Center:
                    </span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {site.latitude ? `${Number(site.latitude).toFixed(5)}, ${Number(site.longitude).toFixed(5)}` : "Not Configured"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Allowed Radius:</span>
                    <span className="font-bold text-indigo-600">
                      {site.geofenceRadius || 200} Meters
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Strict Check:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheckIcon className="w-4 h-4" /> Reject Outside
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                {site.latitude && site.longitude ? (
                  <a
                    href={`https://www.google.com/maps?q=${site.latitude},${site.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Google Maps Pin
                    <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">No GPS set</span>
                )}
                <Link to="/masters/sites">
                  <Button variant="flat" className="text-xs text-indigo-600">
                    <PencilSquareIcon className="w-3.5 h-3.5 mr-1" /> Edit Site
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );
}
