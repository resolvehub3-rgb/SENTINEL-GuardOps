import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  Megaphone,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  ArrowRight,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardShell } from '../../components/common/DashboardShell';
import type { SidebarNavGroup } from '../../components/common/DashboardShell';
import { KpiCard } from '../../components/common/KpiCard';
import { OperationsMap } from '../../components/common/OperationsMap';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/EmptyState';
import { CompanySubpages } from './CompanySubpages';
import { apiRequest } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';
import { filterOnDutyGuardsForLiveMap } from '../../utils/operations';
import type {
  ActivityEvent,
  AnnouncementRecord,
  AttendanceRecord,
  BillingInvoiceRecord,
  ClientRecord,
  DutyScheduleRecord,
  GuardRecord,
  IncidentRecord,
  LocationRecord,
  NotificationRecord,
  OccurrenceRecord,
  ShiftReportRecord,
  SupervisorRecord,
} from '../../types/guardops';
import type { CompanyKpiSummary } from '../../utils/operations';

interface CompanyOverviewPayload {
  companyName: string;
  kpis: CompanyKpiSummary;
  liveMapGuards: GuardRecord[];
  allGuards: GuardRecord[];
  locations: LocationRecord[];
  topLocations: LocationRecord[];
  recentActivity: ActivityEvent[];
  incidentSeries: Array<{ label: string; current: number; previous: number }>;
  incidents: IncidentRecord[];
  occurrences: OccurrenceRecord[];
  schedules: DutyScheduleRecord[];
  attendance: AttendanceRecord[];
  shiftReports: ShiftReportRecord[];
  clients: ClientRecord[];
  supervisors: SupervisorRecord[];
  announcements: AnnouncementRecord[];
  invoices: BillingInvoiceRecord[];
}

