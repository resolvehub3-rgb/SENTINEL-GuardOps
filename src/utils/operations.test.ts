import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAdminMetrics,
  computeBillingTotals,
  computeCompanyMetrics,
  computeSupervisorMetrics,
  filterOnDutyGuardsForLiveMap,
  formatShiftDuration,
  shouldDisplayMaintenanceModal,
  summarizeClientStationCoverage,
  validateClientOnboardingInput,
  validateCompanyRegistrationInput,
  validateContactFormInput,
  validateIncidentInput,
  validateMaintenanceConfigInput,
  validateOccurrenceInput,
  validateReportReviewAction,
  validateShiftCloseInput,
  validateStationAssignmentInput,
} from './operations.ts';
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
} from '../types/guardops.ts';

const sampleGuards: GuardRecord[] = [
  {
    id: 'g1',
    companyId: 'c1',
    name: 'David Kumar',
    employeeId: 'GRD-1042',
    avatar: '',
    phone: '555-0101',
    status: 'On Duty',
    trackingState: 'On Duty',
    locationId: 'loc1',
    locationName: 'Riverside Mall',
    postName: 'Main Atrium Gate',
    supervisorId: 'sup1',
    supervisorName: 'Marcus Cole',
    shiftType: 'Day',
    shiftWindow: '06:00 AM - 02:00 PM',
    shiftStartTime: '06:00 AM',
    lastActivity: 'Patrol scan',
    lastGpsUpdate: '1 min ago',
    gpsAccuracyMeters: 6,
    mapX: 30,
    mapY: 40,
    attendanceScore: 98,
  },
  {
    id: 'g2',
    companyId: 'c1',
    name: 'Rahul Mehta',
    employeeId: 'GRD-1048',
    avatar: '',
    phone: '555-0102',
    status: 'Off Duty',
    trackingState: 'Location Unavailable',
    locationId: 'loc2',
    locationName: 'Metro Tower',
    postName: 'Lobby Desk',
    supervisorId: 'sup1',
    supervisorName: 'Marcus Cole',
    shiftType: 'Night',
    shiftWindow: '10:00 PM - 06:00 AM',
    shiftStartTime: null,
    lastActivity: 'Shift ended',
    lastGpsUpdate: '4 hrs ago',
    gpsAccuracyMeters: null,
    mapX: 60,
    mapY: 50,
    attendanceScore: 95,
  },
];

const sampleLocations: LocationRecord[] = [
  {
    id: 'loc1',
    companyId: 'c1',
    clientId: 'cl1',
    clientName: 'Riverside Properties',
    name: 'Riverside Mall',
    postCode: 'POST-RM1',
    address: '120 River Ave',
    zone: 'North District',
    supervisorId: 'sup1',
    supervisorName: 'Marcus Cole',
    assignedGuardsCount: 12,
    onDutyCount: 11,
    attendanceRate: 98,
    sharePercent: 28,
    status: 'Active',
    mapX: 30,
    mapY: 40,
  },
  {
    id: 'loc2',
    companyId: 'c1',
    clientId: 'cl2',
    clientName: 'Metro Group',
    name: 'Metro Tower',
    postCode: 'POST-MT2',
    address: '450 Center St',
    zone: 'Downtown',
    supervisorId: 'sup1',
    supervisorName: 'Marcus Cole',
    assignedGuardsCount: 10,
    onDutyCount: 9,
    attendanceRate: 94,
    sharePercent: 24,
    status: 'Active',
    mapX: 60,
    mapY: 50,
  },
];

const sampleIncidents: IncidentRecord[] = [
  {
    id: 'inc1',
    companyId: 'c1',
    guardId: 'g1',
    guardName: 'David Kumar',
    locationId: 'loc1',
    locationName: 'Riverside Mall',
    supervisorId: 'sup1',
    type: 'Unauthorized Entry',
    severity: 'High',
    description: 'Attempted tailgating at loading bay.',
    reportedAt: '10:15 AM',
    status: 'Open',
  },
  {
    id: 'inc2',
    companyId: 'c1',
    guardId: 'g1',
    guardName: 'David Kumar',
    locationId: 'loc2',
    locationName: 'Metro Tower',
    supervisorId: 'sup1',
    type: 'Equipment',
    severity: 'Low',
    description: 'Gate barrier sensor recalibrated.',
    reportedAt: '08:20 AM',
    status: 'Resolved',
  },
];

