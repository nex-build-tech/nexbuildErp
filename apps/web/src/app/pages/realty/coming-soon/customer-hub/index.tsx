import ComingSoonModule, {
  FeatureCardItem,
  HowItWorksStep,
} from "../ComingSoonModule";
import {
  UserCircleIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CameraIcon,
  WrenchScrewdriverIcon,
  GiftIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function RealtyCustomerHubPage() {
  const features: FeatureCardItem[] = [
    {
      title: "Self-Serve Ledger & Statement of Account",
      description:
        "Homebuyers access real-time financial statements detailing every demand, receipt, GST breakdown, and TDS credit 24/7.",
      icon: DocumentTextIcon,
      tag: "Financials",
    },
    {
      title: "Download Receipts, NOCs & Letters",
      description:
        "One-click generation and instant download of digitally stamped payment receipts, demand notes, allotment letters, and bank NOCs.",
      icon: ArrowDownTrayIcon,
      tag: "Documents",
    },
    {
      title: "Instant Pay via UPI & NetBanking",
      description:
        "Frictionless payment collection via Bharat UPI QR, debit/credit cards, and NetBanking with automated instant receipt issuance.",
      icon: BanknotesIcon,
      tag: "Payments",
    },
    {
      title: "Live Construction Photos & DPR Updates",
      description:
        "Direct verified feed of site engineer Daily Progress Report (DPR) photos, slab casting milestones, and civil delivery timelines.",
      icon: CameraIcon,
      tag: "Civil Progress",
    },
    {
      title: "Service Requests & Snagging Management",
      description:
        "Post-possession handover portal allowing owners to log snags with photo attachments and track resolution SLAs in real time.",
      icon: WrenchScrewdriverIcon,
      tag: "Support",
    },
    {
      title: "Referral & Loyalty Rewards Engine",
      description:
        "Empower happy homeowners to refer colleagues and family members, tracking referral statuses and automated milestone payouts.",
      icon: GiftIcon,
      tag: "Growth",
    },
  ];

  const steps: HowItWorksStep[] = [
    {
      step: "01",
      title: "Instant Buyer Activation",
      description:
        "Upon booking approval, the buyer receives an automated WhatsApp and SMS with a secure passwordless login magic-link.",
    },
    {
      step: "02",
      title: "Milestone Tracking & Demands",
      description:
        "As civil engineers complete slabs in BuildERP, demand letters and verified DPR photo streams appear instantly in the buyer hub.",
    },
    {
      step: "03",
      title: "1-Click UPI & Auto-Reconciliation",
      description:
        "Buyers settle dues with zero friction. Payments reconcile directly into the customer ledger and generate two-copy PDF receipts.",
    },
  ];

  return (
    <ComingSoonModule
      title="Customer Experience Hub"
      tagline="Empower homebuyers with a modern, mobile-first self-serve portal for milestone tracking, UPI collections, receipts, and live DPR updates."
      moduleCode="REALTY_CUSTOMER_HUB"
      eta="Q1 2027"
      icon={UserCircleIcon}
      features={features}
      steps={steps}
    >
      {/* Interactive Mobile Phone Mockup */}
      <div className="flex justify-center py-6">
        <div className="relative w-full max-w-[380px] rounded-[42px] border-[10px] border-slate-800 bg-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-950">
          {/* Dynamic Island / Speaker Notch */}
          <div className="absolute top-2 inset-x-0 flex justify-center z-30">
            <div className="h-5 w-28 bg-black rounded-full flex items-center justify-between px-3">
              <span className="size-2 rounded-full bg-slate-800" />
              <span className="size-2 rounded-full bg-blue-900" />
            </div>
          </div>

          {/* Phone Screen Content */}
          <div className="bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-5 pt-10 min-h-[580px] space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary-600 dark:text-primary-400">
                  Kings Heights Tower B
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Rahul Sharma
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                <ShieldCheckIcon className="size-3" />
                Unit B-1402
              </span>
            </div>

            {/* Next Due Milestone Card */}
            <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-800 p-4 text-white shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-primary-100">
                <span>Milestone Stage 12</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-medium">Due in 6 Days</span>
              </div>
              <div>
                <span className="text-xs text-primary-200">Next Payment Due</span>
                <div className="text-2xl font-black tracking-tight">₹4,20,000</div>
                <div className="text-[11px] text-primary-200 mt-0.5">Due on 15-Jan-2027 (12th Slab Casting)</div>
              </div>
              <button
                type="button"
                className="w-full mt-2 rounded-xl bg-white text-primary-700 font-bold text-xs py-2.5 shadow hover:bg-primary-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <BanknotesIcon className="size-4" />
                <span>Pay ₹4,20,000 via UPI / NetBanking</span>
              </button>
            </div>

            {/* Construction Progress Bar */}
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Construction Velocity</span>
                <span className="font-mono font-bold text-primary-600 dark:text-primary-400">64% Completed</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-primary-500 h-2 rounded-full w-[64%]" />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Plinth & Podiums (Done)</span>
                <span>12 of 19 Slabs Cast</span>
              </div>
            </div>

            {/* Live DPR Photos Strip */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <CameraIcon className="size-3.5 text-primary-500" />
                  Site DPR Photos (Verified)
                </span>
                <span className="text-[10px] text-primary-600 dark:text-primary-400 font-medium cursor-pointer">
                  View All (18)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800 bg-slate-800 aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                  <div className="w-full h-full bg-gradient-to-br from-amber-700/60 to-slate-800 flex items-center justify-center text-xs font-bold text-white/80">
                    Slab 12 Rebar
                  </div>
                  <span className="absolute bottom-1 inset-x-1 text-[8px] text-white z-20 font-medium truncate">
                    12th Slab
                  </span>
                </div>
                <div className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800 bg-slate-800 aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                  <div className="w-full h-full bg-gradient-to-br from-blue-700/60 to-slate-800 flex items-center justify-center text-xs font-bold text-white/80">
                    Plumbing Conduits
                  </div>
                  <span className="absolute bottom-1 inset-x-1 text-[8px] text-white z-20 font-medium truncate">
                    Internal MEP
                  </span>
                </div>
                <div className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800 bg-slate-800 aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                  <div className="w-full h-full bg-gradient-to-br from-emerald-700/60 to-slate-800 flex items-center justify-center text-xs font-bold text-white/80">
                    Plaster Curing
                  </div>
                  <span className="absolute bottom-1 inset-x-1 text-[8px] text-white z-20 font-medium truncate">
                    Elevation
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Documents & Receipts */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Recent Documents
              </span>
              <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="size-4 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Receipt KB/RC/26-27/0084</div>
                    <div className="text-[10px] text-gray-400">₹6,50,000 • Stage 11 Plinth</div>
                  </div>
                </div>
                <button type="button" className="text-primary-600 dark:text-primary-400 hover:underline text-[10px] font-bold">
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ComingSoonModule>
  );
}
