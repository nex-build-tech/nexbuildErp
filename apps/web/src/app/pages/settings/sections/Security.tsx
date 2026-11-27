import { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  KeyIcon,
  PaintBrushIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { Card, Button, Input } from "@/components/ui";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import axios from "@/utils/axios";
import { useAuthContext } from "@/app/contexts/auth/context";

export default function SecuritySettings() {
  const { user } = useAuthContext();
  const rawRole = typeof user?.role === "object" ? (user?.role as any)?.code || (user?.role as any)?.name : user?.role;
  const isOwnerOrAdmin = String(rawRole || "").toLowerCase().includes("owner") || String(rawRole || "").toLowerCase().includes("admin") || String(rawRole || "").toLowerCase().includes("director") || String(rawRole || "").toLowerCase().includes("boss");

  // 2FA state
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading2fa, setLoading2fa] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Tenant Branding state (Owner/Admin)
  const [branding, setBranding] = useState({
    name: "Kings Builders & Developers",
    tagline: "Builders & Developers",
    gstin: "27AABCK1234F1Z5",
    primaryColor: "#c5a04e",
    logoUrl: "/assets/appLogo.svg",
    mfaEnabled: false,
    address: "Kings Tower, Off S.V. Road, Andheri West, Mumbai, Maharashtra 400058",
  });
  const [savingBranding, setSavingBranding] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchProfileAndBranding();
  }, []);

  const fetchProfileAndBranding = async () => {
    try {
      const [meRes, brandRes] = await Promise.all([
        axios.get("/auth/me"),
        axios.get("/masters/tenant/branding").catch(() => ({ data: { data: null } })),
      ]);
      setTotpEnabled(Boolean(meRes.data?.data?.user?.totpEnabled));
      if (brandRes.data?.data) {
        setBranding((prev) => ({
          ...prev,
          ...brandRes.data.data,
          mfaEnabled: Boolean(brandRes.data.data.mfaEnabled),
        }));
      }
    } catch {
      // ignore
    }
  };

  const startTotpSetup = async () => {
    setLoading2fa(true);
    setBackupCodes([]);
    setTotpCode("");
    try {
      const res = await axios.post("/auth/2fa/generate");
      setTotpSecret(res.data?.data?.secret || "");
      setQrCodeUrl(res.data?.data?.qrCodeDataUrl || "");
      setSetupModalOpen(true);
    } catch (err: any) {
      alert("Failed to generate 2FA secret: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading2fa(false);
    }
  };

  const handleActivateTotp = async () => {
    if (!totpCode || totpCode.trim().length !== 6) {
      alert("Please enter a valid 6-digit verification code from your authenticator app.");
      return;
    }
    setLoading2fa(true);
    try {
      const res = await axios.post("/auth/2fa/enable", {
        secret: totpSecret,
        token: totpCode.trim(),
      });
      setTotpEnabled(true);
      setBackupCodes(res.data?.data?.backupCodes || []);
    } catch (err: any) {
      alert("Verification failed: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading2fa(false);
    }
  };

  const handleDisableTotp = async () => {
    if (!passwordConfirm) {
      alert("Password confirmation is required to disable 2FA.");
      return;
    }
    setLoading2fa(true);
    try {
      await axios.post("/auth/2fa/disable", { password: passwordConfirm });
      setTotpEnabled(false);
      setDisableModalOpen(false);
      setPasswordConfirm("");
      alert("Two-factor authentication has been disabled.");
    } catch (err: any) {
      alert("Failed to disable 2FA: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading2fa(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    setSavedSuccess(false);
    try {
      await axios.patch("/masters/tenant/branding", {
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor,
        tagline: branding.tagline,
        mfaEnabled: branding.mfaEnabled,
        address: branding.address,
      });
      document.documentElement.style.setProperty("--primary-theme-color", branding.primaryColor);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to save branding: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setSavingBranding(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
          <ShieldCheckIcon className="size-5 text-[#c5a04e]" />
          Security, Authentication &amp; Tenant Branding
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Configure two-factor TOTP authentication, enterprise compliance policies, and white-label tenant visual branding.
        </p>
      </div>

      {/* SECTION 1: TOTP TWO-FACTOR AUTHENTICATION */}
      <Card className="p-6 rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${totpEnabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-dark-300"}`}>
              <KeyIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-dark-100">
                  Two-Factor Authentication (TOTP / Authenticator)
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${totpEnabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" : "bg-slate-200 text-slate-700 dark:bg-dark-600 dark:text-dark-200"}`}>
                  {totpEnabled ? "Active & Enforced" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Protect your account with Google Authenticator, Microsoft Authenticator, or 1Password 6-digit verification codes.
              </p>
            </div>
          </div>

          <div>
            {totpEnabled ? (
              <Button
                onClick={() => setDisableModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                color="primary"
                onClick={startTotpSetup}
                disabled={loading2fa}
                className="bg-[#c5a04e] hover:bg-[#b08d3e] text-white px-4 py-2 text-xs font-bold rounded-xl shadow-md shadow-amber-500/20"
              >
                {loading2fa ? "Generating..." : "Enable TOTP 2FA"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 2: TENANT BRANDING & ENTERPRISE MFA POLICY (Owner/Admin) */}
      {isOwnerOrAdmin && (
        <Card className="p-6 rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-700 pb-3">
            <div className="flex items-center gap-2">
              <PaintBrushIcon className="size-5 text-[#c5a04e]" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-dark-100">
                Kings Builders &bull; Tenant Branding &amp; Visual Identity
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Tenant ID: kings &bull; State: Maharashtra (27)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-dark-200 block mb-1">
                Company Display Name
              </label>
              <Input
                value={branding.name}
                disabled
                className="text-xs bg-slate-50 dark:bg-dark-900 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-dark-200 block mb-1">
                Brand Tagline
              </label>
              <Input
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                className="text-xs"
                placeholder="e.g. Builders & Developers"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-dark-200 block mb-1">
                Primary Brand Theme Color (Tailux Hex)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="size-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="text-xs font-mono"
                  placeholder="#c5a04e"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-dark-200 block mb-1">
                Company GSTIN
              </label>
              <Input
                value={branding.gstin}
                disabled
                className="text-xs font-mono bg-slate-50 dark:bg-dark-900 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-dark-200 block mb-1">
                Registered Head Office Address
              </label>
              <Input
                value={branding.address}
                onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          {/* Enforce 2FA Toggle for Tenant */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-750 border border-slate-200 dark:border-dark-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-dark-100 flex items-center gap-1.5">
                <ShieldCheckIcon className="size-4 text-[#c5a04e]" />
                Enforce Mandatory 2FA for All Staff
              </span>
              <p className="text-[11px] text-slate-500">
                When enabled, all users under tenant &apos;kings&apos; must provide a 6-digit TOTP token to log in.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={branding.mfaEnabled}
                onChange={(e) => setBranding({ ...branding, mfaEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-dark-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c5a04e]"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircleIcon className="size-4" />
                Branding updated successfully!
              </span>
            )}
            <Button
              color="primary"
              onClick={handleSaveBranding}
              disabled={savingBranding}
              className="bg-[#c5a04e] hover:bg-[#b08d3e] text-white px-4 py-2 text-xs font-bold rounded-xl shadow-md shadow-amber-500/20"
            >
              {savingBranding ? "Saving..." : "Save Branding & Policies"}
            </Button>
          </div>
        </Card>
      )}

      {/* 2FA SETUP MODAL */}
      {setupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700 w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-700 pb-3">
              <div className="flex items-center gap-2">
                <QrCodeIcon className="size-6 text-[#c5a04e]" />
                <h4 className="font-bold text-base text-slate-900 dark:text-dark-100">
                  Setup Two-Factor Authenticator
                </h4>
              </div>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-dark-300 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {backupCodes.length > 0 ? (
              /* Success / Backup Codes Screen */
              <div className="space-y-4 text-center">
                <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircleIcon className="size-8" />
                </div>
                <h5 className="font-bold text-sm text-slate-900 dark:text-dark-100">
                  Two-Factor Authentication is Active!
                </h5>
                <p className="text-xs text-slate-500">
                  Save these 5 one-time emergency recovery codes in a secure location. If you lose your phone, you can use these to recover access:
                </p>
                <div className="p-3 bg-slate-50 dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-700 font-mono text-xs text-slate-800 dark:text-dark-200 space-y-1">
                  {backupCodes.map((c, i) => (
                    <div key={i} className="font-bold tracking-wider">{c}</div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={copyBackupCodes}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ClipboardDocumentCheckIcon className="size-4" />
                    {copied ? "Copied!" : "Copy Codes"}
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => setSetupModalOpen(false)}
                    className="bg-[#c5a04e] hover:bg-[#b08d3e] text-white px-4 py-1.5 text-xs font-bold rounded-xl"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              /* QR Code & Code Verification Step */
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-dark-300">
                  Scan this QR code with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or enter the secret key manually:
                </p>

                {qrCodeUrl && (
                  <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200 max-w-xs mx-auto">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="size-48" />
                  </div>
                )}

                <div className="p-2.5 bg-slate-50 dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-700 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Manual Entry Secret Key</span>
                  <span className="font-mono text-xs font-bold text-amber-600 tracking-wider select-all">{totpSecret}</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-dark-200 block mb-1">
                    Enter 6-digit Authenticator Code to verify:
                  </label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="text-center font-mono text-lg font-bold tracking-widest"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-700">
                  <Button
                    onClick={() => setSetupModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onClick={handleActivateTotp}
                    disabled={loading2fa}
                    className="bg-[#c5a04e] hover:bg-[#b08d3e] text-white px-4 py-1.5 text-xs font-bold rounded-xl"
                  >
                    {loading2fa ? "Verifying..." : "Verify & Activate"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DISABLE 2FA CONFIRMATION MODAL */}
      <ConfirmModal
        open={disableModalOpen}
        title="Disable Two-Factor Authentication"
        message="Are you sure you want to disable 2FA? This will lower the security of your Kings Builders director account."
        confirmText="Confirm Disable"
        variant="danger"
        loading={loading2fa}
        onCancel={() => { setDisableModalOpen(false); setPasswordConfirm(""); }}
        onConfirm={handleDisableTotp}
      />
    </div>
  );
}
