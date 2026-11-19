import React, { useMemo, useState } from 'react';
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  MapPin,
  Megaphone,
  Plus,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ClientRegistrationModal,
  StationTeamAssignModal,
} from './CompanyClientModals';
import type {
  AssignStationPayload,
  CreateClientPayload,
} from './CompanyClientModals';
import { summarizeClientStationCoverage } from '../../utils/operations';
import type {
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

interface CompanySubpagesProps {
  activeRoute: string;
  guards: GuardRecord[];
  locations: LocationRecord[];
  supervisors: SupervisorRecord[];
  clients: ClientRecord[];
  schedules: DutyScheduleRecord[];
  attendance: AttendanceRecord[];
  occurrences: OccurrenceRecord[];
  incidents: IncidentRecord[];
  shiftReports: ShiftReportRecord[];
  announcements: AnnouncementRecord[];
  notifications: NotificationRecord[];
  invoices: BillingInvoiceRecord[];
  onCreateClient: (
    payload: CreateClientPayload,
  ) => Promise<{ client: ClientRecord; location: LocationRecord }>;
  onAssignStation: (payload: AssignStationPayload) => Promise<void>;
  onCreateGuard: (payload: {
    name: string;
    phone: string;
    locationId: string;
    postName: string;
    shiftType: 'Day' | 'Evening' | 'Night';
  }) => Promise<void>;
  onCreateLocation: (payload: {
    name: string;
    clientId: string;
    address: string;
    zone: string;
    supervisorId: string;
  }) => Promise<void>;
  onCreateSchedule: (payload: {
    locationId: string;
    shiftType: 'Day' | 'Evening' | 'Night';
    date: string;
    startTime: string;
    endTime: string;
    guardId: string;
  }) => Promise<void>;
  onUpdateIncidentStatus: (
    id: string,
    status: 'Open' | 'Investigating' | 'Resolved' | 'Escalated',
  ) => Promise<void>;
  onVerifyReport: (id: string) => Promise<void>;
  onCreateAnnouncement: (payload: {
    title: string;
    body: string;
    audience: 'All Personnel' | 'Supervisors Only' | 'Field Guards';
    priority: 'Standard' | 'Urgent';
  }) => Promise<void>;
  onMarkNotificationRead: (id: string) => void;
  onExportCsv: (filename: string, rows: Array<Record<string, unknown>>) => void;
}

export function CompanySubpages({
  activeRoute,
  guards,
  locations,
  supervisors,
  clients,
  schedules,
  attendance,
  occurrences,
  incidents,
  shiftReports,
  announcements,
  notifications,
  invoices,
  onCreateClient,
  onAssignStation,
  onCreateGuard,
  onCreateLocation,
  onCreateSchedule,
  onUpdateIncidentStatus,
  onVerifyReport,
  onCreateAnnouncement,
  onMarkNotificationRead,
  onExportCsv,
}: CompanySubpagesProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{
    clientName: string;
    stations: LocationRecord[];
    initialLocationId?: string;
  } | null>(null);
  const [guardModalOpen, setGuardModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [announceModalOpen, setAnnounceModalOpen] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<GuardRecord | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);

  // Form States
  const [newGuardName, setNewGuardName] = useState('');
  const [newGuardPhone, setNewGuardPhone] = useState('');
  const [newGuardLoc, setNewGuardLoc] = useState(locations[0]?.id ?? 'loc-1');
  const [newGuardPost, setNewGuardPost] = useState('Main Access Gate');
  const [newGuardShift, setNewGuardShift] = useState<'Day' | 'Evening' | 'Night'>('Day');

  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocZone, setNewLocZone] = useState('Metro Zone');
  const [newLocClient, setNewLocClient] = useState(clients[0]?.id ?? 'cli-1');
  const [newLocSup, setNewLocSup] = useState(supervisors[0]?.id ?? 'usr-sup-1');

  const [schLoc, setSchLoc] = useState(locations[0]?.id ?? 'loc-1');
  const [schShift, setSchShift] = useState<'Day' | 'Evening' | 'Night'>('Day');
  const [schDate, setSchDate] = useState('2026-11-20');
  const [schGuard, setSchGuard] = useState(guards[0]?.id ?? '');

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annAudience, setAnnAudience] = useState<
    'All Personnel' | 'Supervisors Only' | 'Field Guards'
  >('All Personnel');
  const [annPriority, setAnnPriority] = useState<'Standard' | 'Urgent'>('Standard');

  const [companyEmailAlerts, setCompanyEmailAlerts] = useState(true);
  const [staleGpsMinutes, setStaleGpsMinutes] = useState('10');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const cardCls =
    'rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-5';
  const inputCls =
    'px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#10A878]';

  const filteredGuards = useMemo(() => {
    return guards.filter((g) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.employeeId.toLowerCase().includes(q) ||
          g.locationName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [guards, search, statusFilter]);

  if (activeRoute === 'clients') {
    const filteredClients = clients.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q)
      );
    });
    const totalContractMonthly = clients.reduce((sum, c) => sum + c.contractValueMonthly, 0);

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Client Accounts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Company-registered client contracts, station pricing, and assigned supervisors &amp; guards ·{' '}
              <span className="font-semibold text-[#10A878]">
                GH₵{totalContractMonthly.toLocaleString()}/mo total value
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className={`${inputCls} pl-8 w-44 sm:w-52`}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onExportCsv('acme-clients.csv', clients as unknown as Array<Record<string, unknown>>)
              }
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#121E36] text-xs font-semibold flex items-center gap-2 hover:border-[#10A878] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              data-testid="add-client-button"
              onClick={() => setClientModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const coverage = summarizeClientStationCoverage(client, locations, guards);
            const primarySite = coverage.sites[0];
            return (
              <div key={client.id} className={`${cardCls} flex flex-col justify-between gap-4`}>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#10213D] text-[#10A878] flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {client.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {client.industry} · {Math.max(client.activeSites, coverage.sites.length)}{' '}
                          {Math.max(client.activeSites, coverage.sites.length) === 1 ? 'site' : 'sites'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge label={client.status} compact />
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#1D2D4A] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Primary Contact</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {client.contactName}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-0.5 truncate">
                        {client.contactPhone}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">
                        {client.billingCycle ?? 'Monthly'} Contract Price
                      </span>
                      <span className="text-sm font-extrabold tabular-nums text-[#10A878]">
                        GH₵{client.contractValueMonthly.toLocaleString()}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        {primarySite?.shiftCoverage ?? 'Standard Coverage'}
                      </span>
                    </div>
                  </div>

                  {/* Station & Assigned Supervisor / Guard Summary */}
                  <div className="mt-3.5 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D] p-3 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Work Station
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 block truncate">
                          {primarySite
                            ? `${primarySite.name} — ${primarySite.address}`
                            : 'No station assigned yet'}
                        </span>
                      </div>
                      {coverage.unassignedSitesCount > 0 && (
                        <StatusBadge label="Needs Team" tone="amber" compact />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/70 dark:border-[#1E2E4A]">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                          Supervisor
                        </span>
                        <span
                          className={`font-semibold ${
                            coverage.supervisorsAssigned.length > 0
                              ? 'text-slate-800 dark:text-slate-100'
                              : 'text-amber-500'
                          }`}
                        >
                          {coverage.supervisorsAssigned.length > 0
                            ? coverage.supervisorsAssigned.join(', ')
                            : 'Unassigned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                          Assigned Guard{coverage.assignedGuards.length === 1 ? '' : 's'}
                        </span>
                        <span
                          className={`font-semibold ${
                            coverage.assignedGuards.length > 0
                              ? 'text-slate-800 dark:text-slate-100'
                              : 'text-amber-500'
                          }`}
                        >
                          {coverage.assignedGuards.length > 0
                            ? coverage.assignedGuards
                                .slice(0, 2)
                                .map((g) => g.name)
                                .join(', ') +
                              (coverage.assignedGuards.length > 2
                                ? ` +${coverage.assignedGuards.length - 2}`
                                : '')
                            : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 truncate">
                    {client.contactEmail}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAssignTarget({
                        clientName: client.name,
                        stations: coverage.sites,
                        initialLocationId: primarySite?.id,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#10213D] hover:bg-[#162C50] dark:bg-[#172B4D] dark:hover:bg-[#1D355E] text-white text-[11px] font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#10A878]" />
                    <span>Assign Supervisor &amp; Guard</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <ClientRegistrationModal
          open={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          supervisors={supervisors}
          guards={guards}
          onCreateClient={onCreateClient}
          onAssignStation={onAssignStation}
        />

        <StationTeamAssignModal
          open={assignTarget !== null}
          onClose={() => setAssignTarget(null)}
          clientName={assignTarget?.clientName ?? ''}
          stations={assignTarget?.stations ?? []}
          initialLocationId={assignTarget?.initialLocationId}
          supervisors={supervisors}
          guards={guards}
          onAssignStation={onAssignStation}
        />
      </div>
    );
  }

  if (activeRoute === 'locations') {
    const visibleLocs = locations.slice(0, 18).filter((l) =>
      search.trim()
        ? l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.zone.toLowerCase().includes(search.toLowerCase())
        : true,
    );
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Security Locations & Posts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {locations.length} total contracted security sites across all zones
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search locations..."
                className={`${inputCls} pl-8 w-52`}
              />
            </div>
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Location</span>
            </button>
          </div>
        </div>

        <div className={cardCls}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1E2E4A] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-4">Location</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Supervisor</th>
                  <th className="py-3 px-3 text-right">Guards</th>
                  <th className="py-3 px-3 text-right">Attendance</th>
                  <th className="py-3 pl-3 text-right">Status</th>
                  <th className="py-3 pl-3 text-right">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A2A46] text-xs">
                {visibleLocs.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/70 dark:hover:bg-white/3">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-slate-900 dark:text-white">{loc.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {loc.postCode} · {loc.zone}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {loc.clientName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {loc.supervisorName === 'Unassigned' ? (
                        <span className="text-amber-500 font-semibold">Unassigned</span>
                      ) : (
                        loc.supervisorName
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold tabular-nums">
                      {loc.onDutyCount}/{loc.assignedGuardsCount}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold tabular-nums text-[#10A878]">
                      {loc.attendanceRate}%
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <StatusBadge label={loc.status} compact />
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setAssignTarget({
                            clientName: loc.clientName,
                            stations: [loc],
                            initialLocationId: loc.id,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#24395D] hover:border-[#10A878] text-[11px] font-semibold cursor-pointer"
                      >
                        Assign Team
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <StationTeamAssignModal
          open={assignTarget !== null}
          onClose={() => setAssignTarget(null)}
          clientName={assignTarget?.clientName ?? ''}
          stations={assignTarget?.stations ?? []}
          initialLocationId={assignTarget?.initialLocationId}
          supervisors={supervisors}
          guards={guards}
          onAssignStation={onAssignStation}
        />

        <Modal
          open={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          title="Add Security Location"
          subtitle="Create a contracted post and assign a regional supervisor"
        >
          <form
            className="space-y-3.5"
            onSubmit={async (e) => {
              e.preventDefault();
              await onCreateLocation({
                name: newLocName,
                clientId: newLocClient,
                address: newLocAddress,
                zone: newLocZone,
                supervisorId: newLocSup,
              });
              setNewLocName('');
              setNewLocAddress('');
              setLocationModalOpen(false);
            }}
          >
            <div>
              <label className="block text-xs font-semibold mb-1">Location Name</label>
              <input
                required
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                placeholder="e.g., East Harbor Logistics Hub"
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Street Address</label>
              <input
                required
                value={newLocAddress}
                onChange={(e) => setNewLocAddress(e.target.value)}
                placeholder="45 Maritime Drive"
                className={`${inputCls} w-full`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Client</label>
                <select
                  value={newLocClient}
                  onChange={(e) => setNewLocClient(e.target.value)}
                  className={`${inputCls} w-full`}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Supervisor</label>
                <select
                  value={newLocSup}
                  onChange={(e) => setNewLocSup(e.target.value)}
                  className={`${inputCls} w-full`}
                >
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
              >
                Create Location
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  if (activeRoute === 'guards') {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Security Guards Roster
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage field officers, shift assignments, and live duty status
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guard or ID..."
                className={`${inputCls} pl-8 w-48`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter guards by duty status"
              className={inputCls}
            >
              <option value="all">All Statuses</option>
              <option value="On Duty">On Duty</option>
              <option value="Off Duty">Off Duty</option>
              <option value="On Break">On Break</option>
              <option value="Late">Late</option>
            </select>
            <button
              type="button"
              onClick={() => setGuardModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy Guard</span>
            </button>
          </div>
        </div>

        <div className={cardCls}>
          {filteredGuards.length === 0 ? (
            <EmptyState
              title="No guards match your filter"
              description="Try clearing the search term or status filter."
              icon={Users}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1E2E4A] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 pr-4">Guard</th>
                    <th className="py-3 px-3">Employee ID</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Assigned Post</th>
                    <th className="py-3 px-3">Shift</th>
                    <th className="py-3 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1A2A46] text-xs">
                  {filteredGuards.map((guard) => (
                    <tr key={guard.id} className="hover:bg-slate-50/70 dark:hover:bg-white/3">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={guard.avatar}
                            alt={guard.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-[#24395D]"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {guard.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Sup: {guard.supervisorName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono-tabular text-slate-600 dark:text-slate-300">
                        {guard.employeeId}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge label={guard.status} compact />
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {guard.locationName}
                        </p>
                        <p className="text-[11px] text-slate-500">{guard.postName}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {guard.shiftType} · {guard.shiftWindow}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedGuard(guard)}
                          className="text-xs font-semibold text-[#10A878] hover:underline"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal
          open={guardModalOpen}
          onClose={() => setGuardModalOpen(false)}
          title="Deploy New Security Guard"
          subtitle="Assign officer directly to an active site roster"
        >
          <form
            className="space-y-3.5"
            onSubmit={async (e) => {
              e.preventDefault();
              await onCreateGuard({
                name: newGuardName,
                phone: newGuardPhone,
                locationId: newGuardLoc,
                postName: newGuardPost,
                shiftType: newGuardShift,
              });
              setNewGuardName('');
              setNewGuardPhone('');
              setGuardModalOpen(false);
            }}
          >
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <input
                required
                value={newGuardName}
                onChange={(e) => setNewGuardName(e.target.value)}
                placeholder="e.g., Daniel Mensah"
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Contact Phone</label>
              <input
                required
                value={newGuardPhone}
                onChange={(e) => setNewGuardPhone(e.target.value)}
                placeholder="+44 7700 900510"
                className={`${inputCls} w-full`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Assigned Location</label>
                <select
                  value={newGuardLoc}
                  onChange={(e) => setNewGuardLoc(e.target.value)}
                  className={`${inputCls} w-full`}
                >
                  {locations.slice(0, 10).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Shift</label>
                <select
                  value={newGuardShift}
                  onChange={(e) =>
                    setNewGuardShift(e.target.value as 'Day' | 'Evening' | 'Night')
                  }
                  className={`${inputCls} w-full`}
                >
                  <option value="Day">Day Shift</option>
                  <option value="Evening">Evening Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Post Assignment</label>
              <input
                required
                value={newGuardPost}
                onChange={(e) => setNewGuardPost(e.target.value)}
                className={`${inputCls} w-full`}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGuardModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
              >
                Deploy Guard
              </button>
            </div>
          </form>
        </Modal>

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
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedGuard.name}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {selectedGuard.locationName} · {selectedGuard.postName}
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge label={selectedGuard.status} compact />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D182D] border border-slate-200 dark:border-[#1E2E4A]">
                <div>
                  <span className="text-slate-400 block">Supervisor</span>
                  <span className="font-semibold">{selectedGuard.supervisorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Shift Window</span>
                  <span className="font-semibold">{selectedGuard.shiftWindow}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Last GPS Ping</span>
                  <span className="font-semibold">{selectedGuard.lastGpsUpdate}</span>
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
      </div>
    );
  }

  if (activeRoute === 'supervisors') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Regional Supervisors
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Field leadership overseeing site compliance and shift report verification
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supervisors.map((sup) => (
            <div key={sup.id} className={cardCls}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={sup.avatar}
                    alt={sup.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-[#10A878]/40"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {sup.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                      {sup.employeeId} · {sup.email}
                    </p>
                  </div>
                </div>
                <StatusBadge label={sup.status} compact />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1D2D4A] grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Assigned Guards</span>
                  <span className="font-bold tabular-nums">{sup.assignedGuardsCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Avg Response</span>
                  <span className="font-bold tabular-nums">{sup.avgResponseMinutes} min</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Locations</span>
                  <span className="font-bold tabular-nums">{sup.assignedLocations.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeRoute === 'assignments' || activeRoute === 'scheduling') {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeRoute === 'assignments' ? 'Post Assignments' : 'Duty Scheduling'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Day, Evening, and Night shift coverage across contracted posts
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScheduleModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Schedule Shift</span>
          </button>
        </div>

        <div className={cardCls}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1E2E4A] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-4">Location</th>
                  <th className="py-3 px-3">Shift</th>
                  <th className="py-3 px-3">Date & Window</th>
                  <th className="py-3 px-3">Assigned Officers</th>
                  <th className="py-3 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A2A46] text-xs">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/70 dark:hover:bg-white/3">
                    <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">
                      {sch.locationName}
                    </td>
                    <td className="py-3 px-3 font-semibold">{sch.shiftType} Shift</td>
                    <td className="py-3 px-3 font-mono-tabular text-slate-600 dark:text-slate-300">
                      {sch.date} · {sch.startTime}–{sch.endTime}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {sch.assignedGuardNames.join(', ')}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <StatusBadge label={sch.status} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          open={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title="Create Duty Schedule"
          subtitle="Assign a guard to an upcoming shift window"
        >
          <form
            className="space-y-3.5"
            onSubmit={async (e) => {
              e.preventDefault();
              const times =
                schShift === 'Night'
                  ? { startTime: '22:00', endTime: '06:00' }
                  : schShift === 'Evening'
                    ? { startTime: '14:00', endTime: '22:00' }
                    : { startTime: '06:00', endTime: '14:00' };
              await onCreateSchedule({
                locationId: schLoc,
                shiftType: schShift,
                date: schDate,
                ...times,
                guardId: schGuard,
              });
              setScheduleModalOpen(false);
            }}
          >
            <div>
              <label className="block text-xs font-semibold mb-1">Location</label>
              <select
                value={schLoc}
                onChange={(e) => setSchLoc(e.target.value)}
                className={`${inputCls} w-full`}
              >
                {locations.slice(0, 10).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Shift Type</label>
                <select
                  value={schShift}
                  onChange={(e) =>
                    setSchShift(e.target.value as 'Day' | 'Evening' | 'Night')
                  }
                  className={`${inputCls} w-full`}
                >
                  <option value="Day">Day (06:00–14:00)</option>
                  <option value="Evening">Evening (14:00–22:00)</option>
                  <option value="Night">Night (22:00–06:00)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Shift Date</label>
                <input
                  type="date"
                  required
                  value={schDate}
                  onChange={(e) => setSchDate(e.target.value)}
                  className={`${inputCls} w-full`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Assign Guard</label>
              <select
                value={schGuard}
                onChange={(e) => setSchGuard(e.target.value)}
                className={`${inputCls} w-full`}
              >
                {guards.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
              >
                Save Schedule
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  if (activeRoute === 'attendance') {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Attendance & Check-In Logs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified shift check-in and check-out punctuality records
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onExportCsv('attendance-log.csv', attendance as unknown as Array<Record<string, unknown>>)
            }
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#121E36] text-xs font-semibold flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
        <div className={cardCls}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1E2E4A] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-4">Guard</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Scheduled</th>
                  <th className="py-3 px-3">Check-In</th>
                  <th className="py-3 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A2A46] text-xs">
                {attendance.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">
                      {row.guardName}{' '}
                      <span className="font-mono-tabular font-normal text-slate-400">
                        ({row.employeeId})
                      </span>
                    </td>
                    <td className="py-3 px-3">{row.locationName}</td>
                    <td className="py-3 px-3 font-mono-tabular">{row.shiftDate}</td>
                    <td className="py-3 px-3 font-mono-tabular">{row.scheduledStart}</td>
                    <td className="py-3 px-3 font-mono-tabular">
                      {row.actualCheckIn ?? '—'}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <StatusBadge label={row.status} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeRoute === 'occurrences') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Digital Occurrence Book
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time patrol observations, visitor checks, and site handovers
          </p>
        </div>
        <div className="space-y-3">
          {occurrences.map((occ) => (
            <div key={occ.id} className={cardCls}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#10A878]">{occ.category}</p>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {occ.description}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {occ.guardName} · {occ.locationName} · {occ.createdAt}
                  </p>
                </div>
                <StatusBadge label={occ.status} compact />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeRoute === 'incidents') {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Incident Reports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitor, escalate, and resolve site security incidents
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`${cardCls} flex flex-wrap items-center justify-between gap-4`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={inc.severity} compact />
                  <StatusBadge label={inc.status} compact />
                  <span className="text-xs text-slate-400">{inc.reportedAt}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                  {inc.type} — {inc.locationName}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {inc.description}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reported by {inc.guardName}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(inc)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#24395D] text-xs font-semibold hover:border-[#10A878]"
                >
                  Details
                </button>
                {inc.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => void onUpdateIncidentStatus(inc.id, 'Resolved')}
                    className="px-3 py-1.5 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Modal
          open={selectedIncident !== null}
          onClose={() => setSelectedIncident(null)}
          title={selectedIncident ? `${selectedIncident.type} · ${selectedIncident.locationName}` : ''}
          subtitle={selectedIncident?.reportedAt}
        >
          {selectedIncident && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <StatusBadge label={selectedIncident.severity} />
                <StatusBadge label={selectedIncident.status} />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {selectedIncident.description}
              </p>
              {selectedIncident.evidenceUrl && (
                <div>
                  <p className="font-semibold text-slate-500 mb-1.5">Attached Evidence</p>
                  <img
                    src={selectedIncident.evidenceUrl}
                    alt="Incident site evidence"
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover rounded-xl border border-slate-200 dark:border-[#1E2E4A]"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                {selectedIncident.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await onUpdateIncidentStatus(selectedIncident.id, 'Resolved');
                      setSelectedIncident(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
                  >
                    Resolve Incident
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  if (
    activeRoute === 'shift-reports' ||
    activeRoute === 'report-reviews' ||
    activeRoute === 'owner-verification'
  ) {
    const titleMap: Record<string, string> = {
      'shift-reports': 'Shift Reports Archive',
      'report-reviews': 'Supervisor Report Reviews',
      'owner-verification': 'Owner Final Verification',
    };
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {titleMap[activeRoute]}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit supervisor-reviewed shift reports and apply management sign-off
          </p>
        </div>

        <div className="space-y-3">
          {shiftReports.map((rep) => (
            <div
              key={rep.id}
              className={`${cardCls} flex flex-wrap items-center justify-between gap-4`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-tabular text-xs font-bold text-slate-400">
                    {rep.id.toUpperCase()}
                  </span>
                  <StatusBadge label={rep.status} compact />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                  {rep.locationName} — {rep.shiftType} Shift ({rep.shiftDate})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Guard: {rep.guardName} · Supervisor: {rep.supervisorName} ·{' '}
                  {rep.occurrencesCount} occurrences · {rep.incidentsCount} incidents
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                  {rep.finalSummary}
                </p>
              </div>
              {rep.status !== 'Verified by Owner' && (
                <button
                  type="button"
                  onClick={() => void onVerifyReport(rep.id)}
                  className="px-4 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Verify as Owner</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeRoute === 'announcements') {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Company Announcements
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Broadcast operational directives to supervisors and field guards
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAnnounceModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#10A878] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>New Announcement</span>
          </button>
        </div>

        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className={cardCls}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      label={ann.priority}
                      tone={ann.priority === 'Urgent' ? 'red' : 'blue'}
                      compact
                    />
                    <span className="text-xs text-slate-400">
                      {ann.audience} · {ann.createdAt}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {ann.body}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">Posted by {ann.author}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Modal
          open={announceModalOpen}
          onClose={() => setAnnounceModalOpen(false)}
          title="Broadcast Announcement"
        >
          <form
            className="space-y-3.5"
            onSubmit={async (e) => {
              e.preventDefault();
              await onCreateAnnouncement({
                title: annTitle,
                body: annBody,
                audience: annAudience,
                priority: annPriority,
              });
              setAnnTitle('');
              setAnnBody('');
              setAnnounceModalOpen(false);
            }}
          >
            <div>
              <label className="block text-xs font-semibold mb-1">Headline</label>
              <input
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className={`${inputCls} w-full`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Audience</label>
                <select
                  value={annAudience}
                  onChange={(e) =>
                    setAnnAudience(
                      e.target.value as 'All Personnel' | 'Supervisors Only' | 'Field Guards',
                    )
                  }
                  className={`${inputCls} w-full`}
                >
                  <option value="All Personnel">All Personnel</option>
                  <option value="Supervisors Only">Supervisors Only</option>
                  <option value="Field Guards">Field Guards</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Priority</label>
                <select
                  value={annPriority}
                  onChange={(e) =>
                    setAnnPriority(e.target.value as 'Standard' | 'Urgent')
                  }
                  className={`${inputCls} w-full`}
                >
                  <option value="Standard">Standard</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Directive Message</label>
              <textarea
                required
                rows={3}
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                className={`${inputCls} w-full`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAnnounceModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
              >
                Publish
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  if (activeRoute === 'notifications') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Operational Notifications
        </h2>
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`${cardCls} flex items-center justify-between gap-4`}
            >
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {n.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {n.message} · {n.timeAgo}
                </p>
              </div>
              {!n.read ? (
                <button
                  type="button"
                  onClick={() => onMarkNotificationRead(n.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#10A878]/15 text-[#10A878] text-xs font-semibold"
                >
                  Mark Read
                </button>
              ) : (
                <StatusBadge label="Read" tone="slate" compact />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeRoute === 'analytics' || activeRoute === 'reports') {
    const locationChartData = locations.slice(0, 5).map((l) => ({
      name: l.name.split(' ')[0],
      attendance: l.attendanceRate,
      onDuty: l.onDutyCount,
    }));
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeRoute === 'analytics' ? 'Operational Analytics' : 'Compliance Reports'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Site attendance, patrol volume, and exportable incident summaries
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onExportCsv('acme-incidents-report.csv', incidents as unknown as Array<Record<string, unknown>>)
            }
            className="px-3.5 py-2 rounded-lg bg-[#10A878] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Incidents CSV</span>
          </button>
        </div>

        <div className={cardCls}>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Attendance Rate by Top Security Locations (%)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2E4A" opacity={0.35} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10213D',
                    borderColor: '#1E2E4A',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="attendance" fill="#10A878" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  if (activeRoute === 'billing') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Subscription & Billing
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acme Security Ltd · Enterprise Plan (GH₵1,450 / month)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cardCls}>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CreditCard className="w-4 h-4 text-[#10A878]" />
              <span>Current Plan</span>
            </div>
            <p className="text-xl font-bold mt-2">Enterprise SaaS</p>
            <p className="text-xs text-[#10A878] mt-1 font-semibold">Active · Auto-renew enabled</p>
          </div>
          <div className={cardCls}>
            <span className="text-xs text-slate-400">Licensed Guard Seats</span>
            <p className="text-xl font-bold tabular-nums mt-2">254 / 300</p>
            <p className="text-xs text-slate-500 mt-1">46 seats available</p>
          </div>
          <div className={cardCls}>
            <span className="text-xs text-slate-400">SMS Alert Credits</span>
            <p className="text-xl font-bold tabular-nums mt-2">3,420 / 10,000</p>
            <p className="text-xs text-slate-500 mt-1">Resets Dec 1, 2026</p>
          </div>
        </div>

        <div className={cardCls}>
          <h3 className="text-sm font-bold mb-3">Billing History</h3>
          <div className="space-y-2.5">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2.5 border-b last:border-b-0 border-slate-100 dark:border-[#1D2D4A] text-xs"
              >
                <div>
                  <p className="font-bold font-mono-tabular">{inv.id}</p>
                  <p className="text-slate-500">{inv.period} · {inv.planName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-nums">GH₵{inv.amount.toLocaleString()}</span>
                  <StatusBadge label={inv.status} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Settings View
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Company Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure Acme Security Ltd operational policies and alert thresholds
        </p>
      </div>
      <div className={cardCls}>
        <form
          className="space-y-4 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            setSettingsSaved(true);
            window.setTimeout(() => setSettingsSaved(false), 3000);
          }}
        >
          <div>
            <label className="block font-semibold mb-1">Registered Company Name</label>
            <input
              defaultValue="Acme Security Ltd"
              className={`${inputCls} w-full`}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              GPS Stale Threshold (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={staleGpsMinutes}
              onChange={(e) => setStaleGpsMinutes(e.target.value)}
              className={`${inputCls} w-40`}
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={companyEmailAlerts}
              onChange={(e) => setCompanyEmailAlerts(e.target.checked)}
              className="rounded accent-[#10A878]"
            />
            <span className="font-medium">
              Notify management immediately on Critical incident submissions
            </span>
          </label>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#10A878] text-white font-semibold"
            >
              Save Settings
            </button>
            {settingsSaved && (
              <span className="text-[#10A878] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
