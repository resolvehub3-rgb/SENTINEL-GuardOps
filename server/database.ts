import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  ActivityEvent,
  AnnouncementRecord,
  AttendanceRecord,
  AuditLogRecord,
  AuthUser,
  BillingInvoiceRecord,
  ClientRecord,
  CompanyAccountRecord,
  DutyScheduleRecord,
  GuardRecord,
  GuardShiftHistoryItem,
  IncidentRecord,
  LocationRecord,
  MaintenanceConfig,
  MaintenanceHistoryRecord,
  NotificationRecord,
  OccurrenceRecord,
  PlatformUserRecord,
  ShiftReportRecord,
  SupervisorRecord,
  SupportTicketRecord,
  SystemServiceHealthRecord,
  UserRole,
} from '../src/types/guardops.ts';

export interface UserCredentialRecord extends AuthUser {
  passwordHash: string;
}

export interface GuardOpsDatabase {
  users: UserCredentialRecord[];
  clients: ClientRecord[];
  locations: LocationRecord[];
  supervisors: SupervisorRecord[];
  guards: GuardRecord[];
  schedules: DutyScheduleRecord[];
  attendance: AttendanceRecord[];
  occurrences: OccurrenceRecord[];
  incidents: IncidentRecord[];
  shiftReports: ShiftReportRecord[];
  activities: ActivityEvent[];
  announcements: AnnouncementRecord[];
  notifications: NotificationRecord[];
  companies: CompanyAccountRecord[];
  platformUsers: PlatformUserRecord[];
  invoices: BillingInvoiceRecord[];
  supportTickets: SupportTicketRecord[];
  auditLogs: AuditLogRecord[];
  systemHealth: SystemServiceHealthRecord[];
  guardShiftHistory: GuardShiftHistoryItem[];
  incidentSeries: {
    today: Array<{ label: string; current: number; previous: number }>;
    '7d': Array<{ label: string; current: number; previous: number }>;
    '30d': Array<{ label: string; current: number; previous: number }>;
  };
  billingMonthlySeries: Array<{ month: string; revenue: number }>;
  guardActiveShiftIso: Record<string, string | null>;
  companyFleetOnDutyOffset: number;
  supervisorFleetOffset: number;
  maintenance: MaintenanceConfig;
  maintenanceHistory: MaintenanceHistoryRecord[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'guardops-db.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createInitialDatabase(): GuardOpsDatabase {
  const users: UserCredentialRecord[] = [
    {
      id: 'usr-company-1',
      name: 'Company Owner',
      email: 'owner@sentinelguardops.com',
      passwordHash: hashPassword('GuardOps!2026'),
      role: 'company',
      companyId: 'comp-default',
      companyName: 'Company Workspace',
      initials: 'CO',
      title: 'Company Owner',
    },
    {
      id: 'usr-sup-1',
      name: 'Operations Supervisor',
      email: 'supervisor@sentinelguardops.com',
      passwordHash: hashPassword('GuardOps!2026'),
      role: 'supervisor',
      companyId: 'comp-default',
      companyName: 'Company Workspace',
      employeeId: 'SUP-001',
      initials: 'SP',
      title: 'Field Supervisor',
    },
    {
      id: 'usr-guard-1',
      name: 'Security Guard',
      email: 'guard@sentinelguardops.com',
      passwordHash: hashPassword('GuardOps!2026'),
      role: 'guard',
      companyId: 'comp-default',
      companyName: 'Company Workspace',
      employeeId: 'GRD-001',
      initials: 'SG',
      title: 'Security Officer',
    },
    {
      id: 'usr-admin-1',
      name: 'Platform Super Admin',
      email: 'admin@samleytechnologies.com',
      passwordHash: hashPassword('GuardOps!2026'),
      role: 'admin',
      companyName: 'Samley Technologies',
      initials: 'SA',
      title: 'Platform Super Admin',
    },
  ];

  return {
    users,
    clients: [],
    locations: [],
    supervisors: [],
    guards: [],
    schedules: [],
    attendance: [],
    occurrences: [],
    incidents: [],
    shiftReports: [],
    activities: [],
    announcements: [],
    notifications: [],
    companies: [],
    platformUsers: [],
    invoices: [],
    supportTickets: [],
    auditLogs: [],
    systemHealth: [],
    guardShiftHistory: [],
    incidentSeries: {
      today: [],
      '7d': [],
      '30d': [],
    },
    billingMonthlySeries: [],
    guardActiveShiftIso: {},
    companyFleetOnDutyOffset: 0,
    supervisorFleetOffset: 0,
    maintenance: {
      enabled: false,
      title: 'System Under Scheduled Maintenance',
      message:
        'Sentinel GuardOps is undergoing scheduled maintenance to optimize operational services and database performance. Normal dashboard access will resume shortly.',
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
      contactNote:
        'For urgent field escalations during maintenance, contact your regional dispatch lead.',
      updatedAt: 'Never',
      updatedBy: 'System Default',
    },
    maintenanceHistory: [],
  };
}

class DatabaseStore {
  private data: GuardOpsDatabase;

  constructor() {
    this.data = this.load();
  }

  private load(): GuardOpsDatabase {
    const fallback = createInitialDatabase();
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<GuardOpsDatabase>;
        return {
          ...fallback,
          ...parsed,
          maintenance: parsed.maintenance
            ? {
                ...fallback.maintenance,
                ...parsed.maintenance,
                affectedScopes: {
                  ...fallback.maintenance.affectedScopes,
                  ...(parsed.maintenance.affectedScopes ?? {}),
                },
              }
            : fallback.maintenance,
          maintenanceHistory: parsed.maintenanceHistory ?? fallback.maintenanceHistory,
        };
      }
    } catch (err) {
      console.error('Failed to load GuardOps database, initializing fresh store:', err);
    }
    this.save(fallback);
    return fallback;
  }

  private save(snapshot: GuardOpsDatabase): void {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  public read(): GuardOpsDatabase {
    return this.data;
  }

  public mutate<T>(fn: (db: GuardOpsDatabase) => T): T {
    const result = fn(this.data);
    this.save(this.data);
    return result;
  }

  public sanitizeUser(user: UserCredentialRecord): AuthUser {
    const { passwordHash: _ignored, ...safe } = user;
    return safe;
  }

  public findUserByEmail(email: string): UserCredentialRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findUserByRole(role: UserRole): UserCredentialRecord | undefined {
    return this.data.users.find((u) => u.role === role);
  }

  public findUserById(id: string): UserCredentialRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }
}

export const dbStore = new DatabaseStore();
