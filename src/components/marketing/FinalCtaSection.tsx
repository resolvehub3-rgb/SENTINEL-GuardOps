import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface FinalCtaSectionProps {
  heading?: string;
  subtext?: string;
}

export function FinalCtaSection({
  heading = 'Ready to Bring Structure and Visibility to Your Security Operations?',
  subtext = 'Start using Sentinel GuardOps for your security company at a flat GH₵150 per month.',
}: FinalCtaSectionProps) {
  return (
    <section className="py-16 sm:py-20 bg-[#10213D] text-white border-t border-[#1E355C]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {heading}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">{subtext}</p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/register"
            className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>Register Your Company</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contact"
            className="w-full sm:w-auto h-12 px-7 rounded-xl border border-white/25 hover:border-white text-white text-sm font-bold inline-flex items-center justify-center transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
