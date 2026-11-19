import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  PauseCircle,
  XCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  label: string;
  tone?: 'emerald' | 'amber' | 'red' | 'blue' | 'slate' | 'indigo';
  compact?: boolean;
}

const TONE_MAP: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  emerald:
    'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  amber:
    'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25',
  red: 'bg-red-500/12 text-red-700 dark:text-red-300 border-red-500/25',
  blue: 'bg-blue-500/12 text-blue-700 dark:text-blue-300 border-blue-500/25',
  indigo:
    'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
  slate:
    'bg-slate-500/12 text-slate-700 dark:text-slate-300 border-slate-500/25',
};

export function inferStatusTone(status: string): NonNullable<StatusBadgeProps['tone']> {
  const s = status.toLowerCase();
  if (
    s.includes('on duty') ||
    s.includes('active') ||
    s.includes('operational') ||
    s.includes('approved') ||
    s.includes('finalized') ||
    s.includes('verified') ||
    s.includes('resolved') ||
    s.includes('paid') ||
    s.includes('on time')
  ) {
    return 'emerald';
  }
  if (
    s.includes('critical') ||
    s.includes('suspended') ||
    s.includes('expired') ||
    s.includes('overdue') ||
    s.includes('absent') ||
    s.includes('high') ||
    s.includes('unavailable')
  ) {
    return 'red';
  }
  if (
    s.includes('pending') ||
    s.includes('awaiting') ||
    s.includes('review') ||
    s.includes('late') ||
    s.includes('stale') ||
    s.includes('warning') ||
    s.includes('trial') ||
    s.includes('flagged') ||
    s.includes('returned') ||
    s.includes('medium') ||
    s.includes('open')
  ) {
    return 'amber';
  }
  if (s.includes('break') || s.includes('investigating') || s.includes('scheduled')) {
    return 'blue';
  }
  return 'slate';
}

export function StatusBadge({ label, tone, compact = false }: StatusBadgeProps) {
  const resolvedTone = tone ?? inferStatusTone(label);
  const Icon =
    resolvedTone === 'emerald'
      ? CheckCircle2
      : resolvedTone === 'red'
        ? label.toLowerCase().includes('critical')
          ? ShieldAlert
          : XCircle
        : resolvedTone === 'amber'
          ? AlertTriangle
          : resolvedTone === 'blue'
            ? PauseCircle
            : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold whitespace-nowrap shrink-0 ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${TONE_MAP[resolvedTone]}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
