import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { MarketingLayout } from '../../components/marketing/MarketingLayout';
import { FinalCtaSection } from '../../components/marketing/FinalCtaSection';
import { HOW_IT_WORKS_STEPS, PORTAL_SHOWCASE_ITEMS } from '../../data/marketingContent';
import { usePageMeta } from '../../utils/seo';

export function HowItWorksPage() {
  usePageMeta(
    'How It Works | Sentinel GuardOps',
    'See how security companies register, configure client sites and guards, capture live field occurrence logs, and verify shift reports in Sentinel GuardOps.',
  );

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-14 sm:py-20 bg-[#10213D] text-white border-b border-[#1E355C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-3">
              Operational Workflow
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              How Sentinel GuardOps Works
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Four structured steps connect your head office, supervisors, and deployed field guards
              under one accountable daily operational cycle.
            </p>
          </div>
        </div>
      </section>

      {/* 4 Detailed Steps */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#0B1324] border-b border-slate-200 dark:border-[#1E2E4A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div
              key={step.stepNumber}
              className="rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#121E36] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              <div className="md:col-span-5">
                <span className="font-mono-tabular text-xs font-bold text-[#10A878]">
                  STEP {step.stepNumber}
                </span>
                <h2 className="mt-1.5 text-xl font-extrabold text-slate-900 dark:text-white">
                  {step.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.summary}
                </p>
              </div>
              <div className="md:col-span-7 flex flex-col justify-center">
                <ul className="space-y-3">
                  {step.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#10A878] shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role Responsibility Summary */}
      <section className="py-16 sm:py-20 bg-slate-50 dark:bg-[#0D162B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-2">
              Role Separation
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10213D] dark:text-white">
              Clear responsibilities across every dashboard
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PORTAL_SHOWCASE_ITEMS.map((portal) => (
              <div
                key={portal.id}
                className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-6"
              >
                <p className="text-xs font-bold text-[#10A878]">{portal.badgeText}</p>
                <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                  {portal.name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {portal.description}
                </p>
                <ul className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1E2E4A] space-y-2">
                  {portal.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10A878] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/register"
              className="h-12 px-7 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors"
            >
              <span>Register Your Company Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </MarketingLayout>
  );
}
