import { useState, useEffect } from "react";
import axios from "axios";
import { Page } from "@/components/shared/Page";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  CalendarDaysIcon,
  PlusIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  CloudIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";

export default function DailyProgressReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [reportToApprove, setReportToApprove] = useState<number | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>("");

  // Create Form State
  const [formData, setFormData] = useState({
    siteId: "1",
    reportDate: new Date().toISOString().slice(0, 10),
    shift: "Day",
    weather: "Clear / Sunny",
    temperature: "32°C",
    generalProgress: "",
    delaysIssues: "",
    safetyNotes: "",
    items: [
      { activityName: "", locationRef: "", uom: "CU.M", plannedQty: "0", completedQty: "0", remarks: "" },
    ],
    equipments: [
      { equipmentName: "", runningHours: "0", idleHours: "0", breakdownHours: "0", status: "working", remarks: "" },
    ],
    photos: [] as Array<{ photoUrl: string; caption: string; activityTag: string }>,
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoTag, setNewPhotoTag] = useState("");

  useEffect(() => {
    fetchSites();
    fetchReports();
  }, [selectedSiteFilter]);

  const fetchSites = async () => {
    try {
      const res = await axios.get("/masters/sites");
      setSites(res.data?.data || []);
    } catch {
      // ignore
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedSiteFilter) params.siteId = selectedSiteFilter;
      const res = await axios.get("/dpr", { params });
      setReports(res.data?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const viewReportDetail = async (id: number) => {
    try {
      const res = await axios.get(`/dpr/${id}`);
      setSelectedReport(res.data?.data || null);
      setDetailModalOpen(true);
    } catch {
      alert("Failed to load DPR details");
    }
  };

  const handleApprove = async () => {
    if (!reportToApprove) return;
    try {
      await axios.patch(`/dpr/${reportToApprove}/status`, { status: "approved" });
      setConfirmApproveOpen(false);
      setReportToApprove(null);
      if (selectedReport && selectedReport.id === reportToApprove) {
        setSelectedReport({ ...selectedReport, status: "approved" });
      }
      fetchReports();
    } catch {
      alert("Failed to approve DPR");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.generalProgress.trim()) {
      alert("Please provide general progress description");
      return;
    }

    try {
      await axios.post("/dpr", {
        siteId: Number(formData.siteId),
        reportDate: formData.reportDate,
        shift: formData.shift,
        weather: formData.weather,
        temperature: formData.temperature,
        generalProgress: formData.generalProgress,
        delaysIssues: formData.delaysIssues,
        safetyNotes: formData.safetyNotes,
        status: "submitted",
        items: formData.items.filter((i) => i.activityName.trim() !== ""),
        equipments: formData.equipments.filter((e) => e.equipmentName.trim() !== ""),
        photos: formData.photos,
      });

      setCreateDrawerOpen(false);
      // Reset form
      setFormData({
        siteId: sites[0]?.id ? String(sites[0].id) : "1",
        reportDate: new Date().toISOString().slice(0, 10),
        shift: "Day",
        weather: "Clear / Sunny",
        temperature: "32°C",
        generalProgress: "",
        delaysIssues: "",
        safetyNotes: "",
        items: [{ activityName: "", locationRef: "", uom: "CU.M", plannedQty: "0", completedQty: "0", remarks: "" }],
        equipments: [{ equipmentName: "", runningHours: "0", idleHours: "0", breakdownHours: "0", status: "working", remarks: "" }],
        photos: [],
      });
      fetchReports();
    } catch {
      alert("Failed to submit DPR. Please check all required fields.");
    }
  };

  const addPhotoToForm = () => {
    if (!newPhotoUrl.trim()) return;
    setFormData({
      ...formData,
      photos: [
        ...formData.photos,
        {
          photoUrl: newPhotoUrl,
          caption: newPhotoCaption || "Site Photo",
          activityTag: newPhotoTag || "Progress",
        },
      ],
    });
    setNewPhotoUrl("");
    setNewPhotoCaption("");
    setNewPhotoTag("");
  };

  const addWorkItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { activityName: "", locationRef: "", uom: "SQ.M", plannedQty: "0", completedQty: "0", remarks: "" },
      ],
    });
  };

  const addEquipmentRow = () => {
    setFormData({
      ...formData,
      equipments: [
        ...formData.equipments,
        { equipmentName: "", runningHours: "0", idleHours: "0", breakdownHours: "0", status: "working", remarks: "" },
      ],
    });
  };

  return (
    <Page title="Daily Progress Reports (DPR)">
      <div className="flex flex-col gap-6">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-lg">
              <CalendarDaysIcon className="w-6 h-6" />
              <span>Site Progress Log</span>
            </div>
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 px-3 py-1.5 focus:ring-primary-500"
            >
              <option value="">All Project Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            <button
              onClick={fetchReports}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setCreateDrawerOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Daily Report</span>
          </button>
        </div>

        {/* DPR Reports List */}
        {loading ? (
          <TableSkeleton rows={4} columns={5} />
        ) : reports.length === 0 ? (
          <EmptyState
            title="No Daily Progress Reports Recorded"
            description="Site engineers record daily activities, photos, weather conditions, and machinery logs."
            actionText="Create First DPR"
            onAction={() => setCreateDrawerOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.map((dpr) => (
              <div
                key={dpr.id}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded">
                        {dpr.reportNumber}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-1 line-clamp-1">
                        {dpr.siteName}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        dpr.status === "approved"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                          : dpr.status === "submitted"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {dpr.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Weather & Date Meta */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 pb-3 border-b border-gray-100 dark:border-dark-700">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {new Date(dpr.reportDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CloudIcon className="w-3.5 h-3.5" />
                      {dpr.weather} ({dpr.temperature || "30°C"})
                    </span>
                    <span>•</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {dpr.shift} Shift
                    </span>
                  </div>

                  {/* Narrative snippet */}
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 italic">
                    "{dpr.generalProgress || "Site execution proceeding as scheduled."}"
                  </p>

                  {/* Stats Pill */}
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-dark-700/50 p-2.5 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <WrenchScrewdriverIcon className="w-4 h-4 text-primary-500" />
                      <span>{dpr.itemCount} Activities</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PhotoIcon className="w-4 h-4 text-amber-500" />
                      <span>{dpr.photoCount} Site Photos</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
                  <span className="text-[11px] text-gray-400">
                    By {dpr.createdByName || "Site Engineer"}
                  </span>
                  <div className="flex items-center gap-2">
                    {dpr.status !== "approved" && (
                      <button
                        onClick={() => {
                          setReportToApprove(dpr.id);
                          setConfirmApproveOpen(true);
                        }}
                        className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-950/30"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => viewReportDetail(dpr.id)}
                      className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 px-3 py-1.5 rounded-lg transition"
                    >
                      <EyeIcon className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Detail Modal */}
        {detailModalOpen && selectedReport && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-dark-700">
              <div className="sticky top-0 bg-white dark:bg-dark-800 p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">
                      {selectedReport.reportNumber}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        selectedReport.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {selectedReport.status.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {selectedReport.siteName}
                  </h2>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-sm">
                {/* Meta details banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-dark-700/50 p-3.5 rounded-xl text-xs">
                  <div>
                    <span className="text-gray-400">Report Date:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {new Date(selectedReport.reportDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Shift:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedReport.shift}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Weather:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedReport.weather} ({selectedReport.temperature || "30°C"})
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Engineer:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedReport.createdByName || "Site Engineer"}
                    </p>
                  </div>
                </div>

                {/* General Progress Narrative */}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-1.5">
                    <DocumentArrowUpIcon className="w-4 h-4 text-primary-500" />
                    General Execution Narrative
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-dark-700/30 p-3.5 rounded-xl border border-gray-100 dark:border-dark-700">
                    {selectedReport.generalProgress}
                  </p>
                </div>

                {/* Delays / Issues / Safety */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3.5 rounded-xl">
                    <h5 className="font-bold text-amber-800 dark:text-amber-400 mb-1">
                      ⚠️ Constraints & Delays
                    </h5>
                    <p className="text-amber-900 dark:text-amber-300">
                      {selectedReport.delaysIssues || "None recorded. Normal operations."}
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3.5 rounded-xl">
                    <h5 className="font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                      🛡️ Safety Briefing & Toolbox Talk
                    </h5>
                    <p className="text-emerald-900 dark:text-emerald-300">
                      {selectedReport.safetyNotes || "Full PPE compliance verified."}
                    </p>
                  </div>
                </div>

                {/* Executed Work Items Table */}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                    <WrenchScrewdriverIcon className="w-4 h-4 text-primary-500" />
                    Executed Work Packages
                  </h4>
                  <div className="border border-gray-200 dark:border-dark-700 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-dark-700/70 border-b border-gray-200 dark:border-dark-700 font-semibold text-gray-600 dark:text-gray-300">
                        <tr>
                          <th className="p-2.5">Activity</th>
                          <th className="p-2.5">Location / Floor</th>
                          <th className="p-2.5 text-right">Planned</th>
                          <th className="p-2.5 text-right">Executed</th>
                          <th className="p-2.5 text-center">Achieved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                        {selectedReport.items?.map((it: any) => {
                          const planned = Number(it.plannedQty) || 0;
                          const completed = Number(it.completedQty) || 0;
                          const pct = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 100;
                          return (
                            <tr key={it.id}>
                              <td className="p-2.5 font-medium text-gray-900 dark:text-gray-100">
                                {it.activityName}
                              </td>
                              <td className="p-2.5 text-gray-600 dark:text-gray-400">{it.locationRef}</td>
                              <td className="p-2.5 text-right font-mono text-gray-500">
                                {it.plannedQty} {it.uom}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-primary-600 dark:text-primary-400">
                                {it.completedQty} {it.uom}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="inline-block w-12 text-center text-[11px] font-bold py-0.5 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                                  {pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Equipment Deployment */}
                {selectedReport.equipments?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                      <ClockIcon className="w-4 h-4 text-primary-500" />
                      Machinery & Equipment Log
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedReport.equipments.map((eq: any) => (
                        <div
                          key={eq.id}
                          className="bg-gray-50 dark:bg-dark-700/40 border border-gray-100 dark:border-dark-700 p-3 rounded-xl text-xs"
                        >
                          <h6 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {eq.equipmentName}
                          </h6>
                          <div className="flex justify-between text-gray-500 dark:text-gray-400">
                            <span>Running: {eq.runningHours}h</span>
                            <span>Idle: {eq.idleHours}h</span>
                          </div>
                          {eq.remarks && (
                            <p className="text-[11px] text-gray-400 mt-1 italic">{eq.remarks}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Site Photos Gallery */}
                {selectedReport.photos?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                      <PhotoIcon className="w-4 h-4 text-amber-500" />
                      Site Photos ({selectedReport.photos.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedReport.photos.map((ph: any) => (
                        <div
                          key={ph.id}
                          className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-dark-700 bg-gray-100 dark:bg-dark-700 shadow-sm"
                        >
                          <img
                            src={ph.photoUrl}
                            alt={ph.caption || "Site Photo"}
                            className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="p-2.5 bg-white dark:bg-dark-800">
                            {ph.activityTag && (
                              <span className="text-[10px] font-semibold uppercase text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.5 rounded mb-1 inline-block">
                                {ph.activityTag}
                              </span>
                            )}
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                              {ph.caption}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-dark-700/50 border-t border-gray-100 dark:border-dark-700 flex justify-end gap-3">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg"
                >
                  Close
                </button>
                {selectedReport.status !== "approved" && (
                  <button
                    onClick={() => {
                      setReportToApprove(selectedReport.id);
                      setConfirmApproveOpen(true);
                    }}
                    className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm"
                  >
                    Approve Daily Progress Report
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Drawer / Modal */}
        {createDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-dark-700">
              <form onSubmit={handleCreateSubmit}>
                <div className="sticky top-0 bg-white dark:bg-dark-800 p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between z-10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <DocumentArrowUpIcon className="w-6 h-6 text-primary-600" />
                    <span>Create Daily Progress Report (DPR)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCreateDrawerOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-5 text-sm">
                  {/* Basic Site Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Project Site *
                      </label>
                      <select
                        value={formData.siteId}
                        onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                        className="w-full text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 p-2"
                        required
                      >
                        {sites.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Report Date *
                      </label>
                      <input
                        type="date"
                        value={formData.reportDate}
                        onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                        className="w-full text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 p-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Working Shift *
                      </label>
                      <select
                        value={formData.shift}
                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                        className="w-full text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 p-2"
                      >
                        <option value="Day">Day Shift</option>
                        <option value="Night">Night Shift</option>
                        <option value="Full Day">Full 24-hr Pouring</option>
                      </select>
                    </div>
                  </div>

                  {/* Weather */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Weather Condition
                      </label>
                      <input
                        type="text"
                        value={formData.weather}
                        onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                        className="w-full text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 p-2"
                        placeholder="e.g. Clear / Sunny, Rainy"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Site Temperature
                      </label>
                      <input
                        type="text"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        className="w-full text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 p-2"
                        placeholder="e.g. 32°C"
                      />
                    </div>
                  </div>

                  {/* General Narrative */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      General Progress & Shift Summary *
                    </label>
                    <textarea
                      rows={3}
                      value={formData.generalProgress}
                      onChange={(e) => setFormData({ ...formData, generalProgress: e.target.value })}
                      className="w-full text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 p-2.5"
                      placeholder="Describe major concrete pours, shuttering, brickwork completed today..."
                      required
                    />
                  </div>

                  {/* Constraints & Safety */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Delays / Bottlenecks / Power Cuts
                      </label>
                      <textarea
                        rows={2}
                        value={formData.delaysIssues}
                        onChange={(e) => setFormData({ ...formData, delaysIssues: e.target.value })}
                        className="w-full text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 p-2"
                        placeholder="Any material shortage or breakdown..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Safety Notes & Toolbox Talk
                      </label>
                      <textarea
                        rows={2}
                        value={formData.safetyNotes}
                        onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
                        className="w-full text-sm rounded-lg border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 p-2"
                        placeholder="Toolbox talk topics, safety audits..."
                      />
                    </div>
                  </div>

                  {/* Work Items Line Items */}
                  <div className="border border-gray-200 dark:border-dark-700 rounded-xl p-4 bg-gray-50/50 dark:bg-dark-700/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 text-xs">
                        <WrenchScrewdriverIcon className="w-4 h-4 text-primary-500" />
                        Executed Activities
                      </h4>
                      <button
                        type="button"
                        onClick={addWorkItemRow}
                        className="text-xs text-primary-600 font-semibold hover:underline"
                      >
                        + Add Activity Row
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.items.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                          <input
                            type="text"
                            placeholder="Activity (e.g. Column M30 Pour)"
                            value={it.activityName}
                            onChange={(e) => {
                              const copy = [...formData.items];
                              copy[idx]!.activityName = e.target.value;
                              setFormData({ ...formData, items: copy });
                            }}
                            className="col-span-5 p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700"
                          />
                          <input
                            type="text"
                            placeholder="Floor / Location"
                            value={it.locationRef}
                            onChange={(e) => {
                              const copy = [...formData.items];
                              copy[idx]!.locationRef = e.target.value;
                              setFormData({ ...formData, items: copy });
                            }}
                            className="col-span-3 p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Qty Done"
                            value={it.completedQty}
                            onChange={(e) => {
                              const copy = [...formData.items];
                              copy[idx]!.completedQty = e.target.value;
                              setFormData({ ...formData, items: copy });
                            }}
                            className="col-span-2 p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-right"
                          />
                          <select
                            value={it.uom}
                            onChange={(e) => {
                              const copy = [...formData.items];
                              copy[idx]!.uom = e.target.value;
                              setFormData({ ...formData, items: copy });
                            }}
                            className="col-span-2 p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700"
                          >
                            <option value="CU.M">CU.M</option>
                            <option value="SQ.M">SQ.M</option>
                            <option value="TONS">TONS</option>
                            <option value="R.M">R.M</option>
                            <option value="PCS">PCS</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Machinery Section */}
                  <div className="border border-gray-200 dark:border-dark-700 rounded-xl p-4 bg-gray-50/50 dark:bg-dark-700/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 text-xs">
                        <ClockIcon className="w-4 h-4 text-primary-500" />
                        Machinery & Equipment Log
                      </h4>
                      <button
                        type="button"
                        onClick={addEquipmentRow}
                        className="text-xs text-primary-600 font-semibold hover:underline"
                      >
                        + Add Machinery Row
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.equipments.map((eq, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                          <input
                            type="text"
                            placeholder="Equipment (e.g. Tower Crane)"
                            value={eq.equipmentName}
                            onChange={(e) => {
                              const copy = [...formData.equipments];
                              copy[idx]!.equipmentName = e.target.value;
                              setFormData({ ...formData, equipments: copy });
                            }}
                            className="col-span-6 p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700"
                          />
                          <input
                            type="number"
                            step="0.5"
                            placeholder="Running Hrs"
                            value={eq.runningHours}
                            onChange={(e) => {
                              const copy = [...formData.equipments];
                              copy[idx]!.runningHours = e.target.value;
                              setFormData({ ...formData, equipments: copy });
                            }}
                            className="col-span-3 p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-right"
                          />
                          <input
                            type="number"
                            step="0.5"
                            placeholder="Idle Hrs"
                            value={eq.idleHours}
                            onChange={(e) => {
                              const copy = [...formData.equipments];
                              copy[idx]!.idleHours = e.target.value;
                              setFormData({ ...formData, equipments: copy });
                            }}
                            className="col-span-3 p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photos Section */}
                  <div className="border border-gray-200 dark:border-dark-700 rounded-xl p-4 bg-gray-50/50 dark:bg-dark-700/20">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5 text-xs">
                      <PhotoIcon className="w-4 h-4 text-amber-500" />
                      Attach Site Progress Photos
                    </h4>

                    <div className="flex flex-wrap gap-2 items-center mb-3">
                      <input
                        type="text"
                        placeholder="Image URL or Unsplash URL"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        className="flex-1 text-xs p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700"
                      />
                      <input
                        type="text"
                        placeholder="Caption"
                        value={newPhotoCaption}
                        onChange={(e) => setNewPhotoCaption(e.target.value)}
                        className="w-36 text-xs p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700"
                      />
                      <input
                        type="text"
                        placeholder="Tag (e.g. Steel)"
                        value={newPhotoTag}
                        onChange={(e) => setNewPhotoTag(e.target.value)}
                        className="w-24 text-xs p-2 rounded-lg border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700"
                      />
                      <button
                        type="button"
                        onClick={addPhotoToForm}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-2 rounded-lg"
                      >
                        Add Photo
                      </button>
                    </div>

                    {formData.photos.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {formData.photos.map((ph, idx) => (
                          <div
                            key={idx}
                            className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-700 group"
                          >
                            <img src={ph.photoUrl} alt={ph.caption} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <span className="text-[10px] text-white p-1 text-center font-medium">
                                {ph.activityTag}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-dark-700/50 border-t border-gray-100 dark:border-dark-700 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateDrawerOpen(false)}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Submit DPR
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          open={confirmApproveOpen}
          onCancel={() => setConfirmApproveOpen(false)}
          onConfirm={handleApprove}
          title="Approve Daily Progress Report"
          message="Are you sure you want to approve this DPR? This certifies that recorded activities, equipment hours, and site measurements are verified."
          confirmText="Yes, Approve Report"
        />
      </div>
    </Page>
  );
}
