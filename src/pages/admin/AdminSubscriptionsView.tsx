import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Search,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { KpiCard } from '../../components/common/KpiCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { CompanyAccountRecord } from '../../types/guardops';
import type { AdminKpiSummary } from '../../utils/operations';

interface AdminSubscriptionsViewProps {
  companies: CompanyAccountRecord[];
  kpis: AdminKpiSummary;
  onSelectCompany: (company: CompanyAccountRecord) => void;
  onQuickAction: (companyId: string, action: 'activate' | 'renew' | 'suspend') => Promise<void>;
}

export function AdminSubscriptionsView({
  companies,
  kpis,
  onSelectCompany,
  onQuickAction,
}: AdminSubscriptionsViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Trial' | 'Expired'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (statusFilter !== 'all' && c.subscriptionStatus !== statusFilter) return false;
      if (q) {
        return (
          c.name.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.planName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [companies, search, statusFilter]);

  const planDistribution = useMemo(() => {
    const counts = { Enterprise: 0, Growth: 0, Starter: 0 };
    for (const c of companies) {
      counts[c.planName] = (counts[c.planName] ?? 0) + 1;
    }
    return counts;
  }, [companies]);

  const cardCls =
    'rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-5';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            SaaS Subscriptions Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Oversee company plan tiers, subscription lifecycle status, seat capacity, and SMS
            quotas.
          </p>
        </div>
      </div>

      {/* Subscription KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Active Subscriptions"
          value={kpis.activeSubscriptions}
          trend="Active tenant plans"
          trendDirection="up"
          tone="emerald"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Trial Accounts"
          value={kpis.trialSubscriptions}
          trend="Pending conversion"
          trendDirection="flat"
          tone="amber"
          icon={Shield}
        />
        <KpiCard
          label="Expired Subscriptions"
          value={kpis.expiredSubscriptions}
          trend="Requires renewal"
          trendDirection="down"
          tone="navy"
          icon={ShieldAlert}
        />
        <KpiCard
          label="Monthly Recurring Revenue"
          value={`GH₵${kpis.monthlyRevenue.toLocaleString()}`}
          trend="Active company MRR"
          trendDirection="up"
          tone="indigo"
          icon={CreditCard}
        />
      </div>

      {/* Plan Tier Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['Enterprise', 'Growth', 'Starter'] as const).map((tier) => (
          <div key={tier} className={cardCls}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#10A878]">
                {tier} Tier
              </span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-2">
              {planDistribution[tier]}{' '}
              <span className="text-xs font-medium text-slate-400">companies</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {tier === 'Enterprise'
                ? 'Multi-region & full dispatch telemetry'
                : tier === 'Growth'
                  ? 'Standard multi-site security teams'
                  : 'Single-zone starter operations'}
            </p>
          </div>
        ))}
      </div>

      {/* Subscriptions Roster Table */}
      <div className={cardCls}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'Active', 'Trial', 'Expired'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-[#10A878] text-white'
                    : 'bg-slate-100 dark:bg-[#0D182D] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All Plans' : tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter company or plan..."
              className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-xs w-60 focus:outline-none focus:border-[#10A878]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1E2E4A] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 pr-4">Company</th>
                <th className="py-3 px-3">Plan Tier</th>
                <th className="py-3 px-3 text-right">Guards / Sites</th>
                <th className="py-3 px-3">SMS Quota</th>
                <th className="py-3 px-3 text-right">Monthly Fee</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1A2A46] text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No company subscriptions yet.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 15).map((comp) => {
                  const smsPct = Math.min(
                    100,
                    Math.round((comp.smsCreditsUsed / Math.max(1, comp.smsCreditsLimit)) * 100),
                  );
                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                      <td className="py-3 pr-4">
                        <p className="font-bold text-slate-900 dark:text-white">{comp.name}</p>
                        <p className="text-[11px] text-slate-400">{comp.contactEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-200">
                        {comp.planName}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {comp.guardsCount} / {comp.locationsCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 w-36">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1 tabular-nums">
                          <span>{comp.smsCreditsUsed}</span>
                          <span>{smsPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-[#0D182D] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#10A878]"
                            style={{ width: `${smsPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                        GH₵{comp.monthlyFee.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge label={comp.subscriptionStatus} compact />
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {comp.subscriptionStatus !== 'Active' && (
                            <button
                              type="button"
                              onClick={() => void onQuickAction(comp.id, 'renew')}
                              className="px-2.5 py-1 rounded-lg bg-[#10A878] text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Renew
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectCompany(comp)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#24395D] text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:border-[#10A878] cursor-pointer"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
