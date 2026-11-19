import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type KpiTone = 'navy' | 'emerald' | 'amber' | 'indigo';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'flat';
  tone: KpiTone;
  icon: LucideIcon;
  onClick?: () => void;
}

const TONE_STYLES: Record<KpiTone, string> = {
  navy: 'bg-[#10213D] text-white border-[#1E355C]',
  emerald: 'bg-[#10A878] text-white border-[#16BC87]',
  amber: 'bg-[#F5820D] text-white border-[#FB9832]',
  indigo: 'bg-[#6B4CE6] text-white border-[#8065EC]',
};

export function KpiCard({
  label,
  value,
  trend,
  trendDirection = 'up',
  tone,
  icon: Icon,
  onClick,
}: KpiCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-transform duration-150 ${
        TONE_STYLES[tone]
      } ${onClick ? 'hover:-translate-y-0.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10A878]' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/85 truncate">{label}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-white mt-0.5">
              {value}
            </p>
          </div>
        </div>
      </div>
      {trend && (
        <div className="mt-2.5 flex items-center gap-1 text-xs font-medium text-white/90 tabular-nums">
          {trendDirection === 'down' ? (
            <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
          ) : trendDirection === 'flat' ? (
            <Minus className="w-3.5 h-3.5 shrink-0 opacity-80" />
          ) : (
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{trend}</span>
        </div>
      )}
    </Wrapper>
  );
}
