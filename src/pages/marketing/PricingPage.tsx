import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { MarketingLayout } from '../../components/marketing/MarketingLayout';
import { FaqSection } from '../../components/marketing/FaqSection';
import { FinalCtaSection } from '../../components/marketing/FinalCtaSection';
import { COMPLETE_PLAN_INCLUDES } from '../../data/marketingContent';
import { usePageMeta } from '../../utils/seo';

export function PricingPage() {
  usePageMeta(
    'Pricing — GH₵150 / month | Sentinel GuardOps',
    'Simple, transparent subscription pricing for private security companies. One flat GH₵150 monthly rate covers your entire security company operations platform.',
  );

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-14 sm:py-20 bg-[#10213D] text-white border-b border-[#1E355C]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-3">
            Transparent Pricing
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            One Clear Plan for Every Security Company
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            No complex tiers or hidden feature gates. Every security company receives the full
            operational suite at a predictable monthly rate.
          </p>
        </div>
      </section>

      {/* Main Plan Card */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#0B1324]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-[#10A878] bg-white dark:bg-[#121E36] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-5 bg-[#10213D] text-white p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#10A878]">
                  Complete Plan
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">Sentinel GuardOps</h2>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tight tabular-nums text-white">
                    GH₵150
                  </span>
                  <span className="text-sm font-semibold text-slate-300">/ month</span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Billed flat per security company. Manage your locations, supervisors, and guards
                  under one company account.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  to="/register"
                  className="w-full h-12 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Register Your Company</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/contact"
                  className="w-full h-11 rounded-xl border border-white/25 hover:border-white text-white text-xs font-bold flex items-center justify-center transition-colors"
                >
                  Have a Question? Contact Us
                </Link>
              </div>
            </div>

            <div className="md:col-span-7 p-8 sm:p-10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5">
                Everything included in the Complete Plan
              </h3>
              <ul className="space-y-3">
                {COMPLETE_PLAN_INCLUDES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#10A878] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FaqSection />
      <FinalCtaSection />
    </MarketingLayout>
  );
}
