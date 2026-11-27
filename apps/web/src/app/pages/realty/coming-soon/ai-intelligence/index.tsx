import ComingSoonModule, {
  FeatureCardItem,
  HowItWorksStep,
} from "../ComingSoonModule";
import {
  SparklesIcon,
  BoltIcon,
  CpuChipIcon,
  ChatBubbleBottomCenterTextIcon,
  MicrophoneIcon,
  LightBulbIcon,
  CheckCircleIcon,
  PhoneArrowUpRightIcon,
} from "@heroicons/react/24/outline";

export default function RealtyAiIntelligencePage() {
  const features: FeatureCardItem[] = [
    {
      title: "Predictive Lead Scoring & Propensity",
      description:
        "Deep learning models evaluate 40+ signals—site visits, brochure downloads, loan eligibility, family attendance—to forecast booking probability.",
      icon: BoltIcon,
      tag: "ML Scoring",
    },
    {
      title: "Autonomous AI Voice Call-Back Agent",
      description:
        "Instantly initiates conversational AI phone calls within 30 seconds of an online enquiry, qualifying budget and scheduling site visits.",
      icon: MicrophoneIcon,
      tag: "Voice AI",
    },
    {
      title: "Call Summarization & Sentiment Analysis",
      description:
        "Speech-to-text NLP transcribes sales calls, highlighting buyer objections, price sensitivities, and emotional sentiment curves.",
      icon: ChatBubbleBottomCenterTextIcon,
      tag: "Speech NLP",
    },
    {
      title: "Contextual Next-Best-Action Engine",
      description:
        "Proactively suggests the exact next step for every lead—e.g. 'Offer 5th Floor unit with subvention scheme before 4 PM today'.",
      icon: LightBulbIcon,
      tag: "Copilot",
    },
    {
      title: "Natural Language CRM Analytics",
      description:
        "Ask questions in plain English: 'Compare 2BHK conversion rates between Meta Ads and Channel Partners for Tower B'.",
      icon: CpuChipIcon,
      tag: "NL Query",
    },
    {
      title: "AI Demand & Recovery Assistant",
      description:
        "Drafts hyper-personalized payment reminders matching each buyer's relationship history to accelerate collection recoveries.",
      icon: SparklesIcon,
      tag: "Collections",
    },
  ];

  const steps: HowItWorksStep[] = [
    {
      step: "01",
      title: "Zero-Setup Signal Aggregation",
      description:
        "Realty AI connects to your CRM calls, WhatsApp chats, portal webhooks, and payment histories without complex data engineering.",
    },
    {
      step: "02",
      title: "Continuous Machine Learning",
      description:
        "Proprietary real-estate models detect high-intent behavioral patterns and flag stall risks before opportunities go cold.",
    },
    {
      step: "03",
      title: "Actionable Sales Superpowers",
      description:
        "Sales reps receive tailored call scripts, objection-handling tips, and automated follow-up drafts directly on their desk.",
    },
  ];

  return (
    <ComingSoonModule
      title="Realty AI Intelligence & Copilot"
      tagline="Supercharge your sales force with predictive booking propensity models, conversational voice agents, and automated call summaries."
      moduleCode="REALTY_AI_INTELLIGENCE"
      eta="Q2 2027"
      icon={SparklesIcon}
      features={features}
      steps={steps}
    >
      {/* Live AI Copilot Panel Mockup */}
      <div className="space-y-6">
        {/* Top: "Ask AI" Interactive Copilot Panel */}
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-gray-900 dark:to-purple-950/20 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <SparklesIcon className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Realty Copilot (Gemini 2.5 Pro Real Estate Engine)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Natural Language Intent Analysis & Propensity Ranking
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Model: Realty-Propensity-v3
            </span>
          </div>

          {/* Prompt Bar Mock */}
          <div className="relative">
            <input
              type="text"
              readOnly
              value="Which leads are most likely to book a 2BHK in Tower B before month-end?"
              className="w-full rounded-xl bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800/80 px-4 py-3 text-xs font-medium text-gray-800 dark:text-gray-100 shadow-sm pr-24"
            />
            <button
              type="button"
              className="absolute right-1.5 top-1.5 bottom-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <SparklesIcon className="size-3.5" />
              <span>Synthesizing</span>
            </button>
          </div>

          {/* AI Response Card */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-white/80 dark:bg-gray-800/80 p-4 space-y-3 text-xs backdrop-blur-sm">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon className="size-4 text-emerald-500" />
                AI Analysis: 4 High-Probability Opportunities Identified (₹5.85 Cr Pipeline)
              </span>
              <span className="text-[10px] text-gray-400">Confidence: 94%</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Based on recent interactions, <strong className="text-gray-900 dark:text-white">Rajesh Singhal</strong> and{" "}
              <strong className="text-gray-900 dark:text-white">Vikram Malhotra</strong> have visited Tower B 2+ times with family members, have HDFC Home Loan pre-approvals, and spent &gt;4 minutes reviewing the 14th-floor cost sheets.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Rajesh Singhal</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">96% Propensity</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Recommended: Offer Unit B-1602 with 2% festival waiver today.</p>
              </div>
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Vikram Malhotra</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">91% Propensity</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Recommended: Confirm Saturday site visit pass via WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Propensity Gauge + AI Call Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Propensity Gauge Card (4 cols) */}
          <div className="md:col-span-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Lead Propensity Gauge
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                Very High
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div className="relative flex items-center justify-center size-32">
                <div className="size-32 rounded-full border-8 border-gray-100 dark:border-gray-800" />
                <div className="absolute size-32 rounded-full border-8 border-emerald-500 border-t-transparent border-l-transparent -rotate-45" />
                <div className="text-center">
                  <span className="font-mono text-3xl font-black text-gray-900 dark:text-white">88%</span>
                  <span className="text-[10px] text-gray-400 block -mt-1">Close Probability</span>
                </div>
              </div>
            </div>

            {/* Factor breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Family Site Visit</span>
                <span className="font-semibold text-emerald-600">+30%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Pre-Approved Bank Loan</span>
                <span className="font-semibold text-emerald-600">+25%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Cost Sheet Downloads (3x)</span>
                <span className="font-semibold text-emerald-600">+18%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Floor Preference Match</span>
                <span className="font-semibold text-emerald-600">+15%</span>
              </div>
            </div>
          </div>

          {/* Call Summary & Sentiment Card (7 cols) */}
          <div className="md:col-span-7 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneArrowUpRightIcon className="size-4 text-primary-500" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  AI Call Transcription & Sentiment
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Sentiment: Highly Positive (92%)
              </span>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-500 text-[11px]">
                <span>Contact: Vikram Mehta (98201-XXXXX)</span>
                <span>Call Duration: 6m 42s • Today, 10:15 AM</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                &ldquo;Buyer expressed high interest in 2 BHK east-facing units above the 14th floor. Primary decision criteria is carpet area efficiency and possession by Q4 2027. Asked if stamp duty waiver can be applied if token is paid this week.&rdquo;
              </p>
            </div>

            {/* Next-Best-Action Box */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                <LightBulbIcon className="size-4 text-amber-500" />
                <span>Recommended Next-Best-Action</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Dispatch revised cost sheet for <strong>Unit B-1604</strong> with the 5% festive stamp duty waiver scheme, and schedule in-person token closing for Saturday at 3:00 PM.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ComingSoonModule>
  );
}
