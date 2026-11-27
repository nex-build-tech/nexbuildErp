import ComingSoonModule, {
  FeatureCardItem,
  HowItWorksStep,
} from "../ComingSoonModule";
import {
  ChartBarIcon,
  TableCellsIcon,
  EnvelopeOpenIcon,
  PresentationChartLineIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

export default function RealtyAnalyticsPage() {
  const features: FeatureCardItem[] = [
    {
      title: "Drag-and-Drop Ad-Hoc Report Designer",
      description:
        "Build bespoke tabular and pivot MIS reports in seconds by dragging dimensions, measures, and calculated formula columns.",
      icon: TableCellsIcon,
      tag: "Pivot Builder",
    },
    {
      title: "Scheduled Boardroom MIS Email Digests",
      description:
        "Automate dispatch of weekly and monthly PDF/Excel executive summaries to promoters, partners, and financial institutions.",
      icon: EnvelopeOpenIcon,
      tag: "Automation",
    },
    {
      title: "Project P&L & Cost Reconciliation",
      description:
        "Unified financial bridge linking real estate sales inflows directly with BuildERP construction material and subcontractor outflows.",
      icon: ScaleIcon,
      tag: "P&L Bridge",
    },
    {
      title: "Cohort Velocity & Channel Attribution",
      description:
        "Analyze lead-to-booking turnaround times, CP conversion ratios, and acquisition cost per sq.ft across quarterly cohorts.",
      icon: FunnelIcon,
      tag: "Attribution",
    },
    {
      title: "Inventory Aging & Price Realization",
      description:
        "Visual heatmaps tracking absorption velocity, inventory staleness, floor-rise premiums, and realized rate per carpet sq.ft.",
      icon: PresentationChartLineIcon,
      tag: "Inventory Heatmap",
    },
    {
      title: "One-Click Formatted Board Exports",
      description:
        "Export audit-ready multi-tab workbooks to Excel (.xlsx) with live formulas, or presentation-ready high-resolution PDFs.",
      icon: DocumentArrowDownIcon,
      tag: "Exports",
    },
  ];

  const steps: HowItWorksStep[] = [
    {
      step: "01",
      title: "Unified Data Warehouse Ingestion",
      description:
        "Realty transactions, CRM leads, and BuildERP civil construction costs are continuously aggregated into an optimized columnar store.",
    },
    {
      step: "02",
      title: "Interactive Ad-Hoc Exploration",
      description:
        "Filter by wing, floor range, payment scheme, or CP tier using intuitive multi-select controls with sub-second recalculation.",
    },
    {
      step: "03",
      title: "Automated Executive Distribution",
      description:
        "Schedule high-impact executive decks to automatically land in boardroom inboxes every Monday morning at 8:00 AM.",
    },
  ];

  return (
    <ComingSoonModule
      title="Executive Realty Analytics & MIS"
      tagline="Deep operational visibility into sales velocity, project cash flows, cost reconciliation, and cohort conversions."
      moduleCode="REALTY_ANALYTICS"
      eta="Q2 2027"
      icon={ChartBarIcon}
      features={features}
      steps={steps}
    >
      <div className="space-y-6">
        {/* Top: Drag & Drop Dimension Control Bar */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Interactive Report Canvas Builder
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Dataset: Kings Heights Tower A & B</span>
              <span className="rounded bg-primary-100 dark:bg-primary-950 text-primary-600 px-2 py-0.5 text-[10px] font-bold">
                Live OLAP
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-400 text-[11px] font-medium mr-1">Dimensions:</span>
            <span className="rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 px-2.5 py-1 font-semibold flex items-center gap-1">
              <span>Tower & Wing</span>
              <span className="text-[10px] opacity-60">×</span>
            </span>
            <span className="rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 px-2.5 py-1 font-semibold flex items-center gap-1">
              <span>Unit Category (1BHK/2BHK)</span>
              <span className="text-[10px] opacity-60">×</span>
            </span>
            <span className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 px-2.5 py-1 font-medium hover:border-gray-400 cursor-pointer">
              + Drag Dimension
            </span>

            <span className="text-gray-400 text-[11px] font-medium ml-3 mr-1">Measures:</span>
            <span className="rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 font-semibold flex items-center gap-1">
              <span>Realized Collections (₹)</span>
              <span className="text-[10px] opacity-60">×</span>
            </span>
            <span className="rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 font-semibold flex items-center gap-1">
              <span>Carpet Rate (₹/sqft)</span>
              <span className="text-[10px] opacity-60">×</span>
            </span>
          </div>
        </div>

        {/* Executive KPI Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1">
            <span className="text-[11px] font-medium text-gray-400">Total Booked Value</span>
            <div className="text-xl font-black text-gray-900 dark:text-white">₹118.5 Cr</div>
            <div className="text-[10px] text-emerald-600 font-semibold">+18.2% vs target</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1">
            <span className="text-[11px] font-medium text-gray-400">Realized Collections</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹74.2 Cr</div>
            <div className="text-[10px] text-gray-400">92.4% collection efficiency</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1">
            <span className="text-[11px] font-medium text-gray-400">BuildERP Project Cost</span>
            <div className="text-xl font-black text-slate-800 dark:text-slate-200">₹48.5 Cr</div>
            <div className="text-[10px] text-gray-400">Material + Subcontractors</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1">
            <span className="text-[11px] font-medium text-gray-400">Net Project Margin</span>
            <div className="text-xl font-black text-primary-600 dark:text-primary-400">+₹25.7 Cr</div>
            <div className="text-[10px] text-primary-600 font-semibold">34.6% Project ROI</div>
          </div>
        </div>

        {/* 3 Executive Analytics Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Chart 1: Collections vs Demands */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Demands vs Collections (₹ Cr)
              </span>
              <span className="text-[10px] text-gray-400">Last 6 Months</span>
            </div>
            {/* Visual Simulated Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-32">
                  <div className="w-1/2 bg-primary-300 dark:bg-primary-900 h-[65%] rounded-t" />
                  <div className="w-1/2 bg-emerald-500 h-[60%] rounded-t" />
                </div>
                <span className="text-[10px] text-gray-400">Jul</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-32">
                  <div className="w-1/2 bg-primary-300 dark:bg-primary-900 h-[80%] rounded-t" />
                  <div className="w-1/2 bg-emerald-500 h-[75%] rounded-t" />
                </div>
                <span className="text-[10px] text-gray-400">Aug</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-32">
                  <div className="w-1/2 bg-primary-300 dark:bg-primary-900 h-[70%] rounded-t" />
                  <div className="w-1/2 bg-emerald-500 h-[68%] rounded-t" />
                </div>
                <span className="text-[10px] text-gray-400">Sep</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-32">
                  <div className="w-1/2 bg-primary-300 dark:bg-primary-900 h-[95%] rounded-t" />
                  <div className="w-1/2 bg-emerald-500 h-[90%] rounded-t" />
                </div>
                <span className="text-[10px] text-gray-400">Oct</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-32">
                  <div className="w-1/2 bg-primary-300 dark:bg-primary-900 h-[85%] rounded-t" />
                  <div className="w-1/2 bg-emerald-500 h-[82%] rounded-t" />
                </div>
                <span className="text-[10px] text-gray-400">Nov</span>
              </div>
            </div>
            <div className="flex justify-center items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="size-2 bg-primary-400 rounded-sm" /> Demand Billed
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 bg-emerald-500 rounded-sm" /> Collection Received
              </span>
            </div>
          </div>

          {/* Chart 2: Lead Funnel & Conversion Cohorts */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Sales Conversion Funnel
              </span>
              <span className="text-[10px] text-gray-400">Conversion: 5.9%</span>
            </div>
            {/* Visual Funnel */}
            <div className="space-y-2 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Total Leads Inflow</span>
                  <span className="font-mono font-bold">1,420</span>
                </div>
                <div className="w-full bg-primary-100 dark:bg-primary-950/80 rounded-full h-3 overflow-hidden">
                  <div className="bg-primary-600 h-3 rounded-full w-full" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Qualified Enquiries</span>
                  <span className="font-mono font-bold">680 (48%)</span>
                </div>
                <div className="w-full bg-primary-100 dark:bg-primary-950/80 rounded-full h-3 overflow-hidden">
                  <div className="bg-primary-500 h-3 rounded-full w-[48%]" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Site Visits Attended</span>
                  <span className="font-mono font-bold">245 (17%)</span>
                </div>
                <div className="w-full bg-primary-100 dark:bg-primary-950/80 rounded-full h-3 overflow-hidden">
                  <div className="bg-indigo-500 h-3 rounded-full w-[17%]" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Confirmed Bookings</span>
                  <span className="font-mono font-bold text-emerald-600">84 (5.9%)</span>
                </div>
                <div className="w-full bg-emerald-100 dark:bg-emerald-950/80 rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-500 h-3 rounded-full w-[6%]" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center pt-1">
              Average sales velocity: 22 days from lead to booking
            </p>
          </div>

          {/* Chart 3: Project P&L & Cash Flow Sync */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Project Cash Flow Bridge
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Positive Cash Flow</span>
            </div>
            <div className="h-44 flex flex-col justify-between py-2 space-y-2 text-xs">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-emerald-700 dark:text-emerald-400">Realty Inflows</span>
                  <span className="font-mono">+₹74.2 Cr</span>
                </div>
                <span className="text-[10px] text-gray-500">Milestone receipts & tokens</span>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-2.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-red-700 dark:text-red-400">BuildERP Outflows</span>
                  <span className="font-mono">-₹48.5 Cr</span>
                </div>
                <span className="text-[10px] text-gray-500">Cement, steel & contractor RA bills</span>
              </div>
              <div className="rounded-lg bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 p-2.5">
                <div className="flex justify-between font-bold text-primary-700 dark:text-primary-300">
                  <span>Net Project Surplus</span>
                  <span className="font-mono">+₹25.7 Cr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ComingSoonModule>
  );
}