test('filterOnDutyGuardsForLiveMap strictly excludes off-duty guards', () => {
  const result = filterOnDutyGuardsForLiveMap(sampleGuards, '', 'all', 'all');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'g1');
  assert.equal(result[0].status, 'On Duty');

  const searched = filterOnDutyGuardsForLiveMap(sampleGuards, 'rahul', 'all', 'all');
  assert.equal(searched.length, 0);
});

test('computeCompanyMetrics computes live counts and attendance rate', () => {
  const metrics = computeCompanyMetrics(sampleGuards, sampleLocations, sampleIncidents, 247);
  assert.equal(metrics.guardsOnDuty, 248);
  assert.equal(metrics.activeLocations, 2);
  assert.equal(metrics.openIncidents, 1);
  assert.equal(metrics.attendanceRate, 96);
});

test('computeSupervisorMetrics scopes strictly to supervisorId', () => {
  const reports: ShiftReportRecord[] = [
    {
      id: 'sr1',
      companyId: 'c1',
      guardId: 'g1',
      guardName: 'David Kumar',
      guardAvatar: '',
      employeeId: 'GRD-1042',
      locationId: 'loc1',
      locationName: 'Riverside Mall',
      supervisorId: 'sup1',
      supervisorName: 'Marcus Cole',
      shiftType: 'Day',
      shiftDate: '2026-11-19',
      shiftStart: '06:00 AM',
      shiftEnd: '02:00 PM',
      submittedAt: '02:05 PM',
      attendanceStatus: 'On Time',
      occurrencesCount: 4,
      incidentsCount: 1,
      handoverNotes: 'Keys handed to evening lead.',
      finalSummary: 'Normal perimeter operations.',
      evidenceUrls: [],
      status: 'Awaiting Review',
    },
  ];

  const metrics = computeSupervisorMetrics(sampleGuards, sampleIncidents, reports, 'sup1', 0);
  assert.equal(metrics.assignedGuards, 2);
  assert.equal(metrics.guardsOnDuty, 1);
  assert.equal(metrics.incidentsNeedingAttention, 1);
  assert.equal(metrics.reportsAwaitingReview, 1);
});

test('computeAdminMetrics aggregates companies, subscriptions, and uptime', () => {
  const companies: CompanyAccountRecord[] = [
    {
      id: 'c1',
      name: 'Acme Security Ltd',
      contactPerson: 'Elena Vance',
      contactEmail: 'ops@acmesec.com',
      registeredAt: '2025-01-12',
      guardsCount: 260,
      locationsCount: 42,
      approvalStatus: 'Approved',
      subscriptionStatus: 'Active',
      planName: 'Enterprise',
      monthlyFee: 1450,
      smsCreditsUsed: 1200,
      smsCreditsLimit: 5000,
    },
    {
      id: 'c2',
      name: 'Metro Security Ltd',
      contactPerson: 'Samir Patel',
      contactEmail: 'admin@metrosec.com',
      registeredAt: '2026-11-18',
      guardsCount: 42,
      locationsCount: 6,
      approvalStatus: 'Pending',
      subscriptionStatus: 'Trial',
      planName: 'Growth',
      monthlyFee: 450,
      smsCreditsUsed: 180,
      smsCreditsLimit: 1000,
    },
  ];
  const services: SystemServiceHealthRecord[] = [
    { id: 's1', name: 'Authentication', status: 'Operational', uptimePercent: 100, latencyMs: 28, note: 'Healthy' },
    { id: 's2', name: 'Database', status: 'Operational', uptimePercent: 99.8, latencyMs: 14, note: 'Healthy' },
  ];

  const metrics = computeAdminMetrics(companies, services);
  assert.equal(metrics.registeredCompanies, 2);
  assert.equal(metrics.totalGuards, 302);
  assert.equal(metrics.activeSubscriptions, 1);
  assert.equal(metrics.trialSubscriptions, 1);
  assert.equal(metrics.pendingOnboarding, 1);
  assert.equal(metrics.monthlyRevenue, 1450);
  assert.equal(metrics.platformAvailability, 99.9);
});

test('validateReportReviewAction enforces mandatory reason on return', () => {
  assert.equal(validateReportReviewAction('return', '').valid, false);
  assert.equal(validateReportReviewAction('return', 'ok').valid, false);
  assert.equal(validateReportReviewAction('return', 'Missing gate patrol timestamp').valid, true);
  assert.equal(validateReportReviewAction('finalize').valid, true);
});

