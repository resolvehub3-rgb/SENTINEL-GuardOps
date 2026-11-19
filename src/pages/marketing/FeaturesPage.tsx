import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MarketingLayout } from '../../components/marketing/MarketingLayout';
import { FeatureIcon } from '../../components/marketing/FeatureIcon';
import { FinalCtaSection } from '../../components/marketing/FinalCtaSection';
import { CORE_FEATURES } from '../../data/marketingContent';
import { usePageMeta } from '../../utils/seo';

export function FeaturesPage() {
  usePageMeta(
    'Platform Features | Sentinel GuardOps',
    'Explore all 12 security operations capabilities in Sentinel GuardOps including live guard monitoring, digital occurrence books, incident reporting, and supervisor shift reviews.',
  );

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-14 sm:py-20 bg-[#10213D] text-white border-b border-[#1E355C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-3">
              Platform Features
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Everything Required to Run Modern Security Operations
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Sentinel GuardOps connects field guards, site supervisors, and security company leaders
              into one structured system—without scattered spreadsheets or paper logs.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="h-11 px-6 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
              >
                <span>Register Your Company</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/pricing"
                className="h-11 px-6 rounded-xl border border-white/25 hover:border-white text-white text-xs sm:text-sm font-bold inline-flex items-center transition-colors"
              >
                View Pricing (GH₵150 / mo)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Full 12 Features Grid */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#0B1324]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORE_FEATURES.map((feat) => (
              <div
                key={feat.id}
                className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#121E36] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#10213D] text-[#10A878] flex items-center justify-center mb-4">
                    <FeatureIcon name={feat.iconName} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {feat.title}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                    {feat.summary}
                  </p>
                  <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feat.details}
                  </p>
                </div>
                <p className="mt-5 pt-3 border-t border-slate-200 dark:border-[#1E2E4A] text-[11px] font-bold text-[#10A878]">
                  Designed for: {feat.audience}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </MarketingLayout>
  );
}
