export type UserRole = 'company' | 'supervisor' | 'guard' | 'admin';

export type GuardDutyStatus =
  | 'On Duty'
  | 'Off Duty'
  | 'On Break'
  | 'Late'
  | 'Pending';

export type LocationTrackingState = 'On Duty' | 'Location Stale' | 'Location Unavailable';

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved' | 'Escalated';

export type OccurrenceCategory =
  | 'Routine Patrol'
  | 'Visitor'
  | 'Vehicle'
  | 'Suspicious Activity'
  | 'Security Check'
  | 'Handover'
  | 'Equipment'
  | 'Other';

export type ShiftReportStatus =
  | 'Awaiting Review'
  | 'Finalized'
  | 'Returned for Correction'
  | 'Verified by Owner';

export type CompanySubscriptionStatus = 'Active' | 'Trial' | 'Expired';

export type CompanyApprovalStatus = 'Approved' | 'Pending' | 'In Review' | 'Suspended';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  employeeId?: string;
  avatar?: string;
  initials: string;
  title: string;
  assignedPostId?: string;
  assignedPostName?: string;
  supervisorId?: string;
  supervisorName?: string;
}

export interface ClientRecord {
  id: string;
  companyId: string;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  activeSites: number;
  contractValueMonthly: number;
  status: 'Active' | 'Onboarding' | 'Renewing';
  billingCycle?: 'Monthly' | 'Quarterly' | 'Annual';
  serviceNotes?: string;
  contractStartDate?: string;
  createdByCompanyOwner?: boolean;
}

export interface LocationRecord {
  id: string;
  companyId: string;
  clientId: string;
  clientName: string;
  name: string;
  postCode: string;
  address: string;
  zone: string;
  supervisorId: string;
  supervisorName: string;
  assignedGuardsCount: number;
  onDutyCount: number;
  attendanceRate: number;
  sharePercent: number;
  status: 'Active' | 'Attention' | 'Maintenance';
  mapX: number; // 0-100 map coordinates
  mapY: number; // 0-100 map coordinates
  monthlyFee?: number;
  requiredGuards?: number;
  shiftCoverage?: string;
  serviceNotes?: string;
}

export interface SupervisorRecord {
  id: string;
  companyId: string;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  avatar: string;
  assignedLocations: string[];
  assignedGuardsCount: number;
  avgResponseMinutes: number;
  status: 'Active' | 'On Leave';
}

export interface GuardRecord {
  id: string;
  companyId: string;
  name: string;
  employeeId: string;
  avatar: string;
  phone: string;
  status: GuardDutyStatus;
  trackingState: LocationTrackingState;
  locationId: string;
  locationName: string;
  postName: string;
  supervisorId: string;
  supervisorName: string;
  shiftType: 'Day' | 'Evening' | 'Night';
  shiftWindow: string;
  shiftStartTime: string | null;
  lastActivity: string;
  lastGpsUpdate: string;
  gpsAccuracyMeters: number | null;
  mapX: number;
  mapY: number;
  attendanceScore: number;
}

export interface DutyScheduleRecord {
  id: string;
  companyId: string;
  locationId: string;
  locationName: string;
  supervisorId: string;
  shiftType: 'Day' | 'Evening' | 'Night';
  startTime: string;
  endTime: string;
  date: string;
  assignedGuardIds: string[];
  assignedGuardNames: string[];
  requiredGuards: number;
  status: 'Scheduled' | 'In Progress' | 'Completed';
}

export interface AttendanceRecord {
  id: string;
  companyId: string;
  guardId: string;
  guardName: string;
  employeeId: string;
  locationName: string;
  shiftDate: string;
  scheduledStart: string;
  actualCheckIn: string | null;
  checkOut: string | null;
  status: 'On Time' | 'Late' | 'Absent' | 'Active';
}

export interface OccurrenceRecord {
  id: string;
  companyId: string;
  guardId: string;
  guardName: string;
  locationId: string;
  locationName: string;
  supervisorId: string;
  shiftType: string;
  category: OccurrenceCategory;
  description: string;
  evidenceUrl?: string;
  evidenceType?: 'photo' | 'video';
  gpsLabel: string;
  createdAt: string;
  status: 'Logged' | 'Flagged' | 'Acknowledged';
}