test('form validators reject incomplete occurrence, incident, and shift close submissions', () => {
  assert.equal(validateOccurrenceInput({ category: 'Routine Patrol', description: 'hi' }).valid, false);
  assert.equal(validateOccurrenceInput({ category: 'Routine Patrol', description: 'North gate checked and locked' }).valid, true);

  assert.equal(validateIncidentInput({ type: 'Fire', severity: 'Critical', locationName: 'Gate A', description: 'short' }).valid, false);
  assert.equal(validateIncidentInput({ type: 'Fire', severity: 'Critical', locationName: 'Gate A', description: 'Smoke alarm triggered in east stairwell' }).valid, true);

  assert.equal(validateShiftCloseInput({ handoverNotes: 'Keys left', finalSummary: 'All clear for shift', reviewedConfirmed: false }).valid, false);
  assert.equal(validateShiftCloseInput({ handoverNotes: 'Keys handed to relief', finalSummary: 'All perimeter checkpoints verified.', reviewedConfirmed: true }).valid, true);
});

test('formatShiftDuration formats elapsed HH:MM:SS cleanly', () => {
  const start = '2026-11-19T06:00:00.000Z';
  const now = new Date('2026-11-19T08:15:09.000Z').getTime();
  assert.equal(formatShiftDuration(start, now), '02:15:09');
  assert.equal(formatShiftDuration(null, now), '00:00:00');
});

test('validateCompanyRegistrationInput validates required company onboarding fields', () => {
  assert.equal(
    validateCompanyRegistrationInput({
      companyName: 'A',
      contactName: 'Kwame Mensah',
      email: 'ops@shieldgh.com',
      password: 'Password123',
    }).valid,
    false,
  );
  assert.equal(
    validateCompanyRegistrationInput({
      companyName: 'Accra Shield Security Ltd',
      contactName: 'Kwame Mensah',
      email: 'bad-email',
      password: 'Password123',
    }).valid,
    false,
  );
  assert.equal(
    validateCompanyRegistrationInput({
      companyName: 'Accra Shield Security Ltd',
      contactName: 'Kwame Mensah',
      email: 'ops@shieldgh.com',
      password: 'short',
    }).valid,
    false,
  );
  assert.equal(
    validateCompanyRegistrationInput({
      companyName: 'Accra Shield Security Ltd',
      contactName: 'Kwame Mensah',
      email: 'ops@shieldgh.com',
      password: 'StrongPassword2026',
    }).valid,
    true,
  );
});

test('validateContactFormInput validates inquiry fields cleanly', () => {
  assert.equal(
    validateContactFormInput({
      fullName: 'Ama Boateng',
      companyName: 'Gold Coast Security',
      email: 'ama@gcsecurity.com',
      subject: 'Hi',
      message: 'Short',
    }).valid,
    false,
  );
  assert.equal(
    validateContactFormInput({
      fullName: 'Ama Boateng',
      companyName: 'Gold Coast Security',
      email: 'ama@gcsecurity.com',
      subject: 'Platform onboarding question',
      message: 'We manage 85 guards across Accra and Kumasi and want a walkthrough.',
    }).valid,
    true,
  );
});

test('shouldDisplayMaintenanceModal targets affected dashboards and excludes admin', () => {
  const cfg: MaintenanceConfig = {
    enabled: true,
    title: 'System Upgrade',
    message: 'Database maintenance in progress.',
    severity: 'Planned',
    estimatedDuration: '30 minutes',
    scheduledWindow: 'Immediate',
    affectedScopes: {
      companyDashboard: true,
      supervisorDashboard: true,
      guardDashboard: true,
    },
    allowReadOnlyAccess: false,
    notifyUsersBanner: true,
    contactNote: 'Contact dispatch.',
    updatedAt: 'Now',
    updatedBy: 'Samuel Mensah',
  };

  assert.equal(shouldDisplayMaintenanceModal(cfg, 'company'), true);
  assert.equal(shouldDisplayMaintenanceModal(cfg, 'supervisor'), true);
  assert.equal(shouldDisplayMaintenanceModal(cfg, 'guard'), true);
  assert.equal(shouldDisplayMaintenanceModal(cfg, 'admin'), false);

  const disabled = { ...cfg, enabled: false };
  assert.equal(shouldDisplayMaintenanceModal(disabled, 'company'), false);

  const guardExcluded = {
    ...cfg,
    affectedScopes: { ...cfg.affectedScopes, guardDashboard: false },
  };
  assert.equal(shouldDisplayMaintenanceModal(guardExcluded, 'guard'), false);
  assert.equal(shouldDisplayMaintenanceModal(guardExcluded, 'company'), true);
});

