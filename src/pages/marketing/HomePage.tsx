import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { MarketingLayout } from '../../components/marketing/MarketingLayout';
import { HeroProductPreview, PortalMockupFrame } from '../../components/marketing/ProductShowcaseFrames';
import { FaqSection } from '../../components/marketing/FaqSection';
import { FinalCtaSection } from '../../components/marketing/FinalCtaSection';
import { FeatureIcon } from '../../components/marketing/FeatureIcon';
import {
  COMPLETE_PLAN_INCLUDES,
  CORE_FEATURES,
  HOW_IT_WORKS_STEPS,
  PORTAL_SHOWCASE_ITEMS,
  TRUST_STRIP_ITEMS,
  WHY_CHOOSE_ITEMS,
} from '../../data/marketingContent';
import { usePageMeta } from '../../utils/seo';

export function HomePage() {
  usePageMeta(
    'Sentinel GuardOps — Security Operations Platform',
    'Manage your security workforce, monitor field operations, track attendance, receive incident reports, and maintain accountability across all your security locations with Sentinel GuardOps.',
  );

  const [activePortalId, setActivePortalId] = useState<'company' | 'supervisor' | 'guard'>(
    'company',
  );

  const activePortal =
    PORTAL_SHOWCASE_ITEMS.find((p) => p.id === activePortalId) ?? PORTAL_SHOWCASE_ITEMS[0];

  const featuredCapabilities = CORE_FEATURES.slice(0, 6);

  return (
    <MarketingLayout>
      {/* 1. Hero Section */}
      <section className="py-14 sm:py-20 lg:py-24 bg-white dark:bg-[#0B1324] border-b border-slate-200 dark:border-[#1E2E4A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Hero Copy */}
            <div className="lg:col-span-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-3">
                Samley Technologies · Security Operations Platform
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#10213D] dark:text-white leading-[1.12]">
                Take Control of Every Security Operation.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Manage your security workforce, monitor field operations, track attendance, receive
                incident reports, and maintain accountability across all your security locations
                with Sentinel GuardOps.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link
                  to="/register"
                  className="h-12 px-7 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Register Your Company</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/features"
                  className="h-12 px-6 rounded-xl border border-slate-300 dark:border-[#24395D] text-slate-800 dark:text-white hover:border-[#10A878] hover:text-[#10A878] text-sm font-bold inline-flex items-center justify-center transition-colors"
                >
                  Explore Features
                </Link>
              </div>

              <div className="mt-7 pt-6 border-t border-slate-200 dark:border-[#1E2E4A] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10A878]" />
                  <span>Flat GH₵150 / month per company</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10A878]" />
                  <span>Dedicated Management, Supervisor &amp; Guard Views</span>
                </span>
              </div>
            </div>

            {/* Hero Product Showcase */}
            <div className="lg:col-span-6">
              <HeroProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Operational Pillars Strip */}
      <section className="py-8 bg-[#10213D] text-white border-b border-[#1E355C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_STRIP_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#10A878] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Core Platform Features Grid */}
      <section className="py-16 sm:py-20 bg-slate-50 dark:bg-[#0D162B] border-b border-slate-200 dark:border-[#1E2E4A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-2">
                Platform Capabilities
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10213D] dark:text-white">
                Built around real security guard and supervisor workflows
              </h2>
            </div>
            <Link
              to="/features"
              className="text-xs font-bold text-[#10A878] hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>View All 12 Platform Features</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredCapabilities.map((feat) => (
              <div
                key={feat.id}
                className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#10213D] text-[#10A878] flex items-center justify-center mb-4">
                    <FeatureIcon name={feat.iconName} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feat.summary}
                  </p>
                </div>
                <p className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2E4A] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {feat.audience}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Interactive Portal Showcase */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#0B1324] border-b border-slate-200 dark:border-[#1E2E4A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-2">
              Role-Isolated Portals
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10213D] dark:text-white">
              Purpose-built interfaces for every operational tier
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Select a portal below to see how Sentinel GuardOps equips company management, field
              supervisors, and guards on post.
            </p>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Platform portals">
            {PORTAL_SHOWCASE_ITEMS.map((portal) => {
              const selected = portal.id === activePortalId;
              return (
                <button
                  key={portal.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActivePortalId(portal.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#10213D] dark:bg-[#10A878] text-white'
                      : 'border border-slate-200 dark:border-[#1E2E4A] bg-slate-50 dark:bg-[#121E36] text-slate-700 dark:text-slate-300 hover:border-[#10A878]'
                  }`}
                >
                  {portal.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#10A878]">
                {activePortal.badgeText}
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#10213D] dark:text-white">
                {activePortal.headline}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activePortal.description}
              </p>
              <ul className="space-y-2.5 pt-2">
                {activePortal.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#10A878] shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {activePortal.audience}
              </p>
            </div>

            <div className="lg:col-span-7">
              <PortalMockupFrame portalId={activePortal.id} />
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="py-16 sm:py-20 bg-slate-50 dark:bg-[#0D162B] border-b border-slate-200 dark:border-[#1E2E4A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-2">
                How It Works
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10213D] dark:text-white">
                From company registration to verified daily operations
              </h2>
            </div>
            <Link
              to="/how-it-works"
              className="text-xs font-bold text-[#10A878] hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>See Detailed Workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div
                key={step.stepNumber}
                className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-6"
              >
                <span className="font-mono-tabular text-xs font-bold text-[#10A878]">
                  STEP {step.stepNumber}
                </span>
                <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Why Choose Sentinel GuardOps */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#0B1324] border-b border-slate-200 dark:border-[#1E2E4A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-2">
              Why Choose Sentinel GuardOps
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10213D] dark:text-white">
              Replace guesswork and paper logs with operational accountability
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE_ITEMS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#121E36] p-6"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Pricing Highlight Section */}
      <section className="py-16 sm:py-20 bg-slate-50 dark:bg-[#0D162B]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-2">
              Simple, Transparent Pricing
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10213D] dark:text-white">
              One complete subscription for your entire security company
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-[#1E355C] bg-white dark:bg-[#121E36] shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-5 bg-[#10213D] text-white p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#10A878]">
                  Complete Plan
                </p>
                <h3 className="mt-2 text-xl font-extrabold text-white">Sentinel GuardOps</h3>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight tabular-nums text-white">
                    GH₵150
                  </span>
                  <span className="text-xs font-semibold text-slate-300">/ month</span>
                </div>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Flat monthly company rate. Includes access for your company management,
                  supervisors, and field guards.
                </p>
              </div>
              <div className="mt-8 space-y-2.5">
                <Link
                  to="/register"
                  className="w-full h-11 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Register Your Company</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="w-full h-10 rounded-xl border border-white/20 hover:border-white text-white text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  View Full Plan Details
                </Link>
              </div>
            </div>

            <div className="md:col-span-7 p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                Included in your company subscription
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMPLETE_PLAN_INCLUDES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#10A878] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <FaqSection />

      {/* 9. Final CTA */}
      <FinalCtaSection />
    </MarketingLayout>
  );
}
