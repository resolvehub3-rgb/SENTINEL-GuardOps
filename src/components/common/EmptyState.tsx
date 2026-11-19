import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = ShieldCheck,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-xl border border-dashed border-slate-300 dark:border-[#243658] bg-slate-50/70 dark:bg-[#0E182D]">
      <div className="w-11 h-11 rounded-xl bg-[#10213D]/10 dark:bg-[#10A878]/15 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[#10213D] dark:text-[#10A878]" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white text-xs font-semibold transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-11 rounded-lg bg-slate-200/80 dark:bg-[#182746]"
        />
      ))}
    </div>
  );
}