test('validateMaintenanceConfigInput and computeBillingTotals work accurately', () => {
  assert.equal(
    validateMaintenanceConfigInput({ title: 'OK', message: 'Maintenance underway.', estimatedDuration: '15m' }).valid,
    false,
  );
  assert.equal(
    validateMaintenanceConfigInput({
      title: 'Planned Platform Maintenance',
      message: 'Core services are undergoing a scheduled database upgrade.',
      estimatedDuration: '30 minutes',
    }).valid,
    true,
  );

  const invoices: BillingInvoiceRecord[] = [
    { id: '1', companyId: 'c1', companyName: 'Acme', planName: 'Enterprise', amount: 1450, period: 'Nov 2026', status: 'Paid', issuedAt: '2026-11-01' },
    { id: '2', companyId: 'c2', companyName: 'Safe', planName: 'Growth', amount: 650, period: 'Nov 2026', status: 'Pending', issuedAt: '2026-11-02' },
    { id: '3', companyId: 'c3', companyName: 'Vanguard', planName: 'Growth', amount: 650, period: 'Nov 2026', status: 'Overdue', issuedAt: '2026-11-01' },
  ];
  const totals = computeBillingTotals(invoices);
  assert.equal(totals.totalBilled, 2750);
  assert.equal(totals.collectedAmount, 1450);
  assert.equal(totals.pendingAmount, 650);
  assert.equal(totals.overdueAmount, 650);
  assert.equal(totals.paidCount, 1);
  assert.equal(totals.pendingCount, 1);
  assert.equal(totals.overdueCount, 1);
});

test('validateClientOnboardingInput and validateStationAssignmentInput validate school compound workflow', () => {
  assert.equal(
    validateClientOnboardingInput({
      clientName: 'Greenfield Academy',
      contactName: 'Principal Mensah',
      contactEmail: 'invalid',
      contactPhone: '+233 24 555 0190',
      stationName: 'Greenfield School Compound',
      stationAddress: 'Plot 14 Liberation Road',
      monthlyPrice: 2400,
    }).valid,
    false,
  );

  assert.equal(
    validateClientOnboardingInput({
      clientName: 'Greenfield Academy',
      contactName: 'Principal Mensah',
      contactEmail: 'principal@greenfield.edu',
      contactPhone: '+233 24 555 0190',
      stationName: 'Greenfield School Compound',
      stationAddress: 'Plot 14 Liberation Road',
      monthlyPrice: 0,
    }).valid,
    false,
  );

  assert.equal(
    validateClientOnboardingInput({
      clientName: 'Greenfield Academy',
      contactName: 'Principal Mensah',
      contactEmail: 'principal@greenfield.edu',
      contactPhone: '+233 24 555 0190',
      stationName: 'Greenfield School Compound',
      stationAddress: 'Plot 14 Liberation Road',
      monthlyPrice: 2400,
    }).valid,
    true,
  );

  assert.equal(
    validateStationAssignmentInput({
      locationId: 'loc-school',
      supervisorId: '',
      guardMode: 'existing',
      guardId: 'g1',
      shiftType: 'Day',
    }).valid,
    false,
  );

  assert.equal(
    validateStationAssignmentInput({
      locationId: 'loc-school',
      supervisorId: 'usr-sup-1',
      guardMode: 'new',
      newGuardName: 'A',
      shiftType: 'Day',
    }).valid,
    false,
  );

  assert.equal(
    validateStationAssignmentInput({
      locationId: 'loc-school',
      supervisorId: 'usr-sup-1',
      guardMode: 'existing',
      guardId: 'g1',
      shiftType: 'Day',
    }).valid,
    true,
  );

  const client: ClientRecord = {
    id: 'cl1',
    companyId: 'c1',
    name: 'Riverside Properties',
    industry: 'Retail',
    contactName: 'Hannah',
    contactEmail: 'h@river.com',
    contactPhone: '555-0192',
    activeSites: 1,
    contractValueMonthly: 18500,
    status: 'Active',
  };
  const coverage = summarizeClientStationCoverage(client, sampleLocations, sampleGuards);
  assert.equal(coverage.sites.length, 1);
  assert.equal(coverage.assignedGuards.length, 1);
  assert.equal(coverage.supervisorsAssigned[0], 'Marcus Cole');
  assert.equal(coverage.unassignedSitesCount, 0);
});