export function CompanyPortal() {
  const { showToast } = useToast();
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('7d');
  const [data, setData] = useState<CompanyOverviewPayload | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [opsTab, setOpsTab] = useState<'schedules' | 'verification' | 'alerts' | 'reports'>('schedules');

  // Full Live Map Filters
  const [mapSearch, setMapSearch] = useState('');
  const [mapLocationFilter, setMapLocationFilter] = useState('all');
  const [mapPostFilter, setMapPostFilter] = useState('all');
  const [selectedMapGuard, setSelectedMapGuard] = useState<GuardRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [overview, notifRes] = await Promise.all([
        apiRequest<CompanyOverviewPayload>(`/api/company/overview?period=${period}`),
        apiRequest<{ notifications: NotificationRecord[] }>('/api/notifications'),
      ]);
      setData(overview);
      setNotifications(notifRes.notifications);
      if (!selectedMapGuard && overview.liveMapGuards.length > 0) {
        setSelectedMapGuard(overview.liveMapGuards[0]);
      }
    } catch (err) {
      showToast({
        title: 'Unable to load company operations',
        description: err instanceof Error ? err.message : 'Network error',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [period, selectedMapGuard, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useRealtime((event) => {
    if (
      event.startsWith('duty:') ||
      event.startsWith('guard:') ||
      event.startsWith('location:') ||
      event.startsWith('client:') ||
      event.startsWith('incident:') ||
      event.startsWith('occurrence:') ||
      event.startsWith('report:') ||
      event.startsWith('schedule:') ||
      event.startsWith('announcement:')
    ) {
      void loadData();
    }
  });

  const handleMarkNotificationRead = async (id: string) => {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleExportCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(','),
      ...rows.map((r) =>
        keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ title: `Exported ${filename}`, tone: 'success' });
  };

  const groups: SidebarNavGroup[] = [
    {
      groupLabel: 'Command',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'live-map', label: 'Live Map', icon: MapIcon },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      groupLabel: 'Workforce & Sites',
      items: [
        { id: 'clients', label: 'Clients', icon: Building2 },
        { id: 'locations', label: 'Locations / Posts', icon: MapPin },
        { id: 'guards', label: 'Guards', icon: Shield },
        { id: 'supervisors', label: 'Supervisors', icon: UserCheck },
        { id: 'assignments', label: 'Assignments', icon: Users },
        { id: 'scheduling', label: 'Duty Scheduling', icon: CalendarClock },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
      ],
    },
    {
      groupLabel: 'Reports & Oversight',
      items: [
        { id: 'occurrences', label: 'Occurrence Book', icon: BookOpen },
        {
          id: 'incidents',
          label: 'Incident Reports',
          icon: ShieldAlert,
          badgeCount: data?.kpis.openIncidents,
        },
        { id: 'shift-reports', label: 'Shift Reports', icon: FileText },
        { id: 'report-reviews', label: 'Report Reviews', icon: ClipboardCheck },
        { id: 'owner-verification', label: 'Owner Verification', icon: FileCheck2 },
      ],
    },
    {
      groupLabel: 'Organization',
      items: [
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badgeCount: notifications.filter((n) => !n.read).length,
        },
        { id: 'reports', label: 'Reports', icon: Activity },
        { id: 'billing', label: 'Subscription & Billing', icon: CreditCard },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const filteredLiveGuards = useMemo(() => {
    if (!data) return [];
    return filterOnDutyGuardsForLiveMap(
      data.allGuards,
      mapSearch,
      mapLocationFilter,
      mapPostFilter,
    );
  }, [data, mapSearch, mapLocationFilter, mapPostFilter]);

  const distinctPosts = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(data.allGuards.filter((g) => g.status === 'On Duty').map((g) => g.postName)),
    );
  }, [data]);

  const cardCls =
    'rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-5';

  return (
    <DashboardShell
      headerTitle="Security Company Dashboard"
      headerSubtitle="Complete Security Operations Control"
      orgLabel={data?.companyName ?? 'Acme Security Ltd'}
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
          {/* Dashboard Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back, Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Here&apos;s an overview of your security operations today · Thursday, Nov 19, 2026
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36]">
              {(['today', '7d', '30d'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    period === p
                      ? 'bg-[#10A878] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Guards on Duty"
              value={data.kpis.guardsOnDuty}
              trend="2% vs yesterday"
              trendDirection="up"
              tone="navy"
              icon={Shield}
              onClick={() => setActiveRoute('guards')}
            />
            <KpiCard
              label="Active Locations"
              value={data.kpis.activeLocations}
              trend="5% active coverage"
              trendDirection="up"
              tone="emerald"
              icon={MapPin}
              onClick={() => setActiveRoute('locations')}
            />
            <KpiCard
              label="Open Incidents"
              value={data.kpis.openIncidents}
              trend="1% vs last week"
              trendDirection="down"
              tone="amber"
              icon={AlertTriangle}
              onClick={() => setActiveRoute('incidents')}
            />
            <KpiCard
              label="Attendance Rate"
              value={`${data.kpis.attendanceRate}%`}
              trend="1% shift punctuality"
              trendDirection="up"
              tone="indigo"
              icon={CalendarCheck}
              onClick={() => setActiveRoute('attendance')}
            />
          </div>

          {/* Primary Grid: Live Guard Locations Map + Recent Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            <section className={`${cardCls} xl:col-span-8 flex flex-col`}>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Guard Locations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active on-duty post telemetry across contracted zones
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRoute('live-map')}
                  className="px-3.5 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>View Live Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <OperationsMap
                guards={data.liveMapGuards}
                selectedGuardId={selectedMapGuard?.id}
                onSelectGuard={(g) => {
                  setSelectedMapGuard(g);
                  setActiveRoute('live-map');
                }}
                heightClass="h-72 sm:h-80"
              />
            </section>

            <section className={`${cardCls} xl:col-span-4 flex flex-col`}>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveRoute('occurrences')}
                  className="text-xs font-semibold text-[#10A878] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A] flex-1">
                {data.recentActivity.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        item.tone === 'red'
                          ? 'bg-red-500/15 text-red-500'
                          : item.tone === 'amber'
                            ? 'bg-amber-500/15 text-amber-500'
                            : item.tone === 'blue'
                              ? 'bg-blue-500/15 text-blue-500'
                              : 'bg-[#10A878]/15 text-[#10A878]'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                        {item.message}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.timeAgo} · {item.statusLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Secondary Grid: Incidents Overview Chart + Top Locations */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <section className={`${cardCls} xl:col-span-7`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Incidents Overview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Reported incident volume vs previous period
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10A878]" />
                    This Period
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    Previous
                  </span>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.incidentSeries}>
                    <defs>
                      <linearGradient id="incidentCurrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10A878" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10A878" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2E4A" opacity={0.35} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#10213D',
                        borderColor: '#1E2E4A',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="previous"
                      stroke="#64748B"
                      strokeWidth={2}
                      fill="transparent"
                    />
                    <Area
                      type="monotone"
                      dataKey="current"
                      stroke="#10A878"
                      strokeWidth={2.5}
                      fill="url(#incidentCurrGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className={`${cardCls} xl:col-span-5`}>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Top Locations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Attendance & deployment share
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRoute('locations')}
                  className="text-xs font-semibold text-[#10A878] hover:underline"
                >
                  All Sites
                </button>
              </div>
              <div className="space-y-3.5">
                {data.topLocations.map((loc, idx) => {
                  const barColors = [
                    'bg-[#10A878]',
                    'bg-blue-500',
                    'bg-cyan-500',
                    'bg-indigo-500',
                    'bg-slate-400',
                  ];
                  return (
                    <div key={loc.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {loc.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                          {loc.assignedGuardsCount} guards · {loc.attendanceRate}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-[#0D182D] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColors[idx % barColors.length]}`}
                          style={{ width: `${Math.min(100, loc.sharePercent * 3.2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Operational Queues Tabbed Card (Upcoming Schedules / Verification / Alerts / Shift Reports) */}
          <section className={cardCls}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#1D2D4A]">
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0D182D]">
                {(
                  [
                    { id: 'schedules', label: 'Upcoming Schedules' },
                    { id: 'verification', label: 'Pending Verification' },
                    { id: 'alerts', label: 'Incident Alerts' },
                    { id: 'reports', label: 'Recent Shift Reports' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOpsTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      opsTab === tab.id
                        ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveRoute(
                    opsTab === 'schedules'
                      ? 'scheduling'
                      : opsTab === 'verification'
                        ? 'owner-verification'
                        : opsTab === 'alerts'
                          ? 'incidents'
                          : 'shift-reports',
                  )
                }
                className="text-xs font-semibold text-[#10A878] hover:underline"
              >
                Open Full View →
              </button>
            </div>

            <div className="pt-4">
              {opsTab === 'schedules' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {data.schedules.slice(0, 3).map((sch) => (
                    <div
                      key={sch.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#10A878]">
                          {sch.shiftType} Shift
                        </span>
                        <StatusBadge label={sch.status} compact />
                      </div>
                      <p className="text-sm font-bold mt-1.5">{sch.locationName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-tabular">
                        {sch.startTime} – {sch.endTime} · {sch.requiredGuards} posts
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {opsTab === 'verification' && (
                <div className="space-y-2.5">
                  {data.shiftReports
                    .filter((r) => r.status === 'Finalized' || r.status === 'Awaiting Review')
                    .slice(0, 3)
                    .map((rep) => (
                      <div
                        key={rep.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D]"
                      >
                        <div>
                          <p className="text-xs font-bold">
                            {rep.guardName} · {rep.locationName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {rep.shiftType} Shift · {rep.shiftDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge label={rep.status} compact />
                          <button
                            type="button"
                            onClick={async () => {
                              await apiRequest(`/api/company/reports/${rep.id}/verify`, {
                                method: 'POST',
                              });
                              showToast({ title: 'Report verified by management', tone: 'success' });
                              void loadData();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {opsTab === 'alerts' && (
                <div className="space-y-2.5">
                  {data.incidents.slice(0, 3).map((inc) => (
                    <div
                      key={inc.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D]"
                    >
                      <div>
                        <p className="text-xs font-bold">
                          {inc.type} — {inc.locationName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {inc.description}
                        </p>
                      </div>
                      <StatusBadge label={inc.severity} compact />
                    </div>
                  ))}
                </div>
              )}

              {opsTab === 'reports' && (
                <div className="space-y-2.5">
                  {data.shiftReports.slice(0, 3).map((rep) => (
                    <div
                      key={rep.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D]"
                    >
                      <div>
                        <p className="text-xs font-bold">
                          {rep.locationName} · {rep.shiftType} Shift
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {rep.guardName} · Submitted {rep.submittedAt}
                        </p>
                      </div>
                      <StatusBadge label={rep.status} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : activeRoute === 'live-map' ? (
        <div className="space-y-4">
          {/* Full Live Map Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Company Live Guard Map
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Displaying only guards currently on active duty ({filteredLiveGuards.length} visible)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  placeholder="Search on-duty guard..."
                  className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#121E36] text-xs font-medium focus:outline-none focus:border-[#10A878]"
                />
              </div>
              <select
                value={mapLocationFilter}
                onChange={(e) => setMapLocationFilter(e.target.value)}
                aria-label="Filter map by location"
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#121E36] text-xs font-medium"
              >
                <option value="all">All Locations</option>
                {data.locations.slice(0, 6).map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <select
                value={mapPostFilter}
                onChange={(e) => setMapPostFilter(e.target.value)}
                aria-label="Filter map by post"
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#121E36] text-xs font-medium"
              >
                <option value="all">All Posts</option>
                {distinctPosts.map((post) => (
                  <option key={post} value={post}>
                    {post}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            <div className={`${cardCls} xl:col-span-8`}>
              <OperationsMap
                guards={filteredLiveGuards}
                selectedGuardId={selectedMapGuard?.id}
                onSelectGuard={setSelectedMapGuard}
                heightClass="h-[460px] lg:h-[540px]"
              />
            </div>

            <aside className={`${cardCls} xl:col-span-4 flex flex-col justify-between`}>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  Guard Telemetry Details
                </h3>
                {selectedMapGuard && filteredLiveGuards.some((g) => g.id === selectedMapGuard.id) ? (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={selectedMapGuard.avatar}
                        alt={selectedMapGuard.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#10A878]"
                      />
                      <div>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedMapGuard.name}
                        </p>
                        <p className="font-mono-tabular text-slate-500 dark:text-slate-400">
                          {selectedMapGuard.employeeId}
                        </p>
                        <div className="mt-1">
                          <StatusBadge label={selectedMapGuard.status} compact />
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A] rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D] px-4">
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">Assigned Location</span>
                        <span className="font-semibold">{selectedMapGuard.locationName}</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">Assigned Post</span>
                        <span className="font-semibold">{selectedMapGuard.postName}</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">Supervisor</span>
                        <span className="font-semibold">{selectedMapGuard.supervisorName}</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">Shift Start</span>
                        <span className="font-mono-tabular font-semibold">
                          {selectedMapGuard.shiftStartTime ?? 'Active'}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">Last GPS Update</span>
                        <span className="font-semibold">{selectedMapGuard.lastGpsUpdate}</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">GPS Accuracy</span>
                        <span className="font-mono-tabular font-semibold">
                          {selectedMapGuard.gpsAccuracyMeters
                            ? `±${selectedMapGuard.gpsAccuracyMeters}m`
                            : 'Simulated'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Select an active guard marker on the map to inspect live shift telemetry.
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#1D2D4A]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  On-Duty Roster ({filteredLiveGuards.length})
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {filteredLiveGuards.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedMapGuard(g)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        selectedMapGuard?.id === g.id
                          ? 'bg-[#10A878]/15 text-[#10A878] font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>{g.name}</span>
                      <span className="text-[11px] text-slate-400">{g.locationName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <CompanySubpages
          activeRoute={activeRoute}
          guards={data.allGuards}
          locations={data.locations}
          supervisors={data.supervisors}
          clients={data.clients}
          schedules={data.schedules}
          attendance={data.attendance}
          occurrences={data.occurrences}
          incidents={data.incidents}
          shiftReports={data.shiftReports}
          announcements={data.announcements}
          notifications={notifications}
          invoices={data.invoices}
          onCreateClient={async (payload) => {
            const res = await apiRequest<{ client: ClientRecord; location: LocationRecord }>(
              '/api/company/clients',
              {
                method: 'POST',
                body: JSON.stringify(payload),
              },
            );
            showToast({
              title: 'Client account registered',
              description: `${res.client.name} · ${res.location.name} added`,
              tone: 'success',
            });
            await loadData();
            return res;
          }}
          onAssignStation={async (payload) => {
            const res = await apiRequest<{ location: LocationRecord; supervisor: SupervisorRecord; guard: GuardRecord }>(
              `/api/company/stations/${payload.locationId}/assign`,
              {
                method: 'POST',
                body: JSON.stringify(payload),
              },
            );
            showToast({
              title: 'Supervisor & guard assigned',
              description: `${res.supervisor.name} & ${res.guard.name} assigned to ${res.location.name}`,
              tone: 'success',
            });
            await loadData();
          }}
          onCreateGuard={async (payload) => {
            await apiRequest('/api/company/guards', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            showToast({ title: 'Guard deployed to roster', tone: 'success' });
            await loadData();
          }}
          onCreateLocation={async (payload) => {
            await apiRequest('/api/company/locations', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            showToast({ title: 'Location added', tone: 'success' });
            await loadData();
          }}
          onCreateSchedule={async (payload) => {
            await apiRequest('/api/company/schedules', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            showToast({ title: 'Duty schedule created', tone: 'success' });
            await loadData();
          }}
          onUpdateIncidentStatus={async (id, status) => {
            await apiRequest(`/api/company/incidents/${id}/status`, {
              method: 'POST',
              body: JSON.stringify({ status }),
            });
            showToast({ title: `Incident marked ${status}`, tone: 'success' });
            await loadData();
          }}
          onVerifyReport={async (id) => {
            await apiRequest(`/api/company/reports/${id}/verify`, { method: 'POST' });
            showToast({ title: 'Report verified by owner', tone: 'success' });
            await loadData();
          }}
          onCreateAnnouncement={async (payload) => {
            await apiRequest('/api/announcements', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            showToast({ title: 'Announcement published', tone: 'success' });
            await loadData();
          }}
          onMarkNotificationRead={(id) => void handleMarkNotificationRead(id)}
          onExportCsv={handleExportCsv}
        />
      )}
    </DashboardShell>
  );
}
