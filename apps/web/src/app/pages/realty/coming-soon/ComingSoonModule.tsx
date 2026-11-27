import React, { useState } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  LockClosedIcon,
  SparklesIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export interface FeatureCardItem {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  tag?: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
}

export interface ComingSoonModuleProps {
  title: string;
  tagline: string;
  moduleCode: string;
  eta?: string;
  icon: React.ComponentType<{ className?: string }>;
  features: FeatureCardItem[];
  steps: HowItWorksStep[];
  children: React.ReactNode;
}

export default function ComingSoonModule({
  title,
  tagline,
  moduleCode,
  eta = "Q1 2027",
  icon: IconComponent,
  features,
  steps,
  children,
}: ComingSoonModuleProps) {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [notifyMe, setNotifyMe] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleRequestEarlyAccess = async () => {
    try {
      setRequesting(true);
      const res = await axios.post("/realty/feature-interest", {
        moduleCode,
        note: `User requested early access preview for ${title}`,
      });
      setRequested(true);
      setFeedbackMessage(
        res.data?.message ||
          `Early access requested! Our product engineering team has registered your interest for ${title}.`
      );
    } catch (err: any) {
      console.error("Failed to request early access:", err);
      // Even if API returns error or already exists, acknowledge user intent gracefully
      setRequested(true);
      setFeedbackMessage(
        err.response?.data?.message ||
          "Your early access interest has been noted. We'll be in touch soon!"
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Page title={title}>
      <div className="space-y-8 pb-12">
        {/* Hero Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 p-8 text-white shadow-xl border border-primary-900/40">
          <div className="absolute -right-16 -top-16 size-72 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-16 size-56 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary-600/30 border border-primary-400/40 text-primary-300 shadow-inner">
                <IconComponent className="size-7" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                  <Badge variant="soft" color="warning" className="px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
                    <ClockIcon className="size-3.5" />
                    ETA: {eta}
                  </Badge>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/20 px-2.5 py-0.5 text-xs font-medium text-primary-300 border border-primary-500/30">
                    <SparklesIcon className="size-3" />
                    Private Preview
                  </span>
                </div>
                <p className="max-w-2xl text-sm text-slate-300 leading-relaxed">
                  {tagline}
                </p>
              </div>
            </div>

            {/* CTA Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Notify Me Switch */}
              <button
                type="button"
                onClick={() => setNotifyMe(!notifyMe)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium border transition-all ${
                  notifyMe
                    ? "bg-primary-900/60 border-primary-500/50 text-primary-200"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <BellIcon className={`size-4 ${notifyMe ? "text-primary-400 animate-pulse" : ""}`} />
                <span>Notify me</span>
                <span
                  className={`ml-1 size-2 rounded-full ${
                    notifyMe ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-600"
                  }`}
                />
              </button>

              {/* Request Early Access */}
              <Button
                variant={requested ? "outlined" : "filled"}
                color={requested ? "neutral" : "primary"}
                onClick={handleRequestEarlyAccess}
                disabled={requesting || requested}
                className="gap-2 shadow-lg font-semibold"
              >
                {requested ? (
                  <>
                    <CheckCircleIcon className="size-4 text-emerald-400" />
                    <span>Access Requested</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="size-4" />
                    <span>{requesting ? "Submitting..." : "Request Early Access"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Feedback Toast Banner */}
          {feedbackMessage && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3.5 text-xs text-emerald-200 backdrop-blur-md animate-fadeIn">
              <CheckCircleIcon className="size-5 shrink-0 text-emerald-400" />
              <p className="flex-1 font-medium">{feedbackMessage}</p>
            </div>
          )}
        </div>

        {/* Live Mock Preview Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-primary-500 animate-ping" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Interactive Concept Preview
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <LockClosedIcon className="size-3.5 text-amber-500" />
              <span>Full interaction unlocked in {eta}</span>
            </div>
          </div>

          {/* Mock Frame with Overlay */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden group">
            {/* Ribbon Badge */}
            <div className="absolute top-4 right-4 z-20 pointer-events-none">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 px-3.5 py-1 text-xs font-semibold shadow-lg backdrop-blur-md border border-white/20 dark:border-slate-800/20">
                <LockClosedIcon className="size-3.5 text-amber-400 dark:text-amber-600" />
                <span>Coming Soon — Live Specimen</span>
              </div>
            </div>

            {/* The Live Rendered Mock Content */}
            <div className="p-4 sm:p-6 transition-all duration-300">
              {children}
            </div>

            {/* Subtle Gradient Fog Bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-50/80 dark:from-gray-900/80 to-transparent" />
          </div>
        </div>

        {/* 4-6 Feature Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Key Capabilities & Roadmap Specs
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Engineered for Enterprise Real Estate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat, idx) => {
              const FeatIcon = feat.icon || SparklesIcon;
              return (
                <Card
                  key={idx}
                  className="p-5 flex flex-col justify-between border border-gray-200/80 dark:border-gray-800 hover:border-primary-400/50 dark:hover:border-primary-500/40 transition-all hover:shadow-md group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                        <FeatIcon className="size-5" />
                      </div>
                      {feat.tag && (
                        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                          {feat.tag}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {feat.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 3-Step "How It Will Work" Strip */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              How It Will Work
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Seamless 3-Step Lifecycle
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-primary-600 dark:text-primary-400">
                    {st.step}
                  </span>
                  {idx < steps.length - 1 && (
                    <ArrowRightIcon className="hidden md:block size-4 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {st.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
