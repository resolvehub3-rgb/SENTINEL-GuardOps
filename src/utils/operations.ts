import type {
  BillingInvoiceRecord,
  ClientRecord,
  CompanyAccountRecord,
  GuardRecord,
  IncidentRecord,
  LocationRecord,
  MaintenanceConfig,
  ShiftReportRecord,
  SystemServiceHealthRecord,
  UserRole,
} from '../types/guardops.ts';

export interface CompanyKpiSummary {
  guardsOnDuty: number;
  totalGuards: number;
  activeLocations: number;
  openIncidents: number;
  attendanceRate: number;
}

export interface SupervisorKpiSummary {
  assignedGuards: number;
  guardsOnDuty: number;
  incidentsNeedingAttention: number;
  reportsAwaitingReview: number;
  avgResponseMinutes: number;
}

export interface AdminKpiSummary {
  registeredCompanies: number;
  totalGuards: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  pendingOnboarding: number;
  monthlyRevenue: number;
  platformAvailability: number;
}

/**
 * Computes company command-centre KPI metrics directly from database records.
 * Baseline fleet counts reflect operational locations/roster capacity plus live active check-ins.
 */
export function computeCompanyMetrics(
  guards: GuardRecord[],
  locations: LocationRecord[],
  incidents: IncidentRecord[],
  fleetBaseOnDutyOffset = 0,
): CompanyKpiSummary {
  const trackedOnDuty = guards.filter((g) => g.status === 'On Duty').length;
  const guardsOnDuty = trackedOnDuty + fleetBaseOnDutyOffset;
  const activeLocations = locations.filter((l) => l.status !== 'Maintenance').length;
  const openIncidents = incidents.filter((i) => i.status !== 'Resolved').length;

  const avgAttendance =
    locations.length > 0
      ? Math.round(
          locations.reduce((sum, loc) => sum + loc.attendanceRate, 0) / locations.length,
        )
      : 0;

  return {
    guardsOnDuty,
    totalGuards: guards.length + fleetBaseOnDutyOffset,
    activeLocations,
    openIncidents,
    attendanceRate: avgAttendance,
  };
}

export function computeSupervisorMetrics(
  guards: GuardRecord[],
  incidents: IncidentRecord[],
  reports: ShiftReportRecord[],
  supervisorId: string,
  fleetOffset = 0,
): SupervisorKpiSummary {
  const myGuards = guards.filter((g) => g.supervisorId === supervisorId);
  const myOnDuty = myGuards.filter((g) => g.status === 'On Duty').length;
  const openSupervisorIncidents = incidents.filter(
    (i) => i.supervisorId === supervisorId && i.status !== 'Resolved',
  ).length;
  const awaitingReview = reports.filter(
    (r) => r.supervisorId === supervisorId && r.status === 'Awaiting Review',
  ).length;

  return {
    assignedGuards: myGuards.length + fleetOffset,
    guardsOnDuty: myOnDuty + fleetOffset,
    incidentsNeedingAttention: openSupervisorIncidents,
    reportsAwaitingReview: awaitingReview,
    avgResponseMinutes: 2.8,
  };
}

export function computeAdminMetrics(
  companies: CompanyAccountRecord[],
  services: SystemServiceHealthRecord[],
): AdminKpiSummary {
  const registeredCompanies = companies.length;
  const totalGuards = companies.reduce((sum, c) => sum + c.guardsCount, 0);
  const activeSubscriptions = companies.filter((c) => c.subscriptionStatus === 'Active').length;
  const trialSubscriptions = companies.filter((c) => c.subscriptionStatus === 'Trial').length;
  const expiredSubscriptions = companies.filter((c) => c.subscriptionStatus === 'Expired').length;
  const pendingOnboarding = companies.filter(
    (c) => c.approvalStatus === 'Pending' || c.approvalStatus === 'In Review',
  ).length;
  const monthlyRevenue = companies
    .filter((c) => c.subscriptionStatus === 'Active')
    .reduce((sum, c) => sum + c.monthlyFee, 0);

  const platformAvailability =
    services.length > 0
      ? Number(
          (
            services.reduce((sum, s) => sum + s.uptimePercent, 0) / services.length
          ).toFixed(1),
        )
      : 100;

  return {
    registeredCompanies,
    totalGuards,
    activeSubscriptions,
    trialSubscriptions,
    expiredSubscriptions,
    pendingOnboarding,
    monthlyRevenue,
    platformAvailability,
  };
}

/**
 * Live Map strictly shows ONLY guards who are currently On Duty.
 * Off-duty, on-break, or pending guards must never appear as active tracking markers.
 */