export interface IncidentRecord {
  id: string;
  companyId: string;
  guardId: string;
  guardName: string;
  locationId: string;
  locationName: string;
  supervisorId: string;
  type: string;
  severity: IncidentSeverity;
  description: string;
  evidenceUrl?: string;
  reportedAt: string;
  status: IncidentStatus;
}

export interface ShiftReportRecord {
  id: string;
  companyId: string;
  guardId: string;
  guardName: string;
  guardAvatar: string;
  employeeId: string;
  locationId: string;
  locationName: string;
  supervisorId: string;
  supervisorName: string;
  shiftType: 'Day' | 'Evening' | 'Night';
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  submittedAt: string;
  attendanceStatus: string;
  occurrencesCount: number;
  incidentsCount: number;
  handoverNotes: string;
  finalSummary: string;
  evidenceUrls: string[];
  status: ShiftReportStatus;
  reviewReason?: string;
  reviewedAt?: string;
  verifiedAt?: string;
}

export interface ActivityEvent {
  id: string;
  companyId?: string;
  scope: 'company' | 'supervisor' | 'admin';
  type: 'checkin' | 'occurrence' | 'incident' | 'review' | 'verification' | 'assignment' | 'company' | 'billing';
  message: string;
  timeAgo: string;
  createdAt: string;
  statusLabel: string;
  tone: 'emerald' | 'blue' | 'amber' | 'red' | 'indigo';
}

export interface AnnouncementRecord {
  id: string;
  companyId: string;
  title: string;
  body: string;
  audience: 'All Personnel' | 'Supervisors Only' | 'Field Guards';
  author: string;
  createdAt: string;
  priority: 'Standard' | 'Urgent';
}

export interface NotificationRecord {
  id: string;
  roleTarget: UserRole | 'all';
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  tone: 'info' | 'warning' | 'critical' | 'success';
}

export interface CompanyAccountRecord {
  id: string;
  name: string;
  contactPerson: string;
  contactEmail: string;
  registeredAt: string;
  guardsCount: number;
  locationsCount: number;
  approvalStatus: CompanyApprovalStatus;
  subscriptionStatus: CompanySubscriptionStatus;
  planName: 'Enterprise' | 'Growth' | 'Starter';
  monthlyFee: number;
  smsCreditsUsed: number;
  smsCreditsLimit: number;
}

export interface PlatformUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName: string;
  status: 'Active' | 'Invited' | 'Suspended';
  lastLogin: string;
}

export interface BillingInvoiceRecord {
  id: string;
  companyId: string;
  companyName: string;
  planName: string;
  amount: number;
  period: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  issuedAt: string;
}

export interface SupportTicketRecord {
  id: string;
  companyName: string;
  subject: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
}

export interface SystemServiceHealthRecord {
  id: string;
  name: string;
  status: 'Operational' | 'Degraded' | 'Maintenance';
  uptimePercent: number;
  latencyMs: number;
  note: string;
}

export interface GuardShiftHistoryItem {
  id: string;
  date: string;
  postName: string;
  shiftWindow: string;
  checkIn: string;
  checkOut: string;
  occurrencesLogged: number;
  incidentsReported: number;
  reportStatus: ShiftReportStatus;
}

export interface GuardMobileState {
  guard: GuardRecord;
  isOnDuty: boolean;
  shiftStartedIso: string | null;
  capturedEvidence: {
    id: string;
    type: 'photo' | 'video';
    url: string;
    capturedAt: string;
    label: string;
  } | null;
  todayOccurrences: OccurrenceRecord[];
  todayIncidents: IncidentRecord[];
  shiftHistory: GuardShiftHistoryItem[];
}

export type MaintenanceSeverity = 'Planned' | 'Emergency' | 'Upgrade';

export interface MaintenanceConfig {
  enabled: boolean;
  title: string;
  message: string;
  severity: MaintenanceSeverity;
  estimatedDuration: string;
  scheduledWindow: string;
  affectedScopes: {
    companyDashboard: boolean;
    supervisorDashboard: boolean;
    guardDashboard: boolean;
  };
  allowReadOnlyAccess: boolean;
  notifyUsersBanner: boolean;
  contactNote: string;
  updatedAt: string;
  updatedBy: string;
}

export interface MaintenanceHistoryRecord {
  id: string;
  action: 'Enabled' | 'Disabled' | 'Updated';
  title: string;
  severity: MaintenanceSeverity;
  duration: string;
  actor: string;
  timestamp: string;
}

