import ComingSoonModule, {
  FeatureCardItem,
  HowItWorksStep,
} from "../ComingSoonModule";
import {
  Square3Stack3DIcon,
  ArrowsRightLeftIcon,
  CreditCardIcon,
  BookOpenIcon,
  PhoneIcon,
  DocumentCheckIcon,
  KeyIcon,
  CheckCircleIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";

export default function RealtyIntegrationsPage() {
  const features: FeatureCardItem[] = [
    {
      title: "Zero-Latency Lead Webhooks",
      description:
        "Capture prospective buyers from Meta Ads, Google Ads, and property portals within 200ms with instant round-robin routing.",
      icon: ArrowsRightLeftIcon,
      tag: "Lead Ingestion",
    },
    {
      title: "Two-Way Tally Prime Accounting",
      description:
        "Already active in BuildERP! Automatically syncs approved customer receipts, GST liabilities, and bank reconciliations.",
      icon: BookOpenIcon,
      tag: "Accounting",
    },
    {
      title: "RERA Escrow Split Payments",
      description:
        "Connect Razorpay/PayU to automatically split buyer collections into 70% RERA Escrow account and 30% Operational account.",
      icon: CreditCardIcon,
      tag: "Payments",
    },
    {
      title: "Cloud Telephony & Virtual IVR",
      description:
        "Full integration with Exotel, Tata Tele, and Knowlarity for click-to-dial, call recording storage, and missed call capture.",
      icon: PhoneIcon,
      tag: "Telephony",
    },
    {
      title: "Aadhaar e-Sign & Digital Stamp Paper",
      description:
        "Execute legally binding Allotment Letters, Builder-Buyer Agreements, and Demand Letters via Leegality and DocuSign.",
      icon: DocumentCheckIcon,
      tag: "e-Sign",
    },
    {
      title: "Developer REST APIs & Webhooks",
      description:
        "Full programmatic access with rate-limited API keys, HMAC-SHA256 signed event webhooks, and OpenAPI / Swagger specs.",
      icon: KeyIcon,
      tag: "Developer API",
    },
  ];

  const steps: HowItWorksStep[] = [
    {
      step: "01",
      title: "1-Click Credential Auth",
      description:
        "Select your integration card, input your API tokens or OAuth authorization, and verify connection health with live pings.",
    },
    {
      step: "02",
      title: "Visual Schema Mapping",
      description:
        "Map incoming webhooks or outgoing ledger vouchers to your BuildERP fields using intuitive dropdown field pickers.",
    },
    {
      step: "03",
      title: "Automated Resilient Execution",
      description:
        "BuildERP queues requests via BullMQ with automatic retries, dead-letter logging, and instant failure alerts.",
    },
  ];

  const integrationCards = [
    {
      name: "Tally Prime / ERP 9",
      category: "Accounting & GST",
      desc: "Live in BuildERP. Syncs receipt vouchers, customer accounts, and tax ledgers.",
      status: "connected",
      badgeText: "Connected (Live)",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
      dotColor: "bg-emerald-500",
    },
    {
      name: "Meta Lead Ads",
      category: "Ad Networks",
      desc: "Instant webhook capture from Facebook and Instagram lead gen campaigns.",
      status: "ready",
      badgeText: "Ready to Sync",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300",
      dotColor: "bg-blue-500",
    },
    {
      name: "Google Ads (P-Max)",
      category: "Ad Networks",
      desc: "Capture search leads & push offline conversion signals back to Google.",
      status: "ready",
      badgeText: "Ready to Sync",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300",
      dotColor: "bg-blue-500",
    },
    {
      name: "99acres & MagicBricks",
      category: "Property Portals",
      desc: "Automated XML/REST enquiry ingestion and project inventory syndication.",
      status: "connected",
      badgeText: "Connected",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
      dotColor: "bg-emerald-500",
    },
    {
      name: "Housing.com",
      category: "Property Portals",
      desc: "Verified developer feed, brochure leads, and instant agent assignment.",
      status: "ready",
      badgeText: "Ready to Sync",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300",
      dotColor: "bg-blue-500",
    },
    {
      name: "Razorpay & PayU",
      category: "Payment Gateway",
      desc: "Instant UPI QR, Debit/Credit Card checkout with 70:30 RERA escrow splitting.",
      status: "config",
      badgeText: "Configure",
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300",
      dotColor: "bg-amber-500",
    },
    {
      name: "Exotel Cloud Telephony",
      category: "Telephony & IVR",
      desc: "Virtual numbers, click-to-dial, call recordings, and missed call leads.",
      status: "connected",
      badgeText: "Connected",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
      dotColor: "bg-emerald-500",
    },
    {
      name: "Leegality / DocuSign",
      category: "Digital Signature",
      desc: "Aadhaar e-Sign and digital stamp duty for allotment letters and agreements.",
      status: "connected",
      badgeText: "Connected",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
      dotColor: "bg-emerald-500",
    },
    {
      name: "Google Calendar",
      category: "Scheduling",
      desc: "Two-way site visit synchronization for sales executives and prospects.",
      status: "connected",
      badgeText: "Connected",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
      dotColor: "bg-emerald-500",
    },
    {
      name: "Custom Webhooks & REST API",
      category: "Developer Platform",
      desc: "Signed outbound webhooks and JWT-authenticated REST APIs with OpenAPI docs.",
      status: "active",
      badgeText: "API Active",
      badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300",
      dotColor: "bg-purple-500",
    },
  ];

  return (
    <ComingSoonModule
      title="Connected Integrations Marketplace"
      tagline="Plug BuildERP seamlessly into ad networks, property portals, payment gateways, e-signature engines, and accounting tools."
      moduleCode="REALTY_INTEGRATIONS"
      eta="Q1 2027"
      icon={Square3Stack3DIcon}
      features={features}
      steps={steps}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CommandLineIcon className="size-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Enterprise Connectors Directory (10 Available Connectors)
            </h3>
          </div>
          <span className="text-xs text-gray-500">
            Automated BullMQ Queue • 99.98% Uptime
          </span>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {integrationCards.map((conn, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2.5 shadow-sm hover:border-primary-400/60 dark:hover:border-primary-500/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {conn.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${conn.badgeColor}`}
                  >
                    <span className={`size-1.5 rounded-full ${conn.dotColor}`} />
                    {conn.badgeText}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  {conn.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {conn.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-400">OAuth / API Key</span>
                <span className="text-primary-600 dark:text-primary-400 font-semibold text-[11px] cursor-pointer hover:underline flex items-center gap-1">
                  Manage Connector
                  <CheckCircleIcon className="size-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ComingSoonModule>
  );
}
