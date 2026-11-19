import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  HeadphonesIcon,
  LayoutDashboard,
  MessageSquare,
  Search,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { DashboardShell } from '../../components/common/DashboardShell';
import type { SidebarNavGroup } from '../../components/common/DashboardShell';
import { KpiCard } from '../../components/common/KpiCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { apiRequest } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';
import { AdminMaintenanceSettings } from './AdminMaintenanceSettings';
import { AdminSubscriptionsView } from './AdminSubscriptionsView';
import { AdminBillingInvoices } from './AdminBillingInvoices';
import type {
  ActivityEvent,
  AuditLogRecord,
  BillingInvoiceRecord,
  CompanyAccountRecord,
  MaintenanceConfig,
  MaintenanceHistoryRecord,
  NotificationRecord,
  PlatformUserRecord,
  SupportTicketRecord,
  SystemServiceHealthRecord,
} from '../../types/guardops';
import type { AdminKpiSummary } from '../../utils/operations';

interface AdminOverviewPayload {
  kpis: AdminKpiSummary;
  companies: CompanyAccountRecord[];
  onboardingQueue: CompanyAccountRecord[];
  billingSeries: Array<{ month: string; revenue: number }>;
  platformActivity: ActivityEvent[];
  systemHealth: SystemServiceHealthRecord[];
  platformUsers: PlatformUserRecord[];
  invoices: BillingInvoiceRecord[];
  supportTickets: SupportTicketRecord[];
  auditLogs: AuditLogRecord[];
  maintenance: MaintenanceConfig;
  maintenanceHistory: MaintenanceHistoryRecord[];
  smsSummary: {
    creditsUsed: number;
    creditsLimit: number;
    messagesSent: number;
    failedMessages: number;
  };
}