export function filterOnDutyGuardsForLiveMap(
  guards: GuardRecord[],
  search: string,
  locationFilter: string,
  postFilter: string,
): GuardRecord[] {
  const query = search.trim().toLowerCase();
  return guards.filter((g) => {
    if (g.status !== 'On Duty') return false;
    if (locationFilter !== 'all' && g.locationId !== locationFilter) return false;
    if (postFilter !== 'all' && g.postName !== postFilter) return false;
    if (query) {
      const hay = `${g.name} ${g.employeeId} ${g.locationName} ${g.postName}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function validateReportReviewAction(
  action: 'finalize' | 'return',
  reason?: string,
): { valid: boolean; error?: string } {
  if (action === 'return') {
    const trimmed = (reason ?? '').trim();
    if (trimmed.length < 5) {
      return {
        valid: false,
        error: 'Please enter a clear correction reason (at least 5 characters) before returning the report.',
      };
    }
  }
  return { valid: true };
}

export function validateOccurrenceInput(input: {
  category?: string;
  description?: string;
}): { valid: boolean; error?: string } {
  if (!input.category || !input.category.trim()) {
    return { valid: false, error: 'Occurrence category is required.' };
  }
  if (!input.description || input.description.trim().length < 5) {
    return { valid: false, error: 'Please describe the observation (at least 5 characters).' };
  }
  return { valid: true };
}

export function validateIncidentInput(input: {
  type?: string;
  severity?: string;
  description?: string;
  locationName?: string;
}): { valid: boolean; error?: string } {
  if (!input.type || !input.type.trim()) {
    return { valid: false, error: 'Incident type is required.' };
  }
  if (!input.severity || !['Low', 'Medium', 'High', 'Critical'].includes(input.severity)) {
    return { valid: false, error: 'Valid severity level is required.' };
  }
  if (!input.locationName || !input.locationName.trim()) {
    return { valid: false, error: 'Incident location is required.' };
  }
  if (!input.description || input.description.trim().length < 8) {
    return { valid: false, error: 'Incident description must be at least 8 characters.' };
  }
  return { valid: true };
}

export function validateShiftCloseInput(input: {
  handoverNotes?: string;
  finalSummary?: string;
  reviewedConfirmed?: boolean;
}): { valid: boolean; error?: string } {
  if (!input.reviewedConfirmed) {
    return { valid: false, error: 'Please confirm you have reviewed your final shift summary.' };
  }
  if (!input.handoverNotes || input.handoverNotes.trim().length < 4) {
    return { valid: false, error: 'Please enter handover notes for the incoming shift.' };
  }
  if (!input.finalSummary || input.finalSummary.trim().length < 8) {
    return { valid: false, error: 'Please provide a concise final shift summary.' };
  }
  return { valid: true };
}

export function formatShiftDuration(startIso: string | null, nowMs: number = Date.now()): string {
  if (!startIso) return '00:00:00';
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return '00:00:00';
  const diffSec = Math.max(0, Math.floor((nowMs - start) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}

export function validateCompanyRegistrationInput(input: {
  companyName?: string;
  contactName?: string;
  email?: string;
  password?: string;
}): { valid: boolean; error?: string } {
  if (!input.companyName || input.companyName.trim().length < 2) {
    return { valid: false, error: 'Please enter your security company name.' };
  }
  if (!input.contactName || input.contactName.trim().length < 2) {
    return { valid: false, error: 'Please enter a primary contact full name.' };
  }
  const email = (input.email ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Please enter a valid work email address.' };
  }
  if (!input.password || input.password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters.' };
  }
  return { valid: true };
}

export function validateContactFormInput(input: {
  fullName?: string;
  companyName?: string;
  email?: string;
  subject?: string;
  message?: string;
}): { valid: boolean; error?: string } {
  if (!input.fullName || input.fullName.trim().length < 2) {
    return { valid: false, error: 'Please enter your full name.' };
  }
  if (!input.companyName || input.companyName.trim().length < 2) {
    return { valid: false, error: 'Please enter your company name.' };
  }
  const email = (input.email ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (!input.subject || input.subject.trim().length < 3) {
    return { valid: false, error: 'Please enter a subject.' };
  }
  if (!input.message || input.message.trim().length < 10) {
    return { valid: false, error: 'Please enter a message of at least 10 characters.' };
  }
  return { valid: true };
}

export function shouldDisplayMaintenanceModal(
  maintenance: MaintenanceConfig | null | undefined,
  role: UserRole | undefined,
): boolean {
  if (!maintenance || !maintenance.enabled || !role) return false;
  if (role === 'admin') return false;
  if (role === 'company') return maintenance.affectedScopes.companyDashboard;
  if (role === 'supervisor') return maintenance.affectedScopes.supervisorDashboard;
  if (role === 'guard') return maintenance.affectedScopes.guardDashboard;
  return false;
}

export function validateMaintenanceConfigInput(input: {
  title?: string;
  message?: string;
  estimatedDuration?: string;
}): { valid: boolean; error?: string } {
  if (!input.title || input.title.trim().length < 3) {
    return { valid: false, error: 'Maintenance title must be at least 3 characters.' };
  }
  if (!input.message || input.message.trim().length < 10) {
    return { valid: false, error: 'Maintenance message must be at least 10 characters.' };
  }
  if (!input.estimatedDuration || !input.estimatedDuration.trim()) {
    return { valid: false, error: 'Please specify an estimated maintenance duration.' };
  }
  return { valid: true };
}

export interface BillingSummaryTotals {
  totalBilled: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export function computeBillingTotals(invoices: BillingInvoiceRecord[]): BillingSummaryTotals {
  return invoices.reduce<BillingSummaryTotals>(
    (acc, inv) => {
      acc.totalBilled += inv.amount;
      if (inv.status === 'Paid') {
        acc.collectedAmount += inv.amount;
        acc.paidCount += 1;
      } else if (inv.status === 'Pending') {
        acc.pendingAmount += inv.amount;
        acc.pendingCount += 1;
      } else if (inv.status === 'Overdue') {
        acc.overdueAmount += inv.amount;
        acc.overdueCount += 1;
      }
      return acc;
    },
    {
      totalBilled: 0,
      collectedAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    },
  );
}

export function validateClientOnboardingInput(input: {
  clientName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  stationName?: string;
  stationAddress?: string;
  monthlyPrice?: number | string;
}): { valid: boolean; error?: string } {
  if (!input.clientName || input.clientName.trim().length < 2) {
    return { valid: false, error: 'Please enter the client organization or compound name.' };
  }
  if (!input.contactName || input.contactName.trim().length < 2) {
    return { valid: false, error: 'Please enter the primary client contact person.' };
  }
  const email = (input.contactEmail ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Please enter a valid client contact email address.' };
  }
  if (!input.contactPhone || input.contactPhone.trim().length < 5) {
    return { valid: false, error: 'Please enter a valid client contact phone number.' };
  }
  if (!input.stationName || input.stationName.trim().length < 2) {
    return { valid: false, error: 'Please specify the work station or post name.' };
  }
  if (!input.stationAddress || input.stationAddress.trim().length < 4) {
    return { valid: false, error: 'Please provide the street address where guards will work.' };
  }
  const price = Number(input.monthlyPrice);
  if (!Number.isFinite(price) || price <= 0) {
    return { valid: false, error: 'Please enter a valid positive contract price.' };
  }
  return { valid: true };
}

export function validateStationAssignmentInput(input: {
  locationId?: string;
  supervisorId?: string;
  guardMode?: 'existing' | 'new';
  guardId?: string;
  newGuardName?: string;
  shiftType?: string;
}): { valid: boolean; error?: string } {
  if (!input.locationId || !input.locationId.trim()) {
    return { valid: false, error: 'Please select a client station to assign.' };
  }
  if (!input.supervisorId || !input.supervisorId.trim()) {
    return { valid: false, error: 'Please assign a supervisor to oversee this station.' };
  }
  const mode = input.guardMode ?? 'existing';
  if (mode === 'existing') {
    if (!input.guardId || !input.guardId.trim()) {
      return { valid: false, error: 'Please select a security guard for this station.' };
    }
  } else {
    if (!input.newGuardName || input.newGuardName.trim().length < 2) {
      return { valid: false, error: 'Please enter the new guard full name.' };
    }
  }
  if (!input.shiftType || !['Day', 'Evening', 'Night'].includes(input.shiftType)) {
    return { valid: false, error: 'Please select a valid shift assignment (Day, Evening, or Night).' };
  }
  return { valid: true };
}

export interface ClientStationCoverage {
  sites: LocationRecord[];
  assignedGuards: GuardRecord[];
  unassignedSitesCount: number;
  supervisorsAssigned: string[];
}

export function summarizeClientStationCoverage(
  client: ClientRecord,
  locations: LocationRecord[],
  guards: GuardRecord[],
): ClientStationCoverage {
  const sites = locations.filter((loc) => loc.clientId === client.id);
  const siteIds = new Set(sites.map((s) => s.id));
  const assignedGuards = guards.filter((g) => siteIds.has(g.locationId));
  const supervisorsAssigned = Array.from(
    new Set(
      sites
        .map((s) => s.supervisorName)
        .filter((name) => Boolean(name) && name !== 'Unassigned'),
    ),
  );
  const unassignedSitesCount = sites.filter(
    (s) => !s.supervisorId || s.supervisorName === 'Unassigned',
  ).length;

  return {
    sites,
    assignedGuards,
    unassignedSitesCount,
    supervisorsAssigned,
  };
}



