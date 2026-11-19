import React from 'react';
import { Shield, Target, Eye, Layers } from 'lucide-react';
import { MarketingLayout } from '../../components/marketing/MarketingLayout';
import { FinalCtaSection } from '../../components/marketing/FinalCtaSection';
import { usePageMeta } from '../../utils/seo';

const ABOUT_PILLARS = [
  {
    icon: Shield,
    title: 'Our Story',
    content:
      'Private security companies coordinate teams across multiple sites, day and night shifts, client expectations, and urgent incidents. Samley Technologies built Sentinel GuardOps so security companies can run those daily operations from one unified digital system instead of fragmented notebooks and informal messaging.',
  },
  {
    icon: Target,
    title: 'Our Mission',
    content:
      'To equip private security companies with reliable, practical operations software that strengthens guard accountability, speeds up incident response, and builds greater confidence with every client.',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    content:
      'A private security industry where every shift, patrol, occurrence log, and supervisory verification is transparent, auditable, and effortless to coordinate across office and field teams.',
  },
  {
    icon: Layers,
    title: 'Our Approach',
    content:
      'We focus on operational clarity over complexity. Every view in Sentinel GuardOps is purposefully shaped for its role—giving company owners executive visibility, supervisors fast verification controls, and field guards a dependable mobile tool.',
  },
];

export function AboutPage() {
  usePageMeta(
    'About Us | Sentinel GuardOps by Samley Technologies',
    'Learn about Sentinel GuardOps, developed by Samley Technologies to modernize workforce coordination, reporting, and accountability for private security companies.',
  );

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-14 sm:py-20 bg-[#10213D] text-white border-b border-[#1E355C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-3">
              About Sentinel GuardOps
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Technology That Strengthens Security Operations.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Developed by Samley Technologies, Sentinel GuardOps brings enterprise operational structure
              to private security firms—from head-office command to the front gate.
            </p>
          </div>
        </div>
      </section>

      {/* Story, Mission, Vision, Approach */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#0B1324]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ABOUT_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#121E36] p-7 sm:p-8"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#10213D] text-[#10A878] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {pillar.title}
                  </h2>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {pillar.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </MarketingLayout>
  );
}