export function AdminPortal() {
  const { showToast } = useToast();
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [data, setData] = useState<AdminOverviewPayload | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [companySearch, setCompanySearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyAccountRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [overview, notifRes] = await Promise.all([
        apiRequest<AdminOverviewPayload>('/api/admin/overview'),
        apiRequest<{ notifications: NotificationRecord[] }>('/api/notifications'),
      ]);
      setData(overview);
      setNotifications(notifRes.notifications);
    } catch (err) {
      showToast({
        title: 'Failed to load platform overview',
        description: err instanceof Error ? err.message : 'Network error',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useRealtime((event) => {
    if (
      event.startsWith('company:') ||
      event.startsWith('notification:') ||
      event.startsWith('billing:') ||
      event.startsWith('maintenance:')
    ) {
      void loadData();
    }
  });

  const handleMarkNotificationRead = async (id: string) => {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleManageCompany = async (
    companyId: string,
    action: 'approve' | 'suspend' | 'activate' | 'renew',
  ) => {
    await apiRequest(`/api/admin/companies/${companyId}/manage`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    showToast({ title: `Company ${action}d`, tone: 'success' });
    setSelectedCompany(null);
    await loadData();
  };

  const groups: SidebarNavGroup[] = [
    {
      groupLabel: 'Platform',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'companies', label: 'Companies', icon: Building2 },
        {
          id: 'company-approvals',
          label: 'Company Approvals',
          icon: UserCheck,
          badgeCount: data?.kpis.pendingOnboarding,
        },
        { id: 'platform-users', label: 'Platform Users', icon: Users },
      ],
    },
    {
      groupLabel: 'Revenue & Messaging',
      items: [
        { id: 'subscriptions', label: 'Subscriptions', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'sms-usage', label: 'SMS Usage', icon: MessageSquare },
      ],
    },
    {
      groupLabel: 'Governance & Infrastructure',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badgeCount: notifications.filter((n) => !n.read).length,
        },
        { id: 'support', label: 'Support', icon: HeadphonesIcon },
        { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
        { id: 'system-health', label: 'System Health', icon: Server },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          badgeCount: data?.maintenance.enabled ? 1 : undefined,
        },
      ],
    },
  ];

  const filteredCompanies = useMemo(() => {
    if (!data) return [];
    if (!companySearch.trim()) return data.companies;
    const q = companySearch.toLowerCase();
    return data.companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q),
    );
  }, [data, companySearch]);

  const cardCls =
    'rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-5';

  const donutData = data
    ? [
        { name: 'Active', value: data.kpis.activeSubscriptions, color: '#10A878' },
        { name: 'Trial', value: data.kpis.trialSubscriptions, color: '#F5820D' },
        { name: 'Expired', value: data.kpis.expiredSubscriptions, color: '#EF4444' },
      ]
    : [];

  return (
    <DashboardShell
      headerTitle="Super Admin Dashboard"
      headerSubtitle="Platform Overview"
      orgLabel="SA"
      groups={groups}
      activeRoute={activeRoute}
      onNavigate={setActiveRoute}
      notifications={notifications}
      onMarkNotificationRead={(id) => void handleMarkNotificationRead(id)}
    >
      {loading || !data ? (
        <LoadingSkeleton rows={6} />
      ) : activeRoute === 'dashboard' ? (
        <div className="space-y-5">
          {/* Platform Header */}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sentinel GuardOps Platform Overview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor platform activity, companies, subscriptions and system health.
            </p>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Registered Companies"
              value={data.kpis.registeredCompanies}
              trend="Active & pending tenants"
              trendDirection={data.kpis.registeredCompanies > 0 ? 'up' : 'flat'}
              tone="navy"
              icon={Building2}
              onClick={() => setActiveRoute('companies')}
            />
            <KpiCard
              label="Total Guards"
              value={data.kpis.totalGuards.toLocaleString()}
              trend="Across registered companies"
              trendDirection={data.kpis.totalGuards > 0 ? 'up' : 'flat'}
              tone="emerald"
              icon={Shield}
              onClick={() => setActiveRoute('platform-users')}
            />
            <KpiCard
              label="Active Subscriptions"
              value={data.kpis.activeSubscriptions}
              trend="Paid active tenants"
              trendDirection={data.kpis.activeSubscriptions > 0 ? 'up' : 'flat'}
              tone="amber"
              icon={CreditCard}
              onClick={() => setActiveRoute('subscriptions')}
            />
            <KpiCard
              label="Platform Availability"
              value={`${data.kpis.platformAvailability}%`}
              trend={`${data.systemHealth.length} monitored probes`}
              trendDirection={data.systemHealth.length > 0 ? 'up' : 'flat'}
              tone="indigo"
              icon={ShieldCheck}
              onClick={() => setActiveRoute('system-health')}
            />
          </div>

          {/* Middle 3 Cards: Companies Overview + Onboarding Queue + Billing Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Companies Overview Donut */}
            <section className={`${cardCls} lg:col-span-4 flex flex-col justify-between`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Companies Overview
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveRoute('companies')}
                  className="text-xs font-semibold text-[#10A878] hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  {data.kpis.registeredCompanies === 0 ? (
                    <div className="w-28 h-28 rounded-full border-[12px] border-slate-100 dark:border-[#1E2E4A]" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          innerRadius={42}
                          outerRadius={60}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {donutData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {data.kpis.registeredCompanies}
                    </span>
                    <span className="text-[11px] text-slate-400">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5 text-xs">
                  {donutData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}
                      </span>
                      <span className="font-bold tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Onboarding Queue */}
            <section className={`${cardCls} lg:col-span-4`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Onboarding Queue
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveRoute('company-approvals')}
                  className="text-xs font-semibold text-[#10A878] hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-2.5">
                {data.onboardingQueue.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    All pending company registrations reviewed.
                  </p>
                ) : (
                  data.onboardingQueue.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {comp.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {comp.contactPerson} · {comp.registeredAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge label={comp.approvalStatus} compact />
                        <button
                          type="button"
                          onClick={() => setSelectedCompany(comp)}
                          className="px-2 py-1 rounded-md bg-[#10A878] text-white text-[11px] font-semibold"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Billing Overview Bar Chart */}
            <section className={`${cardCls} lg:col-span-4 flex flex-col justify-between`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Billing Overview
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveRoute('billing')}
                  className="text-xs font-semibold text-[#10A878] hover:underline"
                >
                  View Report →
                </button>
              </div>
              <div className="mb-2">
                <p className="text-[11px] text-slate-400">This Month</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                    GH₵{data.kpis.monthlyRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-28 w-full">
                {data.billingSeries.length === 0 ? (
                  <div className="h-full rounded-lg border border-dashed border-slate-200 dark:border-[#1E2E4A] flex items-center justify-center text-xs text-slate-400">
                    No billing revenue recorded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.billingSeries}>
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <Tooltip
                        formatter={(value) => [`GH₵${Number(value).toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          backgroundColor: '#10213D',
                          borderColor: '#1E2E4A',
                          borderRadius: 8,
                          color: '#fff',
                          fontSize: 11,
                        }}
                      />
                      <Bar dataKey="revenue" fill="#10A878" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          {/* Bottom Row: Platform Activity + Service Health + SMS Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section className={`${cardCls} lg:col-span-5`}>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Platform Activity
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveRoute('audit-logs')}
                  className="text-xs font-semibold text-[#10A878] hover:underline"
                >
                  Audit Logs →
                </button>
              </div>
              {data.platformActivity.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No platform activity yet"
                  description="Registrations, approvals, and billing events appear here."
                />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A]">
                  {data.platformActivity.slice(0, 5).map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Activity className="w-3.5 h-3.5 text-[#10A878] shrink-0" />
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                          {item.message}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">{item.timeAgo}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={`${cardCls} lg:col-span-4`}>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    System Health
                  </h3>
                  <p className="text-[11px] text-slate-400">Platform subsystem telemetry probes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRoute('system-health')}
                  className="text-xs font-semibold text-[#10A878] hover:underline"
                >
                  View All →
                </button>
              </div>
              {data.systemHealth.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No system telemetry probes recorded yet.
                </p>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {data.systemHealth.slice(0, 4).map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#10A878]" />
                        {svc.name}
                      </span>
                      <span className="font-semibold text-[#10A878]">{svc.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={`${cardCls} lg:col-span-3 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    SMS Usage
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('sms-usage')}
                    className="text-xs font-semibold text-[#10A878] hover:underline"
                  >
                    Details
                  </button>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {data.smsSummary.messagesSent.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Messages sent · {data.smsSummary.failedMessages} failed
                </p>
              </div>
              {(() => {
                const smsPct =
                  data.smsSummary.creditsLimit > 0
                    ? Math.min(
                        100,
                        Math.round((data.smsSummary.creditsUsed / data.smsSummary.creditsLimit) * 100),
                      )
                    : 0;
                return (
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Credits Consumed</span>
                      <span className="tabular-nums">{smsPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-[#0D182D] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#10A878]"
                        style={{ width: `${smsPct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </section>
          </div>
        </div>
      ) : activeRoute === 'companies' || activeRoute === 'company-approvals' ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeRoute === 'company-approvals'
                  ? 'Company Approvals & Onboarding'
                  : 'Registered Security Companies'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage tenant company status, compliance approval, and subscription tier
              </p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search company..."
                className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#121E36] text-xs w-56"
              />
            </div>
          </div>

          <div className={cardCls}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1E2E4A] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 pr-4">Company</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3 text-right">Guards</th>
                    <th className="py-3 px-3">Approval</th>
                    <th className="py-3 px-3">Subscription</th>
                    <th className="py-3 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1A2A46] text-xs">
                  {(() => {
                    const companyRows =
                      activeRoute === 'company-approvals'
                        ? data.onboardingQueue
                        : filteredCompanies.slice(0, 18);
                    if (companyRows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">
                            {activeRoute === 'company-approvals'
                              ? 'No pending company registration requests.'
                              : 'No registered security companies yet.'}
                          </td>
                        </tr>
                      );
                    }
                    return companyRows.map((comp) => (
                      <tr key={comp.id} className="hover:bg-slate-50/70 dark:hover:bg-white/3">
                        <td className="py-3 pr-4">
                          <p className="font-bold text-slate-900 dark:text-white">{comp.name}</p>
                          <p className="text-[11px] text-slate-400">Registered {comp.registeredAt}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium">{comp.contactPerson}</p>
                          <p className="text-[11px] text-slate-400">{comp.contactEmail}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-bold tabular-nums">
                          {comp.guardsCount}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge label={comp.approvalStatus} compact />
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge label={comp.subscriptionStatus} compact />
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCompany(comp)}
                            className="px-3 py-1.5 rounded-lg bg-[#10A878] text-white text-[11px] font-semibold"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeRoute === 'platform-users' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Platform Users</h2>
          <div className={cardCls}>
            {data.platformUsers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No platform users yet"
                description="Registered company owners, supervisors, and guards will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A] text-xs">
                {data.platformUsers.map((u) => (
                  <div key={u.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm">{u.name}</p>
                      <p className="text-slate-400">{u.email} · {u.companyName} · {u.role}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{u.lastLogin}</span>
                      <StatusBadge label={u.status} compact />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeRoute === 'subscriptions' ? (
        <AdminSubscriptionsView
          companies={data.companies}
          kpis={data.kpis}
          onSelectCompany={setSelectedCompany}
          onQuickAction={handleManageCompany}
        />
      ) : activeRoute === 'billing' ? (
        <AdminBillingInvoices
          invoices={data.invoices}
          companies={data.companies}
          billingSeries={data.billingSeries}
          onRefresh={loadData}
        />
      ) : activeRoute === 'sms-usage' ? (
        <div className="space-y-5">
          <h2 className="text-lg font-bold">Platform SMS Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cardCls}>
              <span className="text-xs text-slate-400">Total Credits Consumed</span>
              <p className="text-2xl font-bold tabular-nums mt-1">
                {data.smsSummary.creditsUsed.toLocaleString()}
              </p>
            </div>
            <div className={cardCls}>
              <span className="text-xs text-slate-400">Messages Delivered</span>
              <p className="text-2xl font-bold tabular-nums text-[#10A878] mt-1">
                {(data.smsSummary.messagesSent - data.smsSummary.failedMessages).toLocaleString()}
              </p>
            </div>
            <div className={cardCls}>
              <span className="text-xs text-slate-400">Failed Dispatches</span>
              <p className="text-2xl font-bold tabular-nums text-amber-500 mt-1">
                {data.smsSummary.failedMessages}
              </p>
            </div>
          </div>
          <div className={cardCls}>
            <h3 className="text-sm font-bold mb-3">Company SMS Consumption</h3>
            {data.companies.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No company SMS usage yet"
                description="SMS credits consumed by registered companies will appear here."
              />
            ) : (
              <div className="space-y-2.5 text-xs">
                {data.companies.slice(0, 8).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 border-b last:border-b-0 border-slate-100 dark:border-[#1D2D4A]">
                    <span className="font-semibold">{c.name}</span>
                    <span className="font-mono-tabular text-slate-400">
                      {c.smsCreditsUsed.toLocaleString()} / {c.smsCreditsLimit.toLocaleString()} credits
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeRoute === 'system-health' ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">System Health Monitor</h2>
            <p className="text-xs text-slate-400">
              Live subsystem probes across platform infrastructure
            </p>
          </div>
          {data.systemHealth.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                icon={Server}
                title="No system health probes recorded yet"
                description="Telemetry probes will display once infrastructure checks are ingested."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.systemHealth.map((svc) => (
                <div key={svc.id} className={`${cardCls} flex items-center justify-between`}>
                  <div>
                    <p className="text-sm font-bold">{svc.name}</p>
                    <p className="text-xs text-slate-400">
                      {svc.note} · {svc.latencyMs}ms · {svc.uptimePercent}% uptime
                    </p>
                  </div>
                  <StatusBadge label={svc.status} compact />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeRoute === 'support' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Support Tickets</h2>
          {data.supportTickets.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                icon={HeadphonesIcon}
                title="No support tickets yet"
                description="Company support requests and escalations will appear here."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {data.supportTickets.map((tkt) => (
                <div key={tkt.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-slate-400">{tkt.id}</span>
                      <StatusBadge label={tkt.priority} compact />
                      <StatusBadge label={tkt.status} compact />
                    </div>
                    <p className="text-sm font-bold mt-1">{tkt.subject}</p>
                    <p className="text-xs text-slate-400">{tkt.companyName} · {tkt.updatedAt}</p>
                  </div>
                  {tkt.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/api/admin/tickets/${tkt.id}/resolve`, { method: 'POST' });
                        showToast({ title: 'Ticket resolved', tone: 'success' });
                        void loadData();
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
                    >
                      Resolve Ticket
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeRoute === 'audit-logs' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Platform Audit Logs</h2>
          <div className={cardCls}>
            {data.auditLogs.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No audit logs yet"
                description="Administrative actions, approvals, and system changes will be logged here."
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A] text-xs">
                {data.auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold">{log.action} — {log.target}</p>
                      <p className="text-slate-400">{log.actor} ({log.role})</p>
                    </div>
                    <span className="font-mono-tabular text-slate-400">
                      {log.timestamp} · {log.ipAddress}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeRoute === 'notifications' ? (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Platform Notifications</h2>
          {notifications.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                icon={Bell}
                title="No platform notifications yet"
                description="Alerts and platform notifications will appear here."
              />
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`${cardCls} flex items-center justify-between gap-3`}>
                <div>
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="text-xs text-slate-400">{n.message}</p>
                </div>
                {!n.read ? (
                  <button
                    type="button"
                    onClick={() => void handleMarkNotificationRead(n.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#10A878]/15 text-[#10A878] text-xs font-semibold"
                  >
                    Mark Read
                  </button>
                ) : (
                  <StatusBadge label="Read" tone="slate" compact />
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <AdminMaintenanceSettings
          maintenance={data.maintenance}
          history={data.maintenanceHistory}
          onUpdated={() => {
            void loadData();
          }}
        />
      )}

      {/* Company Status Management Modal */}
      <Modal
        open={selectedCompany !== null}
        onClose={() => setSelectedCompany(null)}
        title={selectedCompany?.name ?? 'Manage Company'}
        subtitle={selectedCompany ? `${selectedCompany.contactPerson} · ${selectedCompany.contactEmail}` : ''}
      >
        {selectedCompany && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D182D] border border-slate-200 dark:border-[#1E2E4A]">
              <div>
                <span className="text-slate-400 block">Approval Status</span>
                <div className="mt-1">
                  <StatusBadge label={selectedCompany.approvalStatus} compact />
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Subscription</span>
                <div className="mt-1">
                  <StatusBadge label={selectedCompany.subscriptionStatus} compact />
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Registered Guards</span>
                <span className="font-bold tabular-nums">{selectedCompany.guardsCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Plan Tier</span>
                <span className="font-bold">{selectedCompany.planName}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {selectedCompany.approvalStatus !== 'Approved' && (
                <button
                  type="button"
                  onClick={() => void handleManageCompany(selectedCompany.id, 'approve')}
                  className="px-4 py-2 rounded-lg bg-[#10A878] text-white font-semibold"
                >
                  Approve & Activate
                </button>
              )}
              {selectedCompany.approvalStatus !== 'Suspended' ? (
                <button
                  type="button"
                  onClick={() => void handleManageCompany(selectedCompany.id, 'suspend')}
                  className="px-4 py-2 rounded-lg border border-red-500/40 text-red-500 font-semibold"
                >
                  Suspend Company
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleManageCompany(selectedCompany.id, 'activate')}
                  className="px-4 py-2 rounded-lg bg-[#10A878] text-white font-semibold"
                >
                  Reactivate Company
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
