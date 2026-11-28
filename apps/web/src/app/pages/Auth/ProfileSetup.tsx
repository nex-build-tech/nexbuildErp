import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Page } from "@/components/shared/Page";
import { Badge, Button, Card, Input } from "@/components/ui";
import { useAuthContext } from "@/app/contexts/auth/context";
import axios from "@/utils/axios";
import KingsLogo from "@/assets/kingsLogo.svg?react";

export default function ProfileSetupPage() {
  const { user, logout, refreshUser } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.fullName || "");
      setPhone((prev) => prev || user.phone || "");
      setEmail((prev) => prev || user.email || "");
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (phone.trim().length < 8) {
      setError("Please enter a valid contact phone number.");
      return;
    }
    if (!email.trim().includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }

    setSaving(true);
    try {
      await axios.patch("/auth/profile", {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      await refreshUser();
      const target = searchParams.get("redirect");
      const safeTarget =
        target && target.startsWith("/") && target !== "/profile-setup" ? target : "/";
      navigate(safeTarget, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete profile setup.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="First Login Profile Setup">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 px-4 py-10">
        <Card className="w-full max-w-lg p-6 sm:p-8 border border-gray-200 dark:border-dark-700 shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-dark-700 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <KingsLogo className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Complete Your Profile
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Required on first login before marking site attendance
                </p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Setup Required
            </Badge>
          </div>

          <div className="mb-5 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-800 dark:text-indigo-200">
            <ShieldCheckIcon className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <div>
              Signed in as <span className="font-semibold">{user?.username}</span>. Please confirm
              your full name, work email, and mobile number so your attendance check-ins and site
              records are accurately verified.
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name *"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              prefix={<UserIcon className="size-4.5" />}
              required
            />

            <Input
              label="Mobile / Phone Number *"
              placeholder="+91 98201 12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              prefix={<PhoneIcon className="size-4.5" />}
              required
            />

            <Input
              label="Work Email *"
              type="email"
              placeholder="name@kingsbuilders.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefix={<EnvelopeIcon className="size-4.5" />}
              required
            />

            <div className="pt-3 flex items-center justify-between gap-3">
              <Button type="button" variant="outlined" onClick={() => void logout()} className="text-xs">
                Sign Out
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs px-5"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {saving ? "Saving Profile..." : "Save & Continue"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
