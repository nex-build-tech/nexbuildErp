// Import Dependencies
import { Label, Radio, RadioGroup } from "@headlessui/react";
import clsx from "clsx";
import { toast } from "sonner";

// Local Imports
import { useThemeContext } from "@/app/contexts/theme/context";
import { useState, useRef } from "react";
import { ArrowUpTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { CoBrandLogo } from "@/components/shared/CoBrandLogo";
import KingsIcon from "@/assets/kingsLogo.svg?react";
import { colors } from "@/constants/colors";
import { Listbox } from "@/components/shared/form/StyledListbox";
import { useDidUpdate } from "@/hooks";
import { Button, Switch } from "@/components/ui";
import {
  PrimaryColor,
  LightColor,
  DarkColor,
  Notification,
} from "@/configs/@types/theme";

// ----------------------------------------------------------------------

const primaryColors: PrimaryColor[] = [
  "indigo",
  "blue",
  "green",
  "amber",
  "purple",
  "rose",
];
const lightColors: LightColor[] = ["slate", "gray", "neutral"];
const darkColors: DarkColor[] = ["mint", "navy", "mirage", "cinder", "black"];

const cardSkins = [
  {
    value: "shadow",
    label: "Shadow",
  },
  {
    value: "bordered",
    label: "Bordered",
  },
];

const notificationPos: {
  value: Notification["position"];
  label: string;
}[] = [
  {
    value: "top-left",
    label: "Top Left",
  },
  {
    value: "top-center",
    label: "Top Center",
  },
  {
    value: "top-right",
    label: "Top Right",
  },
  {
    value: "bottom-left",
    label: "Bottom Left",
  },
  {
    value: "bottom-center",
    label: "Bottom Center",
  },
  {
    value: "bottom-right",
    label: "Bottom Right",
  },
];

const MAX_NOTIFICATION_COUNT = 5;

export default function Appearance() {
  const theme = useThemeContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 2 MB.",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format", {
        description: "Please upload a valid image file (SVG, PNG, JPG, WebP).",
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      theme.setTenantLogo(result);
      setIsUploading(false);
      toast.success("Tenant logo updated successfully", {
        description: "Your new logo is now co-branded across the platform.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    theme.setTenantLogo(null);
    toast.info("Restored default Kings Developers emblem");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useDidUpdate(() => {
    const currentPosition = notificationPos.find(
      (pos) => pos.value === theme.notification?.position,
    );

    if (currentPosition) {
      toast("Position updated", {
        description: `Notification position updated to ${currentPosition.label}`,
        descriptionClassName: "text-gray-600 dark:text-dark-200 text-xs mt-0.5",
      });
    }
  }, [theme.notification?.position]);

  useDidUpdate(() => {
    for (let i = 0; i < 3; i++) toast("This is a Toast");
  }, [theme.notification?.isExpanded]);

  return (
    <div className="w-full max-w-3xl 2xl:max-w-5xl">
      <h5 className="dark:text-dark-50 text-lg font-medium text-gray-800">
        Appearance
      </h5>
      <p className="dark:text-dark-200 mt-0.5 text-sm text-balance text-gray-500">
        Customize the appearance of the app. Select Theme colors and mode, to
        change the look of the app.
      </p>
      <div className="dark:bg-dark-500 my-5 h-px bg-gray-200" />

      <div className="space-y-8">
        <div>
          <div>
            <p className="dark:text-dark-100 text-base font-medium text-gray-800">
              Theme
            </p>
            <p className="mt-0.5">
              You can select a theme color from the list below.
            </p>
          </div>
          <RadioGroup
            value={theme.themeMode}
            onChange={theme.setThemeMode}
            className="mt-4"
          >
            <Label className="sr-only">Theme Mode (dark or light)</Label>
            <div className="mt-2 flex flex-wrap gap-6">
              <Radio
                value="system"
                className="w-44 cursor-pointer outline-hidden"
              >
                {({ checked }) => (
                  <>
                    <div
                      className={clsx(
                        "bg-dark-900 relative overflow-hidden rounded-lg border-2 dark:border-transparent",
                        checked &&
                          "ring-primary-600 dark:ring-primary-500 dark:ring-offset-dark-700 ring-2 ring-offset-2 ring-offset-white transition-all",
                      )}
                    >
                      <div
                        style={{
                          clipPath: "polygon(50% 50%, 100% 0, 0 0, 0% 100%)",
                        }}
                        className="w-full space-y-2 bg-gray-50 p-1.5"
                      >
                        <div className="w-full space-y-2 rounded-sm bg-white p-2 shadow-xs">
                          <div className="bg-gray-150 h-2 w-9/12 rounded-lg"></div>
                          <div className="bg-gray-150 h-2 w-11/12 rounded-lg"></div>
                        </div>
                        <div className="flex items-center space-x-2 rounded-sm bg-white p-2 shadow-xs">
                          <div className="bg-gray-150 size-4 shrink-0 rounded-full"></div>
                          <div className="bg-gray-150 h-2 w-full rounded-lg"></div>
                        </div>
                        <div className="flex items-center space-x-2 rounded-sm bg-white p-2 shadow-xs">
                          <div className="bg-gray-150 size-4 shrink-0 rounded-full"></div>
                          <div className="bg-gray-150 h-2 w-9/12 rounded-lg"></div>
                        </div>
                      </div>
                      <div
                        style={{
                          clipPath:
                            "polygon(50% 50%, 100% 0, 100% 100%, 0% 100%)",
                        }}
                        className="absolute inset-0 space-y-2 p-1.5"
                      >
                        <div className="bg-dark-700 w-full space-y-2 rounded-sm p-2 shadow-xs">
                          <div className="bg-dark-400 h-2 w-9/12 rounded-lg"></div>
                          <div className="bg-dark-400 h-2 w-11/12 rounded-lg"></div>
                        </div>
                        <div className="bg-dark-700 flex items-center space-x-2 rounded-sm p-2 shadow-xs">
                          <div className="bg-dark-400 size-4 shrink-0 rounded-full"></div>
                          <div className="bg-dark-400 h-2 w-full rounded-lg"></div>
                        </div>
                        <div className="bg-dark-700 flex items-center space-x-2 rounded-sm p-2 shadow-xs">
                          <div className="bg-dark-400 size-4 shrink-0 rounded-full"></div>
                          <div className="bg-dark-400 h-2 w-9/12 rounded-lg"></div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-1.5 text-center">System</p>
                  </>
                )}
              </Radio>
              <Radio
                value="light"
                className="w-44 cursor-pointer outline-hidden"
              >
                {({ checked }) => (
                  <>
                    <div
                      className={clsx(
                        "relative overflow-hidden rounded-lg border-2 dark:border-transparent",
                        checked &&
                          "ring-primary-600 dark:ring-primary-500 dark:ring-offset-dark-700 ring-2 ring-offset-2 ring-offset-white transition-all",
                      )}
                    >
                      <div className="w-full space-y-2 bg-gray-50 p-1.5">
                        <div className="w-full space-y-2 rounded-sm bg-white p-2 shadow-xs">
                          <div className="bg-gray-150 h-2 w-9/12 rounded-lg"></div>
                          <div className="bg-gray-150 h-2 w-11/12 rounded-lg"></div>
                        </div>
                        <div className="flex items-center space-x-2 rounded-sm bg-white p-2 shadow-xs">
                          <div className="bg-gray-150 size-4 shrink-0 rounded-full"></div>
                          <div className="bg-gray-150 h-2 w-full rounded-lg"></div>
                        </div>
                        <div className="flex items-center space-x-2 rounded-sm bg-white p-2 shadow-xs">
                          <div className="bg-gray-150 size-4 shrink-0 rounded-full"></div>
                          <div className="bg-gray-150 h-2 w-9/12 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-1.5 text-center">Light</p>
                  </>
                )}
              </Radio>
              <Radio
                value="dark"
                className="w-44 cursor-pointer outline-hidden"
              >
                {({ checked }) => (
                  <>
                    <div
                      className={clsx(
                        "bg-dark-900 relative overflow-hidden rounded-lg border border-transparent",
                        checked &&
                          "ring-primary-600 dark:ring-primary-500 dark:ring-offset-dark-700 ring-2 ring-offset-2 ring-offset-white transition-all",
                      )}
                    >
                      <div className="bg-dark-900 w-full space-y-2 p-1.5">
                        <div className="bg-dark-700 w-full space-y-2 rounded-sm p-2 shadow-xs">
                          <div className="bg-dark-400 h-2 w-9/12 rounded-lg"></div>
                          <div className="bg-dark-400 h-2 w-11/12 rounded-lg"></div>
                        </div>
                        <div className="bg-dark-700 flex items-center space-x-2 rounded-sm p-2 shadow-xs">
                          <div className="bg-dark-400 size-4 shrink-0 rounded-full"></div>
                          <div className="bg-dark-400 h-2 w-full rounded-lg"></div>
                        </div>
                        <div className="bg-dark-700 flex items-center space-x-2 rounded-sm p-2 shadow-xs">
                          <div className="bg-dark-400 size-4 shrink-0 rounded-full"></div>
                          <div className="bg-dark-400 h-2 w-9/12 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-1.5 text-center">Dark</p>
                  </>
                )}
              </Radio>
            </div>
          </RadioGroup>
        </div>

        {/* Navigation Menu Layout Selection */}
        <div>
          <div>
            <p className="dark:text-dark-100 text-base font-medium text-gray-800">
              Navigation Menu Layout
            </p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">
              Choose your preferred sidebar layout: Template Main Menu (Dual-Panel with Icon Rail + Drawer) or Sideblock (Single Sidebar).
            </p>
          </div>
          <RadioGroup
            value={theme.themeLayout}
            onChange={(val) => {
              theme.setThemeLayout(val);
              toast.success("Navigation layout updated");
            }}
            className="mt-4"
          >
            <Label className="sr-only">Navigation Menu Layout</Label>
            <div className="mt-2 flex flex-wrap gap-6">
              {/* Option 1: Template Main Layout (Dual-Panel) */}
              <Radio
                value="main-layout"
                className="w-56 cursor-pointer outline-hidden"
              >
                {({ checked }) => (
                  <>
                    <div
                      className={clsx(
                        "relative overflow-hidden rounded-xl border-2 transition-all p-2 bg-slate-50 dark:bg-dark-900",
                        checked
                          ? "border-primary-600 ring-2 ring-primary-500/20 shadow-md"
                          : "border-slate-200 dark:border-dark-700 hover:border-slate-300",
                      )}
                    >
                      <div className="flex h-28 gap-1.5 rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-1.5">
                        {/* Mini MainPanel Icon Rail */}
                        <div className="w-6 shrink-0 rounded-md bg-slate-100 dark:bg-dark-700 flex flex-col items-center py-1.5 space-y-1.5 border-r border-slate-200 dark:border-dark-600">
                          <div className="size-2.5 rounded-sm bg-blue-600" />
                          <div className="size-2 rounded-xs bg-slate-400 dark:bg-dark-400" />
                          <div className="size-2 rounded-xs bg-slate-400 dark:bg-dark-400" />
                          <div className="size-2 rounded-xs bg-slate-400 dark:bg-dark-400" />
                        </div>
                        {/* Mini PrimePanel Drawer */}
                        <div className="w-14 shrink-0 rounded-md bg-slate-50 dark:bg-dark-750 p-1.5 space-y-1.5 border-r border-slate-100 dark:border-dark-700">
                          <div className="h-2 w-3/4 bg-slate-400 dark:bg-dark-400 rounded-xs" />
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-dark-600 rounded-xs" />
                          <div className="h-1.5 w-5/6 bg-slate-200 dark:bg-dark-600 rounded-xs" />
                        </div>
                        {/* Content Area */}
                        <div className="grow rounded-md p-1.5 space-y-1.5">
                          <div className="h-2 w-1/2 bg-slate-300 dark:bg-dark-500 rounded-xs" />
                          <div className="h-12 w-full bg-slate-100 dark:bg-dark-700/60 rounded-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="font-semibold text-xs text-slate-800 dark:text-dark-100">
                        Template Main Menu
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-dark-400">
                        Dual-Panel (Icon Rail + Drawer)
                      </p>
                    </div>
                  </>
                )}
              </Radio>

              {/* Option 2: Sideblock Layout (Single Sidebar) */}
              <Radio
                value="sideblock"
                className="w-56 cursor-pointer outline-hidden"
              >
                {({ checked }) => (
                  <>
                    <div
                      className={clsx(
                        "relative overflow-hidden rounded-xl border-2 transition-all p-2 bg-slate-50 dark:bg-dark-900",
                        checked
                          ? "border-primary-600 ring-2 ring-primary-500/20 shadow-md"
                          : "border-slate-200 dark:border-dark-700 hover:border-slate-300",
                      )}
                    >
                      <div className="flex h-28 gap-1.5 rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-1.5">
                        {/* Mini Single Sidebar */}
                        <div className="w-20 shrink-0 rounded-md bg-slate-100 dark:bg-dark-700 p-1.5 space-y-1.5 border-r border-slate-200 dark:border-dark-600">
                          <div className="flex items-center gap-1">
                            <div className="size-2 rounded-xs bg-[#c5a04e]" />
                            <div className="h-1.5 w-10 bg-slate-400 dark:bg-dark-400 rounded-xs" />
                          </div>
                          <div className="h-1.5 w-3/4 bg-slate-300 dark:bg-dark-500 rounded-xs mt-1" />
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-dark-600 rounded-xs" />
                          <div className="h-1.5 w-5/6 bg-slate-200 dark:bg-dark-600 rounded-xs" />
                          <div className="h-1.5 w-4/5 bg-slate-200 dark:bg-dark-600 rounded-xs" />
                        </div>
                        {/* Content Area */}
                        <div className="grow rounded-md p-1.5 space-y-1.5">
                          <div className="h-2 w-1/2 bg-slate-300 dark:bg-dark-500 rounded-xs" />
                          <div className="h-12 w-full bg-slate-100 dark:bg-dark-700/60 rounded-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="font-semibold text-xs text-slate-800 dark:text-dark-100">
                        Sideblock Layout
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-dark-400">
                        Classic Single Sidebar
                      </p>
                    </div>
                  </>
                )}
              </Radio>
            </div>
          </RadioGroup>
        </div>

        {/* Tenant Brand Logo Customization */}
        <div className="rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50/70 dark:bg-dark-850 p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="dark:text-dark-100 text-base font-semibold text-gray-800">
                Tenant Brand &amp; Logo
              </p>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-700">
                Co-Branding
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Upload your organization's custom logo. It will be co-branded alongside <strong>NexBuild ERP</strong> in the top navigation header, sidebars, and authentication screens.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Active Logo & Upload Controls */}
            <div className="rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-dark-400 block mb-2">
                  Active Tenant Logo
                </span>
                <div className="flex items-center gap-3.5 py-2">
                  <div className="size-14 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-750 flex items-center justify-center p-2 shadow-xs shrink-0">
                    {theme.tenantLogo ? (
                      <img
                        src={theme.tenantLogo}
                        alt="Custom Tenant Logo"
                        className="size-10 object-contain drop-shadow-xs"
                      />
                    ) : (
                      <KingsIcon className="size-10 drop-shadow-xs" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-dark-100">
                      {theme.tenantLogo ? "Custom Uploaded Logo" : "Kings Builders & Developers"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-dark-400">
                      {theme.tenantLogo ? "Active custom tenant logo" : "Default architectural gold crest"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-dark-700">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  variant="outlined"
                  className="text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpTrayIcon className="size-3.5" />
                  {theme.tenantLogo ? "Upload Different Logo" : "Upload Tenant Logo"}
                </Button>
                {theme.tenantLogo && (
                  <Button
                    onClick={handleResetLogo}
                    variant="flat"
                    className="text-xs py-1.5 px-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowPathIcon className="size-3.5" />
                    Reset to Kings Default
                  </Button>
                )}
              </div>
            </div>

            {/* Live Co-Brand Navbar Preview */}
            <div className="rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-dark-400 block mb-2">
                  Live Navigation Bar Co-Brand Preview
                </span>
                <div className="rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-3 flex items-center justify-between shadow-xs">
                  <CoBrandLogo variant="header" />
                  <span className="text-[10px] text-slate-400 dark:text-dark-500 uppercase tracking-widest font-mono">
                    Header
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-dark-400 mt-3">
                Supported formats: SVG, PNG, WebP, JPG (max 2 MB). Transparent background recommended.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div>
            <p className="dark:text-dark-100 text-base font-medium text-gray-800">
              Primary Color
            </p>
            <p className="mt-0.5">
              Choose a color that will be used as the primary color for your
              theme.
            </p>
          </div>
          <RadioGroup
            value={theme.primaryColorScheme.name}
            onChange={theme.setPrimaryColorScheme}
            className="mt-2"
          >
            <Label className="sr-only">Choose Primary Theme Color</Label>
            <div className="mt-2 flex w-fit flex-wrap gap-4 sm:gap-5">
              {primaryColors.map((color) => (
                <Radio
                  key={color}
                  value={color}
                  className={({ checked }) =>
                    clsx(
                      "flex h-14 w-16 cursor-pointer items-center justify-center rounded-lg border outline-hidden",
                      checked
                        ? "border-primary-500"
                        : "dark:border-dark-500 border-gray-200",
                    )
                  }
                >
                  {({ checked }) => (
                    <div
                      className={clsx(
                        "mask is-diamond size-6 transition-all",
                        checked && "scale-110 rotate-45",
                      )}
                      style={{
                        backgroundColor: colors[color][500],
                      }}
                    ></div>
                  )}
                </Radio>
              ))}
            </div>
          </RadioGroup>
        </div>
        <div>
          <div>
            <p className="dark:text-dark-100 text-base font-medium text-gray-800">
              Light Color Scheme
            </p>
            <p className="mt-0.5">
              Select light color scheme that will be used for your theme.
            </p>
          </div>
          <RadioGroup
            value={theme.lightColorScheme.name}
            onChange={theme.setLightColorScheme}
            className="mt-4"
          >
            <Label className="sr-only">Theme Light Mode Color Scheme</Label>
            <div className="mt-2 flex flex-wrap gap-4">
              {lightColors.map((color) => (
                <Radio
                  key={color}
                  value={color}
                  className="w-32 cursor-pointer outline-hidden"
                >
                  {({ checked }) => (
                    <>
                      <div
                        className={clsx(
                          "relative overflow-hidden rounded-lg border-2 dark:border-transparent",
                          checked &&
                            "ring-primary-600 dark:ring-primary-500 dark:ring-offset-dark-700 ring-2 ring-offset-2 ring-offset-white transition-all",
                        )}
                      >
                        <div
                          className="w-full space-y-2 p-1.5"
                          style={{ backgroundColor: colors[color][200] }}
                        >
                          <div className="w-full space-y-2 rounded-sm bg-white p-2 shadow-xs">
                            <div
                              className="h-2 w-9/12 rounded-lg"
                              style={{ backgroundColor: colors[color][400] }}
                            ></div>
                            <div
                              className="h-2 w-11/12 rounded-lg"
                              style={{ backgroundColor: colors[color][400] }}
                            ></div>
                          </div>
                          <div className="flex items-center space-x-2 rounded-sm bg-white p-2 shadow-xs">
                            <div
                              className="size-4 shrink-0 rounded-full"
                              style={{ backgroundColor: colors[color][400] }}
                            ></div>
                            <div
                              className="h-2 w-full rounded-lg"
                              style={{ backgroundColor: colors[color][400] }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-1.5 text-center capitalize">{color}</p>
                    </>
                  )}
                </Radio>
              ))}
            </div>
          </RadioGroup>
        </div>
        <div>
          <div>
            <p className="dark:text-dark-100 text-base font-medium text-gray-800">
              Dark Color Scheme
            </p>
            <p className="mt-0.5">
              Select dark color scheme that will be used for your theme.
            </p>
          </div>
          <RadioGroup
            value={theme.darkColorScheme.name}
            onChange={theme.setDarkColorScheme}
            className="mt-4"
          >
            <Label className="sr-only">Dark Mode Color Schemes</Label>
            <div className="mt-2 flex flex-wrap gap-4">
              {darkColors.map((color) => (
                <Radio
                  key={color}
                  value={color}
                  className="w-32 cursor-pointer outline-hidden"
                >
                  {({ checked }) => (
                    <>
                      <div
                        className={clsx(
                          "relative overflow-hidden rounded-lg",
                          checked &&
                            "ring-primary-600 dark:ring-primary-500 dark:ring-offset-dark-700 ring-2 ring-offset-2 ring-offset-white transition-all",
                        )}
                      >
                        <div
                          className="w-full space-y-2 p-1.5"
                          style={{ backgroundColor: colors[color][900] }}
                        >
                          <div
                            className="w-full space-y-2 rounded-sm p-2 shadow-xs"
                            style={{ backgroundColor: colors[color][700] }}
                          >
                            <div
                              className="h-2 w-9/12 rounded-lg"
                              style={{ backgroundColor: colors[color][400] }}
                            ></div>
                            <div
                              className="h-2 w-11/12 rounded-lg"
                              style={{ backgroundColor: colors[color][400] }}
                            ></div>
                          </div>
                          <div
                            className="flex items-center space-x-2 rounded-sm p-2 shadow-xs"
                            style={{ backgroundColor: colors[color][700] }}
                          >
                            <div
                              className="size-4 shrink-0 rounded-full"
                              style={{ backgroundColor: colors[color][400] }}
                            ></div>
                            <div
                              className="h-2 w-full rounded-lg"
                              style={{ backgroundColor: colors[color][400] }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-1.5 text-center capitalize">{color}</p>
                    </>
                  )}
                </Radio>
              ))}
            </div>
          </RadioGroup>
        </div>
      </div>
      <div className="dark:bg-dark-500 my-6 h-px bg-gray-200"></div>
      <div>
        <div>
          <p className="dark:text-dark-100 text-base font-medium text-gray-800">
            Notification
          </p>
          <p className="mt-0.5">
            Choose Notification position and group style for your application
          </p>
        </div>
        <div className="mt-3">
          <p>Notification Group Style</p>
          <RadioGroup
            value={theme.notification?.isExpanded ? "expand" : "stack"}
            onChange={(val) => theme.setNotificationExpand(val === "expand")}
            className="mt-3 text-center"
          >
            <Label className="sr-only">Notification Group Style</Label>
            <div className="grid max-w-xl gap-4 sm:grid-cols-2">
              <Radio value="stack" className="cursor-pointer outline-hidden">
                {({ checked }) => (
                  <>
                    <div
                      className={clsx(
                        "dark:border-dark-500 relative flex h-52 w-full items-center rounded-lg border border-gray-200 px-3 py-4",
                        checked &&
                          "ring-primary-600 dark:ring-primary-500 dark:ring-offset-dark-700 ring-2 ring-offset-2 ring-offset-white transition-all",
                      )}
                    >
                      <div className="w-full -space-y-6">
                        <div
                          className="dark:border-dark-500 dark:bg-dark-600 relative flex h-12 w-full flex-col justify-center space-y-2 rounded-sm border bg-white p-2 shadow-[0_4px_12px_#0000001a] dark:shadow-none"
                          style={{ transform: "scale(.9)" }}
                        >
                          <div className="bg-gray-150 dark:bg-dark-400 h-2 w-11/12 rounded-lg"></div>
                          <div className="bg-gray-150 dark:bg-dark-400 h-2 w-9/12 rounded-lg"></div>
                        </div>
                        <div
                          className="dark:border-dark-500 dark:bg-dark-600 relative flex h-12 w-full flex-col justify-center space-y-2 rounded-sm border bg-white p-2 shadow-[0_4px_12px_#0000001a] dark:shadow-none"
                          style={{ transform: "scale(.95)" }}
                        >
                          <div className="bg-gray-150 dark:bg-dark-400 h-2 w-11/12 rounded-lg"></div>
                          <div className="bg-gray-150 dark:bg-dark-400 h-2 w-9/12 rounded-lg"></div>
                        </div>
                        <div className="dark:border-dark-500 dark:bg-dark-600 relative flex h-12 w-full flex-col justify-center space-y-2 rounded-sm border bg-white p-2 shadow-[0_4px_12px_#0000001a] dark:shadow-none">
                          <div className="bg-gray-150 dark:bg-dark-400 h-2 w-11/12 rounded-lg"></div>
                          <div className="bg-gray-150 dark:bg-dark-400 h-2 w-9/12 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2">Stacked</p>
                  </>
                )}
              </Radio>
              <Radio value="expand" className="cursor-pointer outline-hidden">
                {({ checked }) => (
                  <>
                    <div
                      className={clsx(
                        "dark:border-dark-500 relative flex h-52 w-full flex-col justify-between space-y-2 rounded-lg border border-gray-200 px-4 py-5",
                        checked &&
                          "ring-primary-600 dark:ring-primary-500 dark:ring-offset-dark-700 ring-2 ring-offset-2 ring-offset-white transition-all",
                      )}
                    >
                      {Array(3)
                        .fill(null)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="dark:border-dark-500 dark:bg-dark-600 relative flex h-12 w-full flex-col justify-center space-y-2 rounded-sm border bg-white p-2 shadow-[0_4px_12px_#0000001a] dark:shadow-none"
                          >
                            <div className="bg-gray-150 dark:bg-dark-400 h-2 w-9/12 rounded-lg"></div>
                            <div className="bg-gray-150 dark:bg-dark-400 h-2 w-11/12 rounded-lg"></div>
                          </div>
                        ))}
                    </div>
                    <p className="mt-2">Expanded</p>
                  </>
                )}
              </Radio>
            </div>
          </RadioGroup>
        </div>
        <div className="mt-4">
          <p>Notification Max Count</p>
          <RadioGroup
            value={theme.notification?.visibleToasts}
            onChange={(val) => theme.setNotificationMaxCount(val)}
            className="mt-3 text-center"
          >
            <Label className="sr-only">Notification Max Count</Label>
            <div className="flex w-full max-w-sm space-x-0.5">
              {Array(MAX_NOTIFICATION_COUNT)
                .fill(null)
                .map((_, i) => (
                  <Radio
                    value={i + 1}
                    key={i}
                    className={({ checked }) =>
                      clsx(
                        "flex-1 cursor-pointer border-2 border-transparent border-b-current pb-1 text-base font-medium outline-hidden",
                        checked
                          ? "text-primary-600 dark:text-primary-400"
                          : "dark:text-dark-300 text-gray-500",
                      )
                    }
                  >
                    {i + 1}
                  </Radio>
                ))}
            </div>
          </RadioGroup>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3">
          <p className="my-auto">Notification Position:</p>
          <Listbox
            classNames={{
              root: "mt-1.5 flex-1 md:col-span-2 md:mt-0",
            }}
            data={notificationPos}
            value={notificationPos.find(
              (pos) => pos.value === theme.notification?.position,
            )}
            onChange={({ value }) => theme.setNotificationPosition(value)}
          />
        </div>
      </div>
      <div className="dark:bg-dark-500 my-6 h-px bg-gray-200"></div>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <p className="my-auto">Card Skin:</p>
          <Listbox
            classNames={{
              root: "mt-1.5 flex-1 md:col-span-2 md:mt-0",
            }}
            data={cardSkins}
            value={cardSkins.find((skin) => skin.value === theme.cardSkin)}
            onChange={({ value }) => theme.setCardSkin(value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3">
          <p className="my-auto">Theme Chrome Mode:</p>
          <div className="dark:border-dark-450 mt-1.5 flex flex-1 items-center justify-between space-x-2 rounded-lg border border-gray-300 px-3 py-2 md:col-span-2 md:mt-0">
            <p className="dark:text-dark-100 text-gray-800">Monochrome Mode</p>
            <Switch
              checked={theme.isMonochrome}
              onChange={(e) => theme.setMonochromeMode(e.target.checked)}
            />
          </div>
        </div>
      </div>
      <div className="mt-10">
        <Button color="primary" onClick={theme.resetTheme}>
          Reset Theme
        </Button>
      </div>
    </div>
  );
}
