import kingsLogoUrl from "@/assets/kingsLogo.svg";

export interface WatermarkOptions {
  siteName: string;
  siteCode?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number | null;
  staffName?: string;
  capturedAt?: Date;
}

export interface WatermarkedPhotoResult {
  dataUrl: string;
  timestampLabel: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for watermarking"));
    img.src = src;
  });
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Draws a captured video frame or image onto an HTML5 canvas and overlays
 * the Kings Builders logo, GPS coordinates, site name, and timestamp.
 */
export async function applyAttendanceWatermark(
  source: HTMLVideoElement | HTMLImageElement,
  options: WatermarkOptions,
): Promise<WatermarkedPhotoResult> {
  const srcWidth =
    source instanceof HTMLVideoElement ? source.videoWidth || 1280 : source.naturalWidth || 1280;
  const srcHeight =
    source instanceof HTMLVideoElement ? source.videoHeight || 720 : source.naturalHeight || 720;

  const maxWidth = 1080;
  const scale = srcWidth > maxWidth ? maxWidth / srcWidth : 1;
  const width = Math.max(320, Math.round(srcWidth * scale));
  const height = Math.max(240, Math.round(srcHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is not available in this browser.");
  }

  // 1. Draw base photo frame
  ctx.drawImage(source, 0, 0, width, height);

  // 2. Bottom watermark banner
  const barHeight = Math.max(88, Math.round(height * 0.19));
  const barTop = height - barHeight;
  ctx.fillStyle = "rgba(15, 23, 42, 0.80)";
  ctx.fillRect(0, barTop, width, barHeight);

  // Gold accent border at top of watermark strip
  ctx.fillStyle = "#c5a04e";
  ctx.fillRect(0, barTop, width, 3);

  // 3. Draw Kings Company Logo on the left
  const padding = Math.max(14, Math.round(width * 0.02));
  const logoSize = Math.min(54, barHeight - 24);
  let textStartX = padding;

  try {
    const logoImg = await loadImage(kingsLogoUrl);
    const logoY = barTop + Math.round((barHeight - logoSize) / 2);
    ctx.drawImage(logoImg, padding, logoY, logoSize, logoSize);
    textStartX = padding + logoSize + 14;
  } catch {
    // Continue gracefully with text badge if SVG image fails to decode
  }

  // 4. Text details: Company, Site, GPS, Timestamp
  const now = options.capturedAt ?? new Date();
  const timestampLabel = formatTimestamp(now);
  const titleFontSize = Math.max(13, Math.round(width * 0.018));
  const metaFontSize = Math.max(11, Math.round(width * 0.0145));

  ctx.textBaseline = "top";
  ctx.fillStyle = "#fbbf24";
  ctx.font = `700 ${titleFontSize}px Inter, system-ui, sans-serif`;
  const siteLabel = options.siteCode
    ? `${options.siteName} (${options.siteCode})`
    : options.siteName;
  ctx.fillText(`KINGS BUILDERS  •  ${siteLabel}`, textStartX, barTop + 14);

  ctx.fillStyle = "#f8fafc";
  ctx.font = `600 ${metaFontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const distanceText =
    options.distanceMeters !== null && options.distanceMeters !== undefined
      ? `  •  Dist: ${Math.round(options.distanceMeters)}m`
      : "";
  ctx.fillText(
    `GPS: ${options.latitude.toFixed(6)}, ${options.longitude.toFixed(6)}${distanceText}`,
    textStartX,
    barTop + 14 + titleFontSize + 6,
  );

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `500 ${metaFontSize}px Inter, system-ui, sans-serif`;
  const staffPrefix = options.staffName ? `${options.staffName}  •  ` : "";
  ctx.fillText(
    `${staffPrefix}${timestampLabel}`,
    textStartX,
    barTop + 14 + titleFontSize + metaFontSize + 12,
  );

  const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
  return { dataUrl, timestampLabel };
}

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read selected image file."));
    };
    img.src = objectUrl;
  });
}
