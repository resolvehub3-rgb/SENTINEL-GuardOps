import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Radio,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  User,
} from 'lucide-react';
import { DashboardShell } from '../../components/common/DashboardShell';
import type { SidebarNavGroup } from '../../components/common/DashboardShell';
import { KpiCard } from '../../components/common/KpiCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { ReportReviewModal } from './ReportReviewModal';
import { apiRequest } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';
import type {
  AnnouncementRecord,
  AttendanceRecord,
  AuthUser,
  DutyScheduleRecord,
  GuardRecord,
  IncidentRecord,
  LocationRecord,
  NotificationRecord,
  OccurrenceRecord,
  ShiftReportRecord,
} from '../../types/guardops';
import type { SupervisorKpiSummary } from '../../utils/operations';

interface SupervisorOverviewPayload {
  supervisor: AuthUser;
  kpis: SupervisorKpiSummary;
  assignedGuards: GuardRecord[];
  assignedLocations: LocationRecord[];
  occurrences: OccurrenceRecord[];
  incidents: IncidentRecord[];
  shiftReports: ShiftReportRecord[];
  schedules: DutyScheduleRecord[];
  attendance: AttendanceRecord[];
  announcements: AnnouncementRecord[];
}

export function SupervisorPortal() {
  const { showToast } = useToast();
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [data, setData] = useState<SupervisorOverviewPayload | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [guardSearch, setGuardSearch] = useState('');
  const [guardFilter, setGuardFilter] = useState('all');
  const [scheduleRange, setScheduleRange] = useState<'today' | 'week'>('today');

  const [selectedGuard, setSelectedGuard] = useState<GuardRecord | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrenceRecord | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [reviewingReport, setReviewingReport] = useState<ShiftReportRecord | null>(null);

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [overview, notifRes] = await Promise.all([
        apiRequest<SupervisorOverviewPayload>('/api/supervisor/overview'),
        apiRequest<{ notifications: NotificationRecord[] }>('/api/notifications'),
      ]);
      setData(overview);
      setNotifications(notifRes.notifications);
    } catch (err) {
      showToast({
        title: 'Failed to load supervisor workspace',
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
      event.startsWith('duty:') ||
      event.startsWith('guard:') ||
      event.startsWith('location:') ||
      event.startsWith('schedule:') ||
      event.startsWith('occurrence:') ||
      event.startsWith('incident:') ||
      event.startsWith('report:') ||
      event.startsWith('announcement:')
    ) {
      void loadData();
    }
  });

  const handleMarkNotificationRead = async (id: string) => {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // Strictly NO company-wide Live Map in Supervisor navigation
  const groups: SidebarNavGroup[] = [
    {
      groupLabel: 'Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my-guards', label: 'My Guards', icon: Shield },
        { id: 'my-locations', label: 'My Locations', icon: MapPin },
        { id: 'schedules', label: 'Duty Schedules', icon: CalendarClock },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
      ],
    },
    {
      groupLabel: 'Monitoring & Review',
      items: [
        { id: 'occurrences', label: 'Live Occurrences', icon: Radio },
        {
          id: 'incidents',
          label: 'Incident Reports',
          icon: ShieldAlert,
          badgeCount: data?.kpis.incidentsNeedingAttention,
        },
        { id: 'shift-reports', label: 'Shift Reports', icon: FileText },
        {
          id: 'report-reviews',
          label: 'Report Reviews',
          icon: ClipboardCheck,
          badgeCount: data?.kpis.reportsAwaitingReview,
        },
      ],
    },
    {
      groupLabel: 'Team & Account',
      items: [
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badgeCount: notifications.filter((n) => !n.read).length,
        },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const filteredGuards = useMemo(() => {
    if (!data) return [];
    return data.assignedGuards.filter((g) => {
      if (guardFilter !== 'all' && g.status !== guardFilter) return false;
      if (guardSearch.trim()) {
        const q = guardSearch.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.employeeId.toLowerCase().includes(q) ||
          g.locationName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, guardSearch, guardFilter]);

  const cardCls =
    'rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-5';

  return (
    <DashboardShell
      headerTitle="Supervisor Dashboard"
      headerSubtitle="Monitor & Manage Your Team"
      orgLabel={data?.supervisor.initials ?? 'SP'}
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
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Supervisor Dashboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitor and manage your assigned security operations · {data.supervisor.name} ({data.supervisor.employeeId})
              </p>
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Avg Incident Response:{' '}
              <span className="font-bold tabular-nums text-[#10A878]">
                {data.kpis.avgResponseMinutes} min
              </span>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Assigned Guards"
              value={data.kpis.assignedGuards}
              trend="Assigned to your posts"
              trendDirection={data.kpis.assignedGuards > 0 ? 'up' : 'flat'}
              tone="navy"
              icon={Shield}
              onClick={() => setActiveRoute('my-guards')}
            />
            <KpiCard
              label="Guards On Duty"
              value={data.kpis.guardsOnDuty}
              trend="Active across posts"
              trendDirection={data.kpis.guardsOnDuty > 0 ? 'up' : 'flat'}
              tone="emerald"
              icon={User}
              onClick={() => setActiveRoute('my-guards')}
            />
            <KpiCard
              label="Incidents Requiring Attention"
              value={data.kpis.incidentsNeedingAttention}
              trend={`${data.incidents.length} total logged`}
              trendDirection={data.kpis.incidentsNeedingAttention > 0 ? 'down' : 'flat'}
              tone="amber"
              icon={AlertTriangle}
              onClick={() => setActiveRoute('incidents')}
            />
            <KpiCard
              label="Reports Awaiting Review"
              value={data.kpis.reportsAwaitingReview}
              trend={`${data.shiftReports.length} total submitted`}
              trendDirection={data.kpis.reportsAwaitingReview > 0 ? 'up' : 'flat'}
              tone="indigo"
              icon={ClipboardCheck}
              onClick={() => setActiveRoute('report-reviews')}
            />
          </div>

          {/* Main 2-Column Split */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Left Column: Assigned Guards Table + Live Occurrences */}
            <div className="xl:col-span-7 space-y-5">
              <section className={cardCls}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Assigned Guards
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={guardSearch}
                        onChange={(e) => setGuardSearch(e.target.value)}
                        placeholder="Search guard..."
                        className="pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-xs w-40 focus:outline-none focus:border-[#10A878]"
                      />
                    </div>
                    <select
                      value={guardFilter}
                      onChange={(e) => setGuardFilter(e.target.value)}
                      aria-label="Filter assigned guards"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-xs"
                    >
                      <option value="all">All Status</option>
                      <option value="On Duty">On Duty</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="On Break">On Break</option>
                      <option value="Late">Late</option>
                    </select>
                  </div>
                </div>

                {filteredGuards.length === 0 ? (
                  <EmptyState
                    title={
                      data.assignedGuards.length === 0
                        ? 'No guards assigned yet'
                        : 'No guards match filter'
                    }
                    description={
                      data.assignedGuards.length === 0
                        ? 'Guards assigned to your supervision stations will appear here.'
                        : 'Adjust search or duty status filter.'
                    }
                    icon={Shield}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#1E2E4A] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-2.5 pr-3">Guard</th>
                          <th className="py-2.5 px-2">Status</th>
                          <th className="py-2.5 px-2">Location</th>
                          <th className="py-2.5 px-2">Shift</th>
                          <th className="py-2.5 pl-2 text-right">Profile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1A2A46] text-xs">
                        {filteredGuards.slice(0, 6).map((g) => (
                          <tr key={g.id} className="hover:bg-slate-50/70 dark:hover:bg-white/3">
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={g.avatar}
                                  alt={g.name}
                                  referrerPolicy="no-referrer"
                                  className="w-7 h-7 rounded-full object-cover"
                                />
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    {g.name}
                                  </p>
                                  <p className="text-[11px] font-mono-tabular text-slate-400">
                                    {g.employeeId}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-2">
                              <StatusBadge label={g.status} compact />
                            </td>
                            <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                              {g.locationName}
                            </td>
                            <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400">
                              {g.shiftType}
                            </td>
                            <td className="py-2.5 pl-2 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedGuard(g)}
                                aria-label={`View profile for ${g.name}`}
                                className="p-1.5 rounded-lg text-[#10A878] hover:bg-[#10A878]/10"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className={cardCls}>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Occurrences
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('occurrences')}
                    className="text-xs font-semibold text-[#10A878] hover:underline"
                  >
                    View All →
                  </button>
                </div>
                {data.occurrences.length === 0 ? (
                  <EmptyState
                    title="No live occurrences yet"
                    description="Patrol observations submitted by your assigned guards will appear here."
                    icon={Radio}
                  />
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A]">
                    {data.occurrences.slice(0, 4).map((occ) => (
                      <div
                        key={occ.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-bold text-[#10A878]">{occ.category}</span>
                            <span>·</span>
                            <span>{occ.createdAt}</span>
                            <span>·</span>
                            <span>{occ.locationName}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                            {occ.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge label={occ.status} compact />
                          <button
                            type="button"
                            onClick={() => setSelectedOccurrence(occ)}
                            className="text-xs font-semibold text-slate-500 hover:text-[#10A878]"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Shift Schedule + Incidents Needing Attention + Shift Report Review Queue */}
            <div className="xl:col-span-5 space-y-5">
              <section className={cardCls}>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Shift Schedule
                  </h3>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#0D182D]">
                    {(['today', 'week'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setScheduleRange(r)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize ${
                          scheduleRange === r
                            ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                {data.schedules.length === 0 ? (
                  <EmptyState
                    title="No shifts scheduled"
                    description="Upcoming shift assignments for your supervised sites will appear here."
                    icon={CalendarClock}
                  />
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A] text-xs">
                    {data.schedules.map((sch) => (
                      <div key={sch.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {sch.shiftType} Shift · {sch.locationName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {scheduleRange === 'week' ? `${sch.date} · ` : ''}
                            {sch.assignedGuardNames.join(', ')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono-tabular font-semibold">
                            {sch.startTime} – {sch.endTime}
                          </p>
                          <p className="text-[11px] text-[#10A878] font-semibold">
                            {sch.requiredGuards} Guards
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className={cardCls}>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Incidents Needing Attention
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-500 text-xs font-bold tabular-nums">
                    {data.kpis.incidentsNeedingAttention}
                  </span>
                </div>
                {data.incidents.filter((i) => i.status !== 'Resolved').length === 0 ? (
                  <EmptyState
                    title="No open incidents"
                    description="Active incidents escalated from your assigned sites will appear here."
                    icon={ShieldAlert}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {data.incidents
                      .filter((i) => i.status !== 'Resolved')
                      .slice(0, 4)
                      .map((inc) => (
                        <button
                          key={inc.id}
                          type="button"
                          onClick={() => setSelectedIncident(inc)}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D] hover:border-[#10A878] flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <StatusBadge label={inc.severity} compact />
                              <span className="text-[11px] text-slate-400">{inc.reportedAt}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                              {inc.type} — {inc.locationName}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                      ))}
                  </div>
                )}
              </section>

              <section className={cardCls}>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Shift Report Review Queue
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-xs font-bold tabular-nums">
                      {data.kpis.reportsAwaitingReview}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('report-reviews')}
                    className="text-xs font-semibold text-[#10A878] hover:underline"
                  >
                    View All →
                  </button>
                </div>
                {data.shiftReports.length === 0 ? (
                  <EmptyState
                    title="No shift reports to review"
                    description="Closed guard shift reports awaiting your verification will appear here."
                    icon={ClipboardCheck}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {data.shiftReports.slice(0, 4).map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {rep.shiftType} Shift — {rep.locationName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {rep.guardName} · {rep.shiftDate} · {rep.submittedAt}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge label={rep.status} compact />
                          <button
                            type="button"
                            onClick={() => setReviewingReport(rep)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white text-[11px] font-semibold"
                          >
                            Review Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : activeRoute === 'report-reviews' || activeRoute === 'shift-reports' ? (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeRoute === 'report-reviews' ? 'Shift Report Review Queue' : 'Shift Reports'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect submitted guard shift reports, finalize reviews, or return with correction notes
            </p>
          </div>
          {data.shiftReports.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                title="No shift reports submitted yet"
                description="Shift reports closed by your assigned guards will appear here for review."
                icon={FileText}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {data.shiftReports.map((rep) => (
                <div
                  key={rep.id}
                  className={`${cardCls} flex flex-wrap items-center justify-between gap-4`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-slate-400">
                        {rep.id.toUpperCase()}
                      </span>
                      <StatusBadge label={rep.status} compact />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {rep.guardName} ({rep.employeeId}) — {rep.locationName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {rep.shiftType} Shift · {rep.shiftDate} · Submitted {rep.submittedAt}
                    </p>
                    {rep.reviewReason && (
                      <p className="text-xs text-amber-500 mt-1">
                        Correction note: {rep.reviewReason}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewingReport(rep)}
                    className="px-4 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white text-xs font-semibold shrink-0"
                  >
                    Review Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeRoute === 'my-guards' ? (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            My Assigned Guards
          </h2>
          {data.assignedGuards.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                title="No guards assigned yet"
                description="Guards assigned to your supervision stations will appear here."
                icon={Shield}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.assignedGuards.map((g) => (
                <div key={g.id} className={cardCls}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={g.avatar}
                        alt={g.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-bold">{g.name}</p>
                        <p className="text-xs font-mono-tabular text-slate-400">{g.employeeId}</p>
                      </div>
                    </div>
                    <StatusBadge label={g.status} compact />
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1D2D4A] text-xs space-y-1">
                    <p>
                      <span className="text-slate-400">Location: </span>
                      <span className="font-semibold">{g.locationName} ({g.postName})</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Last Activity: </span>
                      <span>{g.lastActivity}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeRoute === 'my-locations' ? (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            My Assigned Locations
          </h2>
          {data.assignedLocations.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                title="No locations assigned yet"
                description="Client stations assigned to you by company management will appear here."
                icon={MapPin}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.assignedLocations.map((loc) => (
                <div key={loc.id} className={cardCls}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold">{loc.name}</h3>
                      <p className="text-xs text-slate-400">{loc.address}</p>
                    </div>
                    <StatusBadge label={loc.status} compact />
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1D2D4A] flex justify-between text-xs">
                    <span>Guards On Duty: {loc.onDutyCount}/{loc.assignedGuardsCount}</span>
                    <span className="font-bold text-[#10A878] tabular-nums">
                      Attendance: {loc.attendanceRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeRoute === 'schedules' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Duty Schedules</h2>
          <div className={cardCls}>
            {data.schedules.length === 0 ? (
              <EmptyState
                title="No duty schedules yet"
                description="Scheduled shifts for your assigned stations will appear here."
                icon={CalendarClock}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A] text-xs">
                {data.schedules.map((sch) => (
                  <div key={sch.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm">
                        {sch.locationName} — {sch.shiftType} Shift
                      </p>
                      <p className="text-slate-400">
                        {sch.date} · {sch.startTime} to {sch.endTime} · {sch.assignedGuardNames.join(', ')}
                      </p>
                    </div>
                    <StatusBadge label={sch.status} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeRoute === 'attendance' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Team Attendance</h2>
          <div className={cardCls}>
            {data.attendance.length === 0 ? (
              <EmptyState
                title="No team attendance logs yet"
                description="Guard check-ins and shift completion timestamps appear here."
                icon={CalendarCheck}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A] text-xs">
                {data.attendance.map((att) => (
                  <div key={att.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{att.guardName} ({att.employeeId})</p>
                      <p className="text-slate-400">
                        {att.locationName} · Scheduled {att.scheduledStart} · Check-in {att.actualCheckIn ?? 'Pending'}
                      </p>
                    </div>
                    <StatusBadge label={att.status} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeRoute === 'occurrences' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Occurrences</h2>
          {data.occurrences.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                title="No occurrences recorded yet"
                description="Patrol observations logged by your team will appear here."
                icon={Radio}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {data.occurrences.map((occ) => (
                <div key={occ.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-4`}>
                  <div>
                    <span className="text-xs font-bold text-[#10A878]">{occ.category}</span>
                    <h3 className="text-sm font-bold mt-0.5">{occ.description}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {occ.guardName} · {occ.locationName} · {occ.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={occ.status} compact />
                    {occ.status !== 'Acknowledged' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiRequest(`/api/supervisor/occurrences/${occ.id}/acknowledge`, {
                            method: 'POST',
                          });
                          showToast({ title: 'Occurrence acknowledged', tone: 'success' });
                          void loadData();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeRoute === 'incidents' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assigned Incident Reports</h2>
          {data.incidents.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                title="No incident reports yet"
                description="Incidents escalated by guards on your assigned sites will appear here."
                icon={ShieldAlert}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {data.incidents.map((inc) => (
                <div key={inc.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-4`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge label={inc.severity} compact />
                      <StatusBadge label={inc.status} compact />
                    </div>
                    <h3 className="text-sm font-bold mt-1.5">{inc.type} — {inc.locationName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{inc.description}</p>
                  </div>
                  {inc.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/api/company/incidents/${inc.id}/status`, {
                          method: 'POST',
                          body: JSON.stringify({ status: 'Resolved' }),
                        });
                        showToast({ title: 'Incident marked resolved', tone: 'success' });
                        void loadData();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeRoute === 'announcements' ? (
        <div className="space-y-5 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Team Announcements</h2>
          <form
            className={`${cardCls} space-y-3 text-xs`}
            onSubmit={async (e) => {
              e.preventDefault();
              await apiRequest('/api/announcements', {
                method: 'POST',
                body: JSON.stringify({
                  title: annTitle,
                  body: annBody,
                  audience: 'Field Guards',
                  priority: 'Standard',
                }),
              });
              setAnnTitle('');
              setAnnBody('');
              showToast({ title: 'Shift briefing posted', tone: 'success' });
              void loadData();
            }}
          >
            <h3 className="font-bold text-sm">Post Shift Briefing</h3>
            <input
              required
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Briefing title"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D]"
            />
            <textarea
              required
              rows={2}
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              placeholder="Operational instructions for assigned guards..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D]"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#10A878] text-white font-semibold">
              Publish Briefing
            </button>
          </form>
          {data.announcements.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                title="No briefings posted yet"
                description="Publish a shift briefing above or view directives from company management here."
                icon={Megaphone}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {data.announcements.map((ann) => (
                <div key={ann.id} className={cardCls}>
                  <h3 className="text-sm font-bold">{ann.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{ann.body}</p>
                  <p className="text-[11px] text-slate-400 mt-2">{ann.author} · {ann.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeRoute === 'notifications' ? (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h2>
          {notifications.length === 0 ? (
            <div className={cardCls}>
              <EmptyState
                title="No notifications yet"
                description="Station assignments and guard escalations will appear here."
                icon={Bell}
              />
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`${cardCls} flex items-center justify-between gap-4`}>
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
        <div className={`${cardCls} max-w-xl space-y-4 text-xs`}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {activeRoute === 'profile' ? 'Supervisor Profile' : 'Supervisor Preferences'}
          </h2>
          <div className="flex items-center gap-3.5">
            <img
              src={data.supervisor.avatar}
              alt={data.supervisor.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border-2 border-[#10A878]"
            />
            <div>
              <p className="text-base font-bold">{data.supervisor.name}</p>
              <p className="text-slate-400">{data.supervisor.title} · {data.supervisor.employeeId}</p>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSettingsSaved(true)}
              className="px-4 py-2 rounded-lg bg-[#10A878] text-white font-semibold"
            >
              {settingsSaved ? 'Preferences Saved' : 'Save Notification Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* Guard Profile Modal */}
      <Modal
        open={selectedGuard !== null}
        onClose={() => setSelectedGuard(null)}
        title={selectedGuard?.name ?? 'Guard Profile'}
        subtitle={selectedGuard?.employeeId}
      >
        {selectedGuard && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3.5">
              <img
                src={selectedGuard.avatar}
                alt={selectedGuard.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border-2 border-[#10A878]"
              />
              <div>
                <p className="text-base font-bold">{selectedGuard.name}</p>
                <p className="text-slate-400">
                  {selectedGuard.locationName} · {selectedGuard.postName}
                </p>
                <div className="mt-1">
                  <StatusBadge label={selectedGuard.status} compact />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D]">
              <div>
                <span className="text-slate-400 block">Shift Window</span>
                <span className="font-semibold">{selectedGuard.shiftWindow}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Last Activity</span>
                <span className="font-semibold">{selectedGuard.lastActivity}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-mono-tabular font-semibold">{selectedGuard.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Attendance Score</span>
                <span className="font-bold text-[#10A878] tabular-nums">
                  {selectedGuard.attendanceScore}%
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Occurrence Detail Modal */}
      <Modal
        open={selectedOccurrence !== null}
        onClose={() => setSelectedOccurrence(null)}
        title={selectedOccurrence ? `${selectedOccurrence.category} — ${selectedOccurrence.locationName}` : ''}
        subtitle={selectedOccurrence?.createdAt}
      >
        {selectedOccurrence && (
          <div className="space-y-3 text-xs">
            <StatusBadge label={selectedOccurrence.status} compact />
            <p className="text-sm leading-relaxed">{selectedOccurrence.description}</p>
            <p className="text-slate-400">
              Logged by {selectedOccurrence.guardName} · {selectedOccurrence.gpsLabel}
            </p>
            {selectedOccurrence.evidenceUrl && (
              <img
                src={selectedOccurrence.evidenceUrl}
                alt="Occurrence evidence"
                referrerPolicy="no-referrer"
                className="w-full h-44 object-cover rounded-xl border border-slate-200 dark:border-[#1E2E4A]"
              />
            )}
          </div>
        )}
      </Modal>

      {/* Incident Detail Modal */}
      <Modal
        open={selectedIncident !== null}
        onClose={() => setSelectedIncident(null)}
        title={selectedIncident ? `${selectedIncident.type} — ${selectedIncident.locationName}` : ''}
        subtitle={selectedIncident?.reportedAt}
      >
        {selectedIncident && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <StatusBadge label={selectedIncident.severity} compact />
              <StatusBadge label={selectedIncident.status} compact />
            </div>
            <p className="text-sm leading-relaxed">{selectedIncident.description}</p>
            <p className="text-slate-400">Reported by {selectedIncident.guardName}</p>
            <div className="flex justify-end gap-2 pt-2">
              {selectedIncident.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={async () => {
                    await apiRequest(`/api/company/incidents/${selectedIncident.id}/status`, {
                      method: 'POST',
                      body: JSON.stringify({ status: 'Resolved' }),
                    });
                    setSelectedIncident(null);
                    showToast({ title: 'Incident resolved', tone: 'success' });
                    void loadData();
                  }}
                  className="px-4 py-2 rounded-lg bg-[#10A878] text-white font-semibold"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Report Review Workspace Modal */}
      <ReportReviewModal
        report={reviewingReport}
        occurrences={data?.occurrences ?? []}
        incidents={data?.incidents ?? []}
        onClose={() => setReviewingReport(null)}
        onSubmitReview={async (reportId, action, reason) => {
          await apiRequest(`/api/supervisor/reports/${reportId}/review`, {
            method: 'POST',
            body: JSON.stringify({ action, reason }),
          });
          showToast({
            title:
              action === 'finalize'
                ? 'Shift report finalized'
                : 'Shift report returned for correction',
            tone: action === 'finalize' ? 'success' : 'warning',
          });
          await loadData();
        }}
      />
    </DashboardShell>
  );
}
