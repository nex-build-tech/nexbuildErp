import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhotoIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Badge, Button, Card } from "@/components/ui";
import { useAuthContext } from "@/app/contexts/auth/context";
import axios from "@/utils/axios";
import { applyAttendanceWatermark, fileToImage } from "@/utils/attendanceWatermark";

export interface AssignedSiteOption {
  id: number;
  code: string;
  name: string;
  companyName?: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  geofenceRadius: number;
  status: string;
  hasCoordinates: boolean;
}

interface AttendanceCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function AttendanceCheckInModal({
  open,
  onClose,
  onSuccess,
}: AttendanceCheckInModalProps) {
  const { user } = useAuthContext();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [sites, setSites] = useState<AssignedSiteOption[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
  const [punchType, setPunchType] = useState<"check_in" | "check_out">("check_in");
  const [remarks, setRemarks] = useState("");

  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [watermarkTimestamp, setWatermarkTimestamp] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    setSubmitError(null);
    setPhotoPreviewUrl(null);
    setWatermarkTimestamp(null);
    setRemarks("");
    void loadAssignedSites();
    captureGps();

    return () => {
      stopCamera();
    };
  }, [open]);

  const loadAssignedSites = async () => {
    setLoadingSites(true);
    try {
      const res = await axios.get("/trushift/assigned-sites");
      const data = res.data?.data || res.data;
      const list: AssignedSiteOption[] = Array.isArray(data?.sites) ? data.sites : [];
      setSites(list);
      if (list.length > 0) {
        setSelectedSiteId(list[0]!.id);
      } else {
        setSelectedSiteId("");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to load assigned sites.");
    } finally {
      setLoadingSites(false);
    }
  };

  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Browser geolocation is not supported on this device.");
      return;
    }
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
        });
        setLocating(false);
      },
      (err) => {
        setGpsError(err.message || "Unable to fetch GPS location. Please allow location access.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === Number(selectedSiteId)) || null,
    [sites, selectedSiteId],
  );

  const distanceMeters = useMemo(() => {
    if (!coords || !selectedSite || !selectedSite.hasCoordinates) return null;
    return haversineMeters(
      coords.latitude,
      coords.longitude,
      Number(selectedSite.latitude),
      Number(selectedSite.longitude),
    );
  }, [coords, selectedSite]);

  const isInsideGeofence = useMemo(() => {
    if (distanceMeters === null || !selectedSite) return false;
    return distanceMeters <= (Number(selectedSite.geofenceRadius) || 200);
  }, [distanceMeters, selectedSite]);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera API unavailable here. Use the photo upload option below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? `Camera access denied/unavailable (${err.message}). You can use the file camera option below.`
          : "Camera access unavailable.",
      );
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !selectedSite || !coords) return;
    try {
      const result = await applyAttendanceWatermark(videoRef.current, {
        siteName: selectedSite.name,
        siteCode: selectedSite.code,
        latitude: coords.latitude,
        longitude: coords.longitude,
        distanceMeters,
        staffName: user?.fullName || user?.username,
      });
      setPhotoPreviewUrl(result.dataUrl);
      setWatermarkTimestamp(result.timestampLabel);
      stopCamera();
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Failed to capture watermarked photo.");
    }
  };

  const handleFallbackPhotoFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSite || !coords) return;
    setCameraError(null);
    try {
      const img = await fileToImage(file);
      const result = await applyAttendanceWatermark(img, {
        siteName: selectedSite.name,
        siteCode: selectedSite.code,
        latitude: coords.latitude,
        longitude: coords.longitude,
        distanceMeters,
        staffName: user?.fullName || user?.username,
      });
      setPhotoPreviewUrl(result.dataUrl);
      setWatermarkTimestamp(result.timestampLabel);
      stopCamera();
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Failed to watermark uploaded photo.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedSite || !coords || !photoPreviewUrl) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await axios.post("/trushift/attendance", {
        siteId: selectedSite.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        punchType,
        photoDataUrl: photoPreviewUrl,
        remarks: remarks.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to record attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const canCapturePhoto = Boolean(selectedSite && selectedSite.hasCoordinates && coords);
  const canSubmit = Boolean(
    user?.profileCompleted !== false &&
      selectedSite &&
      selectedSite.hasCoordinates &&
      coords &&
      isInsideGeofence &&
      photoPreviewUrl &&
      !submitting,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Mark Geofenced Attendance
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                GPS + Watermarked Photo
              </Badge>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Verified against your assigned site geofence and stamped with Kings logo, GPS &amp; timestamp
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {user?.profileCompleted === false ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
            <div className="flex items-start gap-2.5 text-sm text-amber-800 dark:text-amber-200 font-medium">
              <ExclamationTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Your first-login profile setup is incomplete. You must complete your profile before
                marking attendance.
              </span>
            </div>
            <Link to="/profile-setup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                Go to Profile Setup
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {submitError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {submitError}
              </div>
            )}

            {/* Step 1: Assigned Site & Punch Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Assigned Site
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : "")}
                  disabled={loadingSites}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 text-xs text-gray-800 dark:text-gray-200"
                >
                  {sites.length === 0 ? (
                    <option value="">No sites assigned to your account</option>
                  ) : (
                    sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Punch Type
                </label>
                <select
                  value={punchType}
                  onChange={(e) => setPunchType(e.target.value as "check_in" | "check_out")}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 text-xs text-gray-800 dark:text-gray-200"
                >
                  <option value="check_in">Check-in</option>
                  <option value="check_out">Check-out</option>
                </select>
              </div>
            </div>

            {!loadingSites && sites.length === 0 && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                No construction sites are assigned to your user account (`user_sites`). Attendance
                cannot be marked until a site is assigned.
              </div>
            )}

            {selectedSite && !selectedSite.hasCoordinates && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                GPS coordinates are not configured for <strong>{selectedSite.name}</strong>.
                Attendance is blocked until site coordinates are set.
              </div>
            )}

            {/* Step 2: GPS Verification */}
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  <MapPinIcon className="w-4 h-4 text-indigo-600" />
                  Live GPS Verification
                </div>
                <Button type="button" variant="outlined" onClick={captureGps} className="text-xs py-1">
                  {locating ? "Locating..." : "Refresh GPS"}
                </Button>
              </div>

              {gpsError ? (
                <p className="text-xs text-rose-600">{gpsError}</p>
              ) : coords ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)} (±{coords.accuracy}m)
                  </span>
                  {selectedSite && selectedSite.hasCoordinates && distanceMeters !== null && (
                    isInsideGeofence ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <CheckCircleIcon className="w-3.5 h-3.5 mr-1 inline" />
                        Inside Geofence ({Math.round(distanceMeters)}m / {selectedSite.geofenceRadius}m)
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                        Outside Geofence ({Math.round(distanceMeters)}m &gt; {selectedSite.geofenceRadius}m)
                      </Badge>
                    )
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Fetching GPS coordinates...</p>
              )}
            </div>

            {/* Step 3: Camera Capture & Watermarked Photo Preview */}
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  <CameraIcon className="w-4 h-4 text-indigo-600" />
                  Attendance Photo (Watermarked with Kings Logo, GPS &amp; Time)
                </div>
                {!photoPreviewUrl && !cameraActive && (
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={startCamera}
                    disabled={!canCapturePhoto}
                    className="text-xs"
                  >
                    Open Camera
                  </Button>
                )}
              </div>

              {cameraError && <p className="text-xs text-amber-600">{cameraError}</p>}

              {cameraActive && (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-64 rounded-lg bg-black object-cover"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={captureFromCamera}
                      disabled={!canCapturePhoto}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                    >
                      Capture &amp; Stamp Watermark
                    </Button>
                    <Button type="button" variant="outlined" onClick={stopCamera} className="text-xs">
                      Cancel Camera
                    </Button>
                  </div>
                </div>
              )}

              {photoPreviewUrl && (
                <div className="space-y-2">
                  <img
                    src={photoPreviewUrl}
                    alt="Watermarked attendance preview"
                    className="w-full max-h-72 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-900"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <ShieldCheckIcon className="w-4 h-4" />
                      Watermark applied ({watermarkTimestamp})
                    </span>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => {
                        setPhotoPreviewUrl(null);
                        setWatermarkTimestamp(null);
                        void startCamera();
                      }}
                      className="text-xs"
                    >
                      Retake Photo
                    </Button>
                  </div>
                </div>
              )}

              {!photoPreviewUrl && (
                <label className="inline-flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium">
                  <PhotoIcon className="w-4 h-4" />
                  <span>{canCapturePhoto ? "Or select / capture image file" : "Enable GPS & valid site first to capture"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    disabled={!canCapturePhoto}
                    onChange={handleFallbackPhotoFile}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Remarks (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Shift note or site area..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 px-3 text-xs text-gray-800 dark:text-gray-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <Button type="button" variant="outlined" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Attendance"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
