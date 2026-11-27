import ComingSoonModule, {
  FeatureCardItem,
  HowItWorksStep,
} from "../ComingSoonModule";
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ClockIcon,
  PaperAirplaneIcon,
  BookmarkSquareIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

export default function RealtyCommunicationHubPage() {
  const features: FeatureCardItem[] = [
    {
      title: "Official WhatsApp Business API",
      description:
        "Verified Green Badge messaging with interactive CTA buttons, rich media floorplan carousels, and automated chatbot flows.",
      icon: ChatBubbleLeftRightIcon,
      tag: "WhatsApp API",
    },
    {
      title: "Click-to-Call & Cloud Recordings",
      description:
        "One-click calling via Exotel/Tata Telephony with virtual number masking, call recordings, and speech-to-text transcriptions.",
      icon: PhoneIcon,
      tag: "Telephony",
    },
    {
      title: "Two-Way DLT SMS & Smart RCS",
      description:
        "TRAI/DLT compliant transactional and promotional SMS with rich branded RCS cards and high-conversion landing page snippets.",
      icon: ChatBubbleLeftRightIcon,
      tag: "SMS / RCS",
    },
    {
      title: "Automated Multi-Channel Drip Journeys",
      description:
        "Trigger customized nurture cadences across WhatsApp, SMS, and Email when leads download brochures or attend site visits.",
      icon: ArrowPathIcon,
      tag: "Drips",
    },
    {
      title: "High-Throughput Broadcast Campaigns",
      description:
        "Send bulk festival announcements, price increase alerts, and project launch invitations with live deliverability and read rates.",
      icon: MegaphoneIcon,
      tag: "Broadcasts",
    },
    {
      title: "Auto-Log to Lead 360 Timeline",
      description:
        "Every incoming WhatsApp chat, telephonic call duration, recording URL, and email response automatically indexes on the lead profile.",
      icon: EnvelopeIcon,
      tag: "Audit Trail",
    },
  ];

  const steps: HowItWorksStep[] = [
    {
      step: "01",
      title: "Connect Channels in Minutes",
      description:
        "Plug Meta WhatsApp Business API and cloud telephony credentials into BuildERP using our guided webhook setup wizard.",
    },
    {
      step: "02",
      title: "Omnichannel Shared Inbox",
      description:
        "Sales reps handle buyer WhatsApp chats, phone calls, and cost sheet deliveries from a unified desktop and mobile interface.",
    },
    {
      step: "03",
      title: "Automated Lead Enrichment",
      description:
        "Customer responses trigger stage transitions, auto-schedule follow-ups, and log interaction history into Lead 360 without manual data entry.",
    },
  ];

  return (
    <ComingSoonModule
      title="Omnichannel Communication Hub"
      tagline="Unify Meta WhatsApp Business API, cloud telephony, two-way SMS, and smart drip workflows into a centralized sales inbox."
      moduleCode="REALTY_COMMUNICATION_HUB"
      eta="Q1 2027"
      icon={ChatBubbleLeftRightIcon}
      features={features}
      steps={steps}
    >
      {/* Live Omnichannel Messenger Mockup */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 overflow-hidden shadow-inner">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          {/* Left Panel: Conversation Roster (4 cols) */}
          <div className="lg:col-span-4 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Active Conversations (24)
              </span>
              <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 px-2 py-0.5 rounded-full">
                Live Webhook
              </span>
            </div>

            {/* Conversation Items */}
            <div className="space-y-1.5">
              <div className="rounded-xl bg-primary-50/80 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 p-3 space-y-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Vikram Malhotra
                    </span>
                    <CheckBadgeIcon className="size-3.5 text-blue-500" />
                  </div>
                  <span className="text-[10px] text-gray-400">11:42 AM</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  Can we visit Kings Heights this Saturday at 3 PM?
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded">
                    WhatsApp
                  </span>
                  <span className="text-[9px] bg-primary-500/10 text-primary-600 font-bold px-1.5 py-0.5 rounded">
                    Site Visit Intended
                  </span>
                </div>
              </div>

              <div className="rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 p-3 space-y-1 cursor-pointer transition-colors border border-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-gray-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Ananya Roy
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">Yesterday</span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  Thanks for sending the 2BHK cost sheet. Reviewing with my spouse.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[9px] bg-blue-500/10 text-blue-600 font-bold px-1.5 py-0.5 rounded">
                    Exotel Call
                  </span>
                  <span className="text-[9px] bg-amber-500/10 text-amber-600 font-bold px-1.5 py-0.5 rounded">
                    Hot Lead (92)
                  </span>
                </div>
              </div>

              <div className="rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 p-3 space-y-1 cursor-pointer transition-colors border border-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-gray-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Deepak Parekh
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">16-Nov</span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  Token transfer completed. Please send the allotment letter.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[9px] bg-purple-500/10 text-purple-600 font-bold px-1.5 py-0.5 rounded">
                    SMS Gateway
                  </span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded">
                    Booked Unit A-0803
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel: Active Chat Thread (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-800">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs">
                  VM
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Vikram Malhotra
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 rounded">
                      WhatsApp Verified
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    +91 98201 44892 • Budget: ₹1.6 - ₹1.8 Cr
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-primary-600">
                  <PhoneIcon className="size-4" />
                </button>
              </div>
            </div>

            {/* Chat Bubbles */}
            <div className="space-y-3 py-4 text-xs">
              {/* Developer WhatsApp Template Message */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 p-3 space-y-2 text-gray-800 dark:text-gray-200 shadow-sm">
                  <div className="font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                    <BookmarkSquareIcon className="size-4" />
                    Kings Heights Project Overview
                  </div>
                  <p>
                    Hello Mr. Vikram! Welcome to Kings Heights, Bandra West. Here is the requested 2BHK Floor Plan and RERA approval certificate.
                  </p>
                  <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between">
                    <span className="font-mono text-[10px]">Tower_B_2BHK_725sqft.pdf</span>
                    <span className="text-[10px] text-primary-600 font-bold cursor-pointer">Preview</span>
                  </div>
                  <div className="flex items-center justify-end text-[9px] text-gray-400">
                    11:30 AM
                  </div>
                </div>
              </div>

              {/* Customer Response */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-600 text-white p-3 space-y-1 shadow-sm">
                  <p>
                    Thanks! The layout looks great. Can we schedule a site visit this Saturday at 3 PM to see Tower B 14th floor?
                  </p>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-100">
                    <span>11:42 AM</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Composer Mock */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="Confirmed Saturday 3:00 PM slot. Sending visit pass..."
                className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-300"
              />
              <button
                type="button"
                className="size-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow"
              >
                <PaperAirplaneIcon className="size-4" />
              </button>
            </div>
          </div>

          {/* Right Panel: Template Picker & Lead Card (3 cols) */}
          <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-950 p-4 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                Quick Templates
              </span>
              <div className="space-y-1.5">
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2.5 text-xs hover:border-primary-500 cursor-pointer transition-all">
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <DocumentDuplicateIcon className="size-3.5 text-primary-500" />
                    Site Visit Pass (QR)
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Automated gate entry pass</div>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2.5 text-xs hover:border-primary-500 cursor-pointer transition-all">
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <DocumentDuplicateIcon className="size-3.5 text-primary-500" />
                    Cost Sheet PDF Delivery
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Pre-calculated with discounts</div>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2.5 text-xs hover:border-primary-500 cursor-pointer transition-all">
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <DocumentDuplicateIcon className="size-3.5 text-primary-500" />
                    Festive 5% Stamp Duty Waiver
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Broadcast promo template</div>
                </div>
              </div>
            </div>

            {/* Quick Call Summary */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Last Exotel Call</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Priya Nair (Sales Exec)</span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  4m 18s
                </span>
              </div>
              <div className="rounded bg-gray-50 dark:bg-gray-800 p-1.5 text-[10px] font-mono text-gray-500 truncate">
                rec_20261117_exotel_98201.mp3
              </div>
            </div>
          </div>
        </div>
      </div>
    </ComingSoonModule>
  );
}
