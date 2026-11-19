import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { dbStore, hashPassword } from './server/database.ts';
import {
  computeAdminMetrics,
  computeCompanyMetrics,
  computeSupervisorMetrics,
  filterOnDutyGuardsForLiveMap,
  validateClientOnboardingInput,
  validateIncidentInput,
  validateMaintenanceConfigInput,
  validateOccurrenceInput,
  validateReportReviewAction,
  validateShiftCloseInput,
  validateStationAssignmentInput,
} from './src/utils/operations.ts';
import type {
  AuthUser,
  BillingInvoiceRecord,
  ClientRecord,
  GuardRecord,
  IncidentRecord,
  LocationRecord,
  MaintenanceConfig,
  OccurrenceRecord,
  ShiftReportRecord,
  UserRole,
} from './src/types/guardops.ts';

interface SessionRecord {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: number;
}

const sessions = new Map<string, SessionRecord>();
const SESSION_COOKIE = 'guardops_session';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      result[key] = val;
    }
  }
  return result;
}

function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE] ?? null;
}

function createSessionForUser(user: AuthUser, res: Response): string {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, {
    token,
    userId: user.id,
    role: user.role,
    createdAt: Date.now(),
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 12,
  });
  return token;
}

interface AuthedRequest extends Request {
  authUser?: AuthUser;
  sessionToken?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const session = sessions.get(token);
  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }
  const userRecord = dbStore.findUserById(session.userId);
  if (!userRecord) {
    res.status(401).json({ error: 'Account not found' });
    return;
  }
  req.authUser = dbStore.sanitizeUser(userRecord);
  req.sessionToken = token;
  next();
}

function requireRole(allowed: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!allowed.includes(req.authUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this operational role' });
      return;
    }
    next();
  };
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  function broadcastEvent(event: string, payload: unknown): void {
    const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ event: 'ws:connected', payload: { status: 'connected' }, timestamp: new Date().toISOString() }));
  });

  // Health Check & Platform Maintenance State
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'Sentinel GuardOps API', timestamp: new Date().toISOString() });
  });

  app.get('/api/platform/maintenance', (_req, res) => {
    const db = dbStore.read();
    res.json({ maintenance: db.maintenance });
  });

  // Auth Endpoints
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const userRecord = dbStore.findUserByEmail(email);
    if (!userRecord || userRecord.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const safeUser = dbStore.sanitizeUser(userRecord);
    const token = createSessionForUser(safeUser, res);
    res.json({ user: safeUser, token });
  });

  // Role-isolated preview sign-in endpoint (authenticates into that specific role's server session)
  app.post('/api/auth/portal', (req, res) => {
    const { role } = req.body as { role?: UserRole };
    if (!role || !['company', 'supervisor', 'guard', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Valid role is required' });
      return;
    }
    const userRecord = dbStore.findUserByRole(role);
    if (!userRecord) {
      res.status(404).json({ error: 'Role account not configured' });
      return;
    }
    const safeUser = dbStore.sanitizeUser(userRecord);
    const token = createSessionForUser(safeUser, res);
    res.json({ user: safeUser, token });
  });

  app.post('/api/auth/register-company', (req, res) => {
    const { companyName, contactName, email, password, phone } = req.body as {
      companyName?: string;
      contactName?: string;
      email?: string;
      password?: string;
      phone?: string;
    };
    if (!companyName || companyName.trim().length < 2 || !contactName || !email || !password || password.length < 8) {
      res.status(400).json({ error: 'Company name, contact name, valid email, and 8+ character password are required' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (dbStore.findUserByEmail(normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const { user: createdUser, company: createdCompany } = dbStore.mutate((db) => {
      const compId = `comp-${Date.now()}`;
      const userId = `usr-comp-${Date.now()}`;
      const initials = contactName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || 'CO';

      const newCompany = {
        id: compId,
        name: companyName.trim(),
        contactPerson: contactName.trim(),
        contactEmail: normalizedEmail,
        registeredAt: new Date().toISOString().slice(0, 10),
        guardsCount: 0,
        locationsCount: 0,
        approvalStatus: 'Pending' as const,
        subscriptionStatus: 'Active' as const,
        planName: 'Enterprise' as const,
        monthlyFee: 150,
        smsCreditsUsed: 0,
        smsCreditsLimit: 1000,
      };

      const newUser = {
        id: userId,
        name: contactName.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        role: 'company' as const,
        companyId: compId,
        companyName: companyName.trim(),
        initials,
        title: 'Company Owner',
      };

      db.companies.unshift(newCompany);
      db.users.push(newUser);
      db.platformUsers.unshift({
        id: `pu-${Date.now()}`,
        name: contactName.trim(),
        email: normalizedEmail,
        role: 'company',
        companyName: companyName.trim(),
        status: 'Active',
        lastLogin: 'Just now',
      });
      db.activities.unshift({
        id: `act-${Date.now()}`,
        scope: 'admin',
        type: 'company',
        message: `New company registered — ${newCompany.name}${phone ? ` (${phone.trim()})` : ''}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: 'Pending',
        tone: 'amber',
      });

      return { user: newUser, company: newCompany };
    });

    const safeUser = dbStore.sanitizeUser(createdUser);
    const token = createSessionForUser(safeUser, res);
    broadcastEvent('company:updated', createdCompany);
    res.status(201).json({ user: safeUser, company: createdCompany, token });
  });

  app.get('/api/auth/session', (req, res) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      res.json({ authenticated: false, user: null });
      return;
    }
    const session = sessions.get(token);
    const userRecord = session ? dbStore.findUserById(session.userId) : undefined;
    if (!userRecord) {
      res.json({ authenticated: false, user: null });
      return;
    }
    res.json({ authenticated: true, user: dbStore.sanitizeUser(userRecord) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: req.authUser });
  });

  app.post('/api/auth/logout', (req: AuthedRequest, res) => {
    const token = getTokenFromRequest(req);
    if (token) sessions.delete(token);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  // Shared Notifications for authenticated user's role
  app.get('/api/notifications', requireAuth, (req: AuthedRequest, res) => {
    const db = dbStore.read();
    const role = req.authUser!.role;
    const list = db.notifications.filter((n) => n.roleTarget === role || n.roleTarget === 'all');
    res.json({ notifications: list });
  });

  app.post('/api/notifications/:id/read', requireAuth, (req: AuthedRequest, res) => {
    const updated = dbStore.mutate((db) => {
      const target = db.notifications.find((n) => n.id === req.params.id);
      if (!target) return null;
      target.read = true;
      return target;
    });
    if (!updated) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    broadcastEvent('notification:updated', updated);
    res.json({ notification: updated });
  });

  // =========================================================================
  // COMPANY OWNER / MANAGEMENT APIs
  // =========================================================================
  app.get('/api/company/overview', requireAuth, requireRole(['company']), (req: AuthedRequest, res) => {
    const db = dbStore.read();
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const companyGuards = db.guards.filter((g) => g.companyId === companyId);
    const companyLocations = db.locations.filter((l) => l.companyId === companyId);
    const companyIncidents = db.incidents.filter((i) => i.companyId === companyId);
    const companyOccurrences = db.occurrences.filter((o) => o.companyId === companyId);
    const companySchedules = db.schedules.filter((s) => s.companyId === companyId);
    const companyAttendance = db.attendance.filter((a) => a.companyId === companyId);
    const companyShiftReports = db.shiftReports.filter((r) => r.companyId === companyId);
    const companyClients = db.clients.filter((c) => c.companyId === companyId);
    const companySupervisors = db.supervisors.filter((s) => s.companyId === companyId);
    const companyAnnouncements = db.announcements.filter((a) => a.companyId === companyId);
    const companyActivities = db.activities
      .filter((a) => a.scope === 'company' && (!a.companyId || a.companyId === companyId))
      .slice(0, 8);
    const companyProfile = db.companies.find((c) => c.id === companyId) ?? null;

    const kpis = computeCompanyMetrics(
      companyGuards,
      companyLocations,
      companyIncidents,
      db.companyFleetOnDutyOffset,
    );
    const onDutyGuards = filterOnDutyGuardsForLiveMap(companyGuards, '', 'all', 'all');
    const topLocations = companyLocations.slice(0, 5);

    const incidentSeries =
      companyIncidents.length === 0
        ? []
        : (['Low', 'Medium', 'High', 'Critical'] as const).map((sev) => ({
            label: sev,
            current: companyIncidents.filter((inc) => inc.severity === sev && inc.status !== 'Resolved').length,
            previous: companyIncidents.filter((inc) => inc.severity === sev && inc.status === 'Resolved').length,
          }));

    res.json({
      companyName: companyProfile?.name ?? req.authUser!.companyName ?? 'Company Workspace',
      companyProfile,
      kpis,
      liveMapGuards: onDutyGuards,
      allGuards: companyGuards,
      locations: companyLocations,
      topLocations,
      recentActivity: companyActivities,
      incidentSeries,
      incidents: companyIncidents,
      occurrences: companyOccurrences,
      schedules: companySchedules,
      attendance: companyAttendance,
      shiftReports: companyShiftReports,
      clients: companyClients,
      supervisors: companySupervisors,
      announcements: companyAnnouncements,
      invoices: db.invoices.filter((i) => i.companyId === companyId),
    });
  });

  app.get('/api/company/live-map', requireAuth, requireRole(['company']), (req: AuthedRequest, res) => {
    const db = dbStore.read();
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const companyGuards = db.guards.filter((g) => g.companyId === companyId);
    const companyLocations = db.locations.filter((l) => l.companyId === companyId);
    const search = String(req.query.search ?? '');
    const locationFilter = String(req.query.locationId ?? 'all');
    const postFilter = String(req.query.postName ?? 'all');
    const guards = filterOnDutyGuardsForLiveMap(companyGuards, search, locationFilter, postFilter);
    res.json({
      guards,
      locations: companyLocations.slice(0, 12),
    });
  });

  app.post('/api/company/supervisors', requireAuth, requireRole(['company']), (req: AuthedRequest, res) => {
    const { name, email, phone } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
    };
    if (!name || name.trim().length < 2 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Supervisor full name and valid email address are required' });
      return;
    }
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const created = dbStore.mutate((db) => {
      const nextNum = db.supervisors.length + 1;
      const newSup = {
        id: `sup-${Date.now()}`,
        companyId,
        name: name.trim(),
        employeeId: `SUP-${String(nextNum).padStart(3, '0')}`,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || '',
        avatar: '/src/assets/images/avatar_supervisor_marcus_1795080332764.jpg',
        assignedLocations: [],
        assignedGuardsCount: 0,
        avgResponseMinutes: 0,
        status: 'Active' as const,
      };
      db.supervisors.unshift(newSup);
      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId,
        scope: 'company',
        type: 'assignment',
        message: `Supervisor registered — ${newSup.name} (${newSup.employeeId})`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: 'Active',
        tone: 'blue',
      });
      return newSup;
    });
    broadcastEvent('guard:created', created);
    res.status(201).json({ supervisor: created });
  });

  app.post('/api/company/guards', requireAuth, requireRole(['company']), (req: AuthedRequest, res) => {
    const { name, phone, locationId, postName, shiftType } = req.body as {
      name?: string;
      phone?: string;
      locationId?: string;
      postName?: string;
      shiftType?: 'Day' | 'Evening' | 'Night';
    };
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Guard full name is required' });
      return;
    }
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const result = dbStore.mutate((db) => {
      const companyLocations = db.locations.filter((l) => l.companyId === companyId);
      const loc = companyLocations.find((l) => l.id === locationId) ?? companyLocations[0];
      if (!loc) {
        return { error: 'Please create a security location or client station before deploying a guard.' };
      }
      const nextNum = 1001 + db.guards.length;
      const shiftWin =
        shiftType === 'Night'
          ? '10:00 PM - 06:00 AM'
          : shiftType === 'Evening'
            ? '02:00 PM - 10:00 PM'
            : '06:00 AM - 02:00 PM';
      const newGuard: GuardRecord = {
        id: `grd-${Date.now()}`,
        companyId,
        name: name.trim(),
        employeeId: `GRD-${nextNum}`,
        avatar: '/src/assets/images/avatar_guard_david_1795080333403.jpg',
        phone: phone?.trim() || '',
        status: 'On Duty',
        trackingState: 'On Duty',
        locationId: loc.id,
        locationName: loc.name,
        postName: postName?.trim() || loc.postCode,
        supervisorId: loc.supervisorId,
        supervisorName: loc.supervisorName || 'Unassigned',
        shiftType: shiftType ?? 'Day',
        shiftWindow: shiftWin,
        shiftStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lastActivity: 'Assigned & checked in',
        lastGpsUpdate: 'Just now',
        gpsAccuracyMeters: 5,
        mapX: loc.mapX,
        mapY: loc.mapY,
        attendanceScore: 100,
      };
      db.guards.unshift(newGuard);

      const guardsAtLoc = db.guards.filter((g) => g.locationId === loc.id);
      loc.assignedGuardsCount = guardsAtLoc.length;
      loc.onDutyCount = guardsAtLoc.filter((g) => g.status === 'On Duty').length;

      const sup = db.supervisors.find((s) => s.id === loc.supervisorId);
      if (sup) {
        sup.assignedGuardsCount = db.guards.filter((g) => g.supervisorId === sup.id).length;
      }

      const comp = db.companies.find((c) => c.id === companyId);
      if (comp) {
        comp.guardsCount = db.guards.filter((g) => g.companyId === companyId).length;
      }

      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId,
        scope: 'company',
        type: 'assignment',
        message: `New guard ${newGuard.name} assigned to ${loc.name}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: 'Assigned',
        tone: 'emerald',
      });
      return { guard: newGuard };
    });

    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }

    broadcastEvent('guard:created', result.guard);
    res.status(201).json({ guard: result.guard });
  });

  app.post('/api/company/locations', requireAuth, requireRole(['company']), (req: AuthedRequest, res) => {
    const { name, clientId, address, zone, supervisorId } = req.body as {
      name?: string;
      clientId?: string;
      address?: string;
      zone?: string;
      supervisorId?: string;
    };
    if (!name || !address) {
      res.status(400).json({ error: 'Location name and address are required' });
      return;
    }
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const created = dbStore.mutate((db) => {
      const client = db.clients.find((c) => c.id === clientId && c.companyId === companyId);
      const sup = db.supervisors.find((s) => s.id === supervisorId && s.companyId === companyId);
      const companyLocations = db.locations.filter((l) => l.companyId === companyId);
      const newLoc: LocationRecord = {
        id: `loc-${Date.now()}`,
        companyId,
        clientId: client?.id ?? '',
        clientName: client?.name ?? 'Direct Site',
        name: name.trim(),
        postCode: `POST-${companyLocations.length + 1}`,
        address: address.trim(),
        zone: zone?.trim() || 'Metro Zone',
        supervisorId: sup?.id ?? '',
        supervisorName: sup?.name ?? 'Unassigned',
        assignedGuardsCount: 0,
        onDutyCount: 0,
        attendanceRate: 0,
        sharePercent: 0,
        status: 'Active',
        mapX: 32 + ((companyLocations.length * 13) % 46),
        mapY: 30 + ((companyLocations.length * 17) % 45),
      };
      db.locations.unshift(newLoc);
      if (sup && !sup.assignedLocations.includes(newLoc.name)) {
        sup.assignedLocations.push(newLoc.name);
      }
      const comp = db.companies.find((c) => c.id === companyId);
      if (comp) {
        comp.locationsCount = db.locations.filter((l) => l.companyId === companyId).length;
      }
      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId,
        scope: 'company',
        type: 'assignment',
        message: `Security post created — ${newLoc.name}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: 'Active',
        tone: 'blue',
      });
      return newLoc;
    });
    broadcastEvent('location:created', created);
    res.status(201).json({ location: created });
  });

  app.post('/api/company/clients', requireAuth, requireRole(['company']), (req: AuthedRequest, res) => {
    const body = req.body as {
      clientName?: string;
      industry?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      stationName?: string;
      stationAddress?: string;
      zone?: string;
      postName?: string;
      monthlyPrice?: number | string;
      billingCycle?: 'Monthly' | 'Quarterly' | 'Annual';
      shiftCoverage?: string;
      requiredGuards?: number | string;
      contractStartDate?: string;
      serviceNotes?: string;
      status?: 'Active' | 'Onboarding' | 'Renewing';
    };

    const validation = validateClientOnboardingInput({
      clientName: body.clientName,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      stationName: body.stationName,
      stationAddress: body.stationAddress,
      monthlyPrice: body.monthlyPrice,
    });
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const monthlyPrice = Number(body.monthlyPrice);
    const reqGuards = Math.max(1, Number(body.requiredGuards) || 1);
    const companyId = req.authUser?.companyId ?? 'comp-acme';

    const { client, location } = dbStore.mutate((db) => {
      const now = Date.now();
      const newClient: ClientRecord = {
        id: `cli-${now}`,
        companyId,
        name: body.clientName!.trim(),
        industry: body.industry?.trim() || 'Commercial Security',
        contactName: body.contactName!.trim(),
        contactEmail: body.contactEmail!.trim().toLowerCase(),
        contactPhone: body.contactPhone!.trim(),
        activeSites: 1,
        contractValueMonthly: monthlyPrice,
        status: body.status ?? 'Onboarding',
        billingCycle: body.billingCycle ?? 'Monthly',
        serviceNotes: body.serviceNotes?.trim() || undefined,
        contractStartDate: body.contractStartDate?.trim() || new Date().toISOString().slice(0, 10),
        createdByCompanyOwner: true,
      };

      const postPrefix = body.stationName!
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? 'S')
        .join('');

      const newLocation: LocationRecord = {
        id: `loc-${now + 1}`,
        companyId,
        clientId: newClient.id,
        clientName: newClient.name,
        name: body.stationName!.trim(),
        postCode: body.postName?.trim() || `POST-${postPrefix}${db.locations.length + 1}`,
        address: body.stationAddress!.trim(),
        zone: body.zone?.trim() || 'Metro Zone',
        supervisorId: '',
        supervisorName: 'Unassigned',
        assignedGuardsCount: 0,
        onDutyCount: 0,
        attendanceRate: 100,
        sharePercent: 5,
        status: 'Active',
        mapX: 36 + (db.locations.length % 40),
        mapY: 32 + ((db.locations.length * 7) % 45),
        monthlyFee: monthlyPrice,
        requiredGuards: reqGuards,
        shiftCoverage: body.shiftCoverage?.trim() || '24/7 Coverage',
        serviceNotes: body.serviceNotes?.trim() || undefined,
      };

      db.clients.unshift(newClient);
      db.locations.unshift(newLocation);

      const comp = db.companies.find((c) => c.id === companyId);
      if (comp) {
        comp.locationsCount += 1;
      }

      db.activities.unshift({
        id: `act-${now}`,
        companyId,
        scope: 'company',
        type: 'company',
        message: `Registered client ${newClient.name} · Station: ${newLocation.name} (GH₵${monthlyPrice.toLocaleString()}/mo)`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: 'Registered',
        tone: 'blue',
      });

      return { client: newClient, location: newLocation };
    });

    broadcastEvent('client:created', client);
    broadcastEvent('location:created', location);
    res.status(201).json({ client, location });
  });

  app.post('/api/company/stations/:id/assign', requireAuth, requireRole(['company']), (req: AuthedRequest, res) => {
    const locationId = req.params.id;
    const body = req.body as {
      supervisorMode?: 'existing' | 'new';
      supervisorId?: string;
      newSupervisorName?: string;
      newSupervisorEmail?: string;
      newSupervisorPhone?: string;
      guardMode?: 'existing' | 'new';
      guardId?: string;
      newGuardName?: string;
      newGuardPhone?: string;
      postName?: string;
      shiftType?: 'Day' | 'Evening' | 'Night';
    };

    const validation = validateStationAssignmentInput({
      locationId,
      supervisorMode: body.supervisorMode ?? 'existing',
      supervisorId: body.supervisorId,
      newSupervisorName: body.newSupervisorName,
      guardMode: body.guardMode ?? 'existing',
      guardId: body.guardId,
      newGuardName: body.newGuardName,
      shiftType: body.shiftType ?? 'Day',
    });
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const result = dbStore.mutate((db) => {
      const loc = db.locations.find((l) => l.id === locationId);
      if (!loc) return { error: 'Station not found', status: 404 as const };

      let sup = (body.supervisorMode ?? 'existing') === 'existing'
        ? db.supervisors.find((s) => s.id === body.supervisorId)
        : undefined;

      if ((body.supervisorMode ?? 'existing') === 'new') {
        const nextSupNum = db.supervisors.length + 1;
        sup = {
          id: `sup-${Date.now()}`,
          companyId: loc.companyId,
          name: body.newSupervisorName!.trim(),
          employeeId: `SUP-${String(nextSupNum).padStart(3, '0')}`,
          email:
            body.newSupervisorEmail?.trim().toLowerCase() ||
            `${body.newSupervisorName!.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}@sentinelguardops.com`,
          phone: body.newSupervisorPhone?.trim() || '',
          avatar: '/src/assets/images/avatar_supervisor_marcus_1795080332764.jpg',
          assignedLocations: [],
          assignedGuardsCount: 0,
          avgResponseMinutes: 0,
          status: 'Active',
        };
        db.supervisors.unshift(sup);
      }

      if (!sup) return { error: 'Supervisor not found', status: 404 as const };

      const shiftType: 'Day' | 'Evening' | 'Night' = body.shiftType ?? 'Day';
      const shiftWin =
        shiftType === 'Night'
          ? '10:00 PM - 06:00 AM'
          : shiftType === 'Evening'
            ? '02:00 PM - 10:00 PM'
            : '06:00 AM - 02:00 PM';
      const schedTimes =
        shiftType === 'Night'
          ? { startTime: '22:00', endTime: '06:00' }
          : shiftType === 'Evening'
            ? { startTime: '14:00', endTime: '22:00' }
            : { startTime: '06:00', endTime: '14:00' };

      loc.supervisorId = sup.id;
      loc.supervisorName = sup.name;
      if (!sup.assignedLocations.includes(loc.name)) {
        sup.assignedLocations.push(loc.name);
      }

      let assignedGuard: GuardRecord;
      if ((body.guardMode ?? 'existing') === 'new') {
        const nextNum = 1001 + db.guards.length;
        assignedGuard = {
          id: `grd-${Date.now()}`,
          companyId: loc.companyId,
          name: body.newGuardName!.trim(),
          employeeId: `GRD-${nextNum}`,
          avatar: '/src/assets/images/avatar_guard_david_1795080333403.jpg',
          phone: body.newGuardPhone?.trim() || '',
          status: 'On Duty',
          trackingState: 'On Duty',
          locationId: loc.id,
          locationName: loc.name,
          postName: body.postName?.trim() || loc.postCode,
          supervisorId: sup.id,
          supervisorName: sup.name,
          shiftType,
          shiftWindow: shiftWin,
          shiftStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lastActivity: `Assigned to ${loc.name}`,
          lastGpsUpdate: 'Just now',
          gpsAccuracyMeters: 5,
          mapX: loc.mapX,
          mapY: loc.mapY,
          attendanceScore: 100,
        };
        db.guards.unshift(assignedGuard);
      } else {
        const existing = db.guards.find((g) => g.id === body.guardId);
        if (!existing) return { error: 'Selected guard not found', status: 404 as const };
        existing.locationId = loc.id;
        existing.locationName = loc.name;
        existing.postName = body.postName?.trim() || loc.postCode;
        existing.supervisorId = sup.id;
        existing.supervisorName = sup.name;
        existing.shiftType = shiftType;
        existing.shiftWindow = shiftWin;
        existing.lastActivity = `Reassigned to ${loc.name}`;
        existing.mapX = loc.mapX;
        existing.mapY = loc.mapY;
        assignedGuard = existing;
      }

      const guardsAtStation = db.guards.filter((g) => g.locationId === loc.id);
      loc.assignedGuardsCount = guardsAtStation.length;
      loc.onDutyCount = guardsAtStation.filter((g) => g.status === 'On Duty').length;
      const comp = db.companies.find((c) => c.id === loc.companyId);
      if (comp) {
        comp.guardsCount = db.guards.filter((g) => g.companyId === loc.companyId).length;
      }

      sup.assignedGuardsCount = db.guards.filter((g) => g.supervisorId === sup.id).length;

      const parentClient = db.clients.find((c) => c.id === loc.clientId);
      if (parentClient && parentClient.status === 'Onboarding') {
        parentClient.status = 'Active';
      }

      const newSchedule = {
        id: `sch-${Date.now()}`,
        companyId: loc.companyId,
        locationId: loc.id,
        locationName: loc.name,
        supervisorId: sup.id,
        shiftType,
        startTime: schedTimes.startTime,
        endTime: schedTimes.endTime,
        date: new Date().toISOString().slice(0, 10),
        assignedGuardIds: [assignedGuard.id],
        assignedGuardNames: [assignedGuard.name],
        requiredGuards: loc.requiredGuards ?? 1,
        status: 'Scheduled' as const,
      };
      db.schedules.unshift(newSchedule);

      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId: loc.companyId,
        scope: 'company',
        type: 'assignment',
        message: `Assigned ${sup.name} (Supervisor) & ${assignedGuard.name} (Guard) to ${loc.name}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: 'Deployed',
        tone: 'emerald',
      });

      db.notifications.unshift({
        id: `not-${Date.now()}`,
        roleTarget: 'supervisor',
        title: `New Station Assigned: ${loc.name}`,
        message: `${req.authUser!.name} assigned you to oversee ${loc.name} (${loc.clientName}) with guard ${assignedGuard.name}.`,
        timeAgo: 'Just now',
        read: false,
        tone: 'info',
      });

      db.notifications.unshift({
        id: `not-${Date.now() + 1}`,
        roleTarget: 'guard',
        title: `Station Assignment: ${loc.name}`,
        message: `You are assigned to ${loc.name} (${assignedGuard.postName}) under Supervisor ${sup.name}.`,
        timeAgo: 'Just now',
        read: false,
        tone: 'success',
      });

      return { location: loc, supervisor: sup, guard: assignedGuard, schedule: newSchedule };
    });

    if ('error' in result) {
      res.status(result.status ?? 400).json({ error: result.error });
      return;
    }

    broadcastEvent('location:assigned', result.location);
    broadcastEvent('guard:updated', result.guard);
    broadcastEvent('schedule:created', result.schedule);
    res.json(result);
  });

  app.post('/api/company/reports/:id/verify', requireAuth, requireRole(['company']), (req: AuthedRequest, res) => {
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const report = dbStore.mutate((db) => {
      const target = db.shiftReports.find((r) => r.id === req.params.id && r.companyId === companyId);
      if (!target) return null;
      target.status = 'Verified by Owner';
      target.verifiedAt = 'Just now';
      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId,
        scope: 'company',
        type: 'verification',
        message: `Owner verified shift report for ${target.locationName}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: 'Verified',
        tone: 'emerald',
      });
      return target;
    });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    broadcastEvent('report:reviewed', report);
    res.json({ report });
  });

  app.post('/api/company/incidents/:id/status', requireAuth, requireRole(['company', 'supervisor']), (req: AuthedRequest, res) => {
    const { status } = req.body as { status?: 'Open' | 'Investigating' | 'Resolved' | 'Escalated' };
    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const updated = dbStore.mutate((db) => {
      const inc = db.incidents.find((i) => i.id === req.params.id && i.companyId === companyId);
      if (!inc) return null;
      inc.status = status;
      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId,
        scope: 'company',
        type: 'incident',
        message: `Incident ${inc.type} at ${inc.locationName} marked ${status}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: status,
        tone: status === 'Resolved' ? 'emerald' : 'amber',
      });
      return inc;
    });
    if (!updated) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    broadcastEvent('incident:updated', updated);
    res.json({ incident: updated });
  });

  app.post('/api/announcements', requireAuth, requireRole(['company', 'supervisor']), (req: AuthedRequest, res) => {
    const { title, body, audience, priority } = req.body as {
      title?: string;
      body?: string;
      audience?: 'All Personnel' | 'Supervisors Only' | 'Field Guards';
      priority?: 'Standard' | 'Urgent';
    };
    if (!title || !body) {
      res.status(400).json({ error: 'Title and announcement message are required' });
      return;
    }
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const created = dbStore.mutate((db) => {
      const item = {
        id: `ann-${Date.now()}`,
        companyId,
        title: title.trim(),
        body: body.trim(),
        audience: audience ?? 'All Personnel',
        author: `${req.authUser!.name} (${req.authUser!.role === 'company' ? 'Management' : 'Supervisor'})`,
        createdAt: 'Just now',
        priority: priority ?? 'Standard',
      };
      db.announcements.unshift(item);
      return item;
    });
    broadcastEvent('announcement:created', created);
    res.status(201).json({ announcement: created });
  });

  app.post('/api/company/schedules', requireAuth, requireRole(['company', 'supervisor']), (req: AuthedRequest, res) => {
    const { locationId, shiftType, date, startTime, endTime, guardId } = req.body as {
      locationId?: string;
      shiftType?: 'Day' | 'Evening' | 'Night';
      date?: string;
      startTime?: string;
      endTime?: string;
      guardId?: string;
    };
    if (!locationId || !shiftType || !date) {
      res.status(400).json({ error: 'Location, shift type, and date are required' });
      return;
    }
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const result = dbStore.mutate((db) => {
      const companyLocations = db.locations.filter((l) => l.companyId === companyId);
      const loc = companyLocations.find((l) => l.id === locationId) ?? companyLocations[0];
      if (!loc) {
        return { error: 'Please create a location before creating a duty schedule.' };
      }
      const guard = db.guards.find((g) => g.id === guardId && g.companyId === companyId);
      const sch = {
        id: `sch-${Date.now()}`,
        companyId,
        locationId: loc.id,
        locationName: loc.name,
        supervisorId: loc.supervisorId,
        shiftType,
        startTime: startTime || '06:00',
        endTime: endTime || '14:00',
        date,
        assignedGuardIds: guard ? [guard.id] : [],
        assignedGuardNames: guard ? [guard.name] : ['Unassigned'],
        requiredGuards: loc.requiredGuards ?? 1,
        status: 'Scheduled' as const,
      };
      db.schedules.unshift(sch);
      return { schedule: sch };
    });

    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }

    broadcastEvent('schedule:created', result.schedule);
    res.status(201).json({ schedule: result.schedule });
  });

  // =========================================================================
  // SUPERVISOR APIs (Strictly scoped to assigned guards/locations; NO company Live Map)
  // =========================================================================
  app.get('/api/supervisor/overview', requireAuth, requireRole(['supervisor']), (req: AuthedRequest, res) => {
    const db = dbStore.read();
    const supId = req.authUser!.id;
    const companyId = req.authUser!.companyId ?? 'comp-default';
    const assignedGuards = db.guards.filter((g) => g.supervisorId === supId);
    const assignedLocations = db.locations.filter((l) => l.supervisorId === supId);
    const occurrences = db.occurrences.filter((o) => o.supervisorId === supId);
    const incidents = db.incidents.filter((i) => i.supervisorId === supId);
    const shiftReports = db.shiftReports.filter((r) => r.supervisorId === supId);
    const schedules = db.schedules.filter((s) => s.supervisorId === supId);
    const assignedGuardIds = new Set(assignedGuards.map((g) => g.id));
    const attendance = db.attendance.filter((a) => assignedGuardIds.has(a.guardId));
    const kpis = computeSupervisorMetrics(
      db.guards,
      db.incidents,
      db.shiftReports,
      supId,
      db.supervisorFleetOffset,
    );

    res.json({
      supervisor: req.authUser,
      kpis,
      assignedGuards,
      assignedLocations,
      occurrences,
      incidents,
      shiftReports,
      schedules,
      attendance,
      announcements: db.announcements.filter((a) => a.companyId === companyId),
    });
  });

  app.post('/api/supervisor/occurrences/:id/acknowledge', requireAuth, requireRole(['supervisor']), (req, res) => {
    const updated = dbStore.mutate((db) => {
      const occ = db.occurrences.find((o) => o.id === req.params.id);
      if (!occ) return null;
      occ.status = 'Acknowledged';
      return occ;
    });
    if (!updated) {
      res.status(404).json({ error: 'Occurrence not found' });
      return;
    }
    broadcastEvent('occurrence:updated', updated);
    res.json({ occurrence: updated });
  });

  app.post('/api/supervisor/reports/:id/review', requireAuth, requireRole(['supervisor']), (req: AuthedRequest, res) => {
    const { action, reason } = req.body as { action?: 'finalize' | 'return'; reason?: string };
    if (!action || (action !== 'finalize' && action !== 'return')) {
      res.status(400).json({ error: 'Invalid review action' });
      return;
    }
    const validation = validateReportReviewAction(action, reason);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const reviewerName = req.authUser!.name;
    const updated = dbStore.mutate((db) => {
      const report = db.shiftReports.find((r) => r.id === req.params.id);
      if (!report) return null;
      report.status = action === 'finalize' ? 'Finalized' : 'Returned for Correction';
      report.reviewReason = action === 'return' ? reason?.trim() : undefined;
      report.reviewedAt = 'Just now';

      const hist = db.guardShiftHistory.find((h) => h.id === report.id);
      if (hist) hist.reportStatus = report.status;

      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId: report.companyId,
        scope: 'company',
        type: 'review',
        message:
          action === 'finalize'
            ? `Supervisor finalized ${report.guardName}'s shift report (${report.locationName})`
            : `Supervisor returned ${report.guardName}'s shift report for correction`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: report.status,
        tone: action === 'finalize' ? 'emerald' : 'amber',
      });

      db.notifications.unshift({
        id: `not-${Date.now()}`,
        roleTarget: 'guard',
        title:
          action === 'finalize'
            ? 'Shift Report Finalized'
            : 'Shift Report Returned for Correction',
        message:
          action === 'finalize'
            ? `Your shift report for ${report.locationName} was finalized by ${reviewerName}.`
            : `Correction requested: ${report.reviewReason}`,
        timeAgo: 'Just now',
        read: false,
        tone: action === 'finalize' ? 'success' : 'warning',
      });

      return report;
    });

    if (!updated) {
      res.status(404).json({ error: 'Shift report not found' });
      return;
    }

    broadcastEvent('report:reviewed', updated);
    res.json({ report: updated });
  });

  // =========================================================================
  // GUARD MOBILE APIs
  // =========================================================================
  app.get('/api/guard/state', requireAuth, requireRole(['guard']), (req: AuthedRequest, res) => {
    const db = dbStore.read();
    const guardId = req.authUser!.id;
    const guard = db.guards.find((g) => g.id === guardId) ?? null;

    if (!guard) {
      res.json({
        guard: null,
        user: req.authUser,
        companyName: req.authUser!.companyName ?? 'Company Workspace',
        isOnDuty: false,
        shiftStartedIso: null,
        todayOccurrences: [],
        todayIncidents: [],
        shiftHistory: [],
      });
      return;
    }

    const isOnDuty = guard.status === 'On Duty';
    const shiftStartedIso = db.guardActiveShiftIso[guard.id] ?? null;

    res.json({
      guard,
      user: req.authUser,
      companyName:
        db.companies.find((c) => c.id === guard.companyId)?.name ??
        req.authUser!.companyName ??
        'Company Workspace',
      isOnDuty,
      shiftStartedIso,
      todayOccurrences: db.occurrences.filter((o) => o.guardId === guard.id),
      todayIncidents: db.incidents.filter((i) => i.guardId === guard.id),
      shiftHistory: db.guardShiftHistory.filter((h) => !h.guardId || h.guardId === guard.id),
    });
  });

  app.post('/api/guard/report-duty', requireAuth, requireRole(['guard']), (req: AuthedRequest, res) => {
    const guardId = req.authUser!.id;
    const result = dbStore.mutate((db) => {
      const guard = db.guards.find((g) => g.id === guardId);
      if (!guard) return null;
      const nowIso = new Date().toISOString();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      guard.status = 'On Duty';
      guard.trackingState = 'On Duty';
      guard.shiftStartTime = timeStr;
      guard.lastActivity = 'Reported on duty';
      guard.lastGpsUpdate = 'Just now';
      guard.gpsAccuracyMeters = 5;
      db.guardActiveShiftIso[guard.id] = nowIso;

      db.attendance.unshift({
        id: `att-${Date.now()}`,
        companyId: guard.companyId,
        guardId: guard.id,
        guardName: guard.name,
        employeeId: guard.employeeId,
        locationName: guard.locationName,
        shiftDate: new Date().toISOString().slice(0, 10),
        scheduledStart: guard.shiftWindow.split(' - ')[0] ?? '06:00 AM',
        actualCheckIn: timeStr,
        checkOut: null,
        status: 'Active',
      });

      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId: guard.companyId,
        scope: 'company',
        type: 'checkin',
        message: `${guard.name} reported on duty at ${guard.locationName}`,
        timeAgo: 'Just now',
        createdAt: nowIso,
        statusLabel: 'On Duty',
        tone: 'emerald',
      });

      return { guard, shiftStartedIso: nowIso };
    });

    if (!result) {
      res.status(404).json({ error: 'No guard station assignment found for this account yet.' });
      return;
    }
    broadcastEvent('duty:updated', result.guard);
    res.json(result);
  });

  app.post('/api/guard/occurrences', requireAuth, requireRole(['guard']), (req: AuthedRequest, res) => {
    const { category, description, evidenceUrl, evidenceType } = req.body as {
      category?: string;
      description?: string;
      evidenceUrl?: string;
      evidenceType?: 'photo' | 'video';
    };
    const validation = validateOccurrenceInput({ category, description });
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const guardId = req.authUser!.id;
    const created = dbStore.mutate((db) => {
      const guard = db.guards.find((g) => g.id === guardId);
      if (!guard) return null;
      const occ = {
        id: `occ-${Date.now()}`,
        companyId: guard.companyId,
        guardId: guard.id,
        guardName: guard.name,
        locationId: guard.locationId,
        locationName: guard.locationName,
        supervisorId: guard.supervisorId,
        shiftType: guard.shiftType,
        category: category as OccurrenceRecord['category'],
        description: description!.trim(),
        evidenceUrl,
        evidenceType,
        gpsLabel: `${guard.locationName} · ${guard.postName}`,
        createdAt: 'Just now',
        status: category === 'Suspicious Activity' ? ('Flagged' as const) : ('Logged' as const),
      };
      db.occurrences.unshift(occ);
      guard.lastActivity = `Logged ${category}`;
      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId: guard.companyId,
        scope: 'company',
        type: 'occurrence',
        message: `${guard.name} recorded ${category} at ${guard.locationName}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: 'Logged',
        tone: 'blue',
      });
      return occ;
    });

    if (!created) {
      res.status(404).json({ error: 'No guard station assignment found for this account yet.' });
      return;
    }

    broadcastEvent('occurrence:created', created);
    res.status(201).json({ occurrence: created });
  });

  app.post('/api/guard/incidents', requireAuth, requireRole(['guard']), (req: AuthedRequest, res) => {
    const { type, severity, description, locationName, evidenceUrl } = req.body as {
      type?: string;
      severity?: string;
      description?: string;
      locationName?: string;
      evidenceUrl?: string;
    };
    const validation = validateIncidentInput({ type, severity, description, locationName });
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const guardId = req.authUser!.id;
    const created = dbStore.mutate((db) => {
      const guard = db.guards.find((g) => g.id === guardId);
      if (!guard) return null;
      const inc = {
        id: `inc-${Date.now()}`,
        companyId: guard.companyId,
        guardId: guard.id,
        guardName: guard.name,
        locationId: guard.locationId,
        locationName: locationName!.trim(),
        supervisorId: guard.supervisorId,
        type: type!.trim(),
        severity: severity as IncidentRecord['severity'],
        description: description!.trim(),
        evidenceUrl,
        reportedAt: 'Just now',
        status: 'Open' as const,
      };
      db.incidents.unshift(inc);
      guard.lastActivity = `Reported ${type}`;
      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId: guard.companyId,
        scope: 'company',
        type: 'incident',
        message: `${severity} incident: ${type} at ${locationName}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: severity ?? 'Alert',
        tone: severity === 'Critical' || severity === 'High' ? 'red' : 'amber',
      });
      db.notifications.unshift({
        id: `not-${Date.now()}`,
        roleTarget: 'supervisor',
        title: `${severity} Incident Reported`,
        message: `${guard.name} reported ${type} at ${locationName}.`,
        timeAgo: 'Just now',
        read: false,
        tone: severity === 'Critical' ? 'critical' : 'warning',
      });
      return inc;
    });

    if (!created) {
      res.status(404).json({ error: 'No guard station assignment found for this account yet.' });
      return;
    }

    broadcastEvent('incident:created', created);
    res.status(201).json({ incident: created });
  });

  app.post('/api/guard/close-shift', requireAuth, requireRole(['guard']), (req: AuthedRequest, res) => {
    const { handoverNotes, finalSummary, reviewedConfirmed } = req.body as {
      handoverNotes?: string;
      finalSummary?: string;
      reviewedConfirmed?: boolean;
    };
    const validation = validateShiftCloseInput({ handoverNotes, finalSummary, reviewedConfirmed });
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const guardId = req.authUser!.id;
    const createdReport = dbStore.mutate((db) => {
      const guard = db.guards.find((g) => g.id === guardId);
      if (!guard) return null;
      const endStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const occCount = db.occurrences.filter((o) => o.guardId === guard.id).length;
      const incCount = db.incidents.filter((i) => i.guardId === guard.id).length;
      const reportId = `sr-${Date.now()}`;

      const report: ShiftReportRecord = {
        id: reportId,
        companyId: guard.companyId,
        guardId: guard.id,
        guardName: guard.name,
        guardAvatar: guard.avatar,
        employeeId: guard.employeeId,
        locationId: guard.locationId,
        locationName: guard.locationName,
        supervisorId: guard.supervisorId,
        supervisorName: guard.supervisorName,
        shiftType: guard.shiftType,
        shiftDate: new Date().toISOString().slice(0, 10),
        shiftStart: guard.shiftStartTime ?? '06:00 AM',
        shiftEnd: endStr,
        submittedAt: 'Just now',
        attendanceStatus: `On Time (${guard.shiftStartTime ?? '06:00 AM'})`,
        occurrencesCount: occCount,
        incidentsCount: incCount,
        handoverNotes: handoverNotes!.trim(),
        finalSummary: finalSummary!.trim(),
        evidenceUrls: [],
        status: 'Awaiting Review',
      };

      db.shiftReports.unshift(report);
      db.guardShiftHistory.unshift({
        id: reportId,
        guardId: guard.id,
        date: report.shiftDate,
        postName: `${guard.locationName} — ${guard.postName}`,
        shiftWindow: guard.shiftWindow,
        checkIn: report.shiftStart,
        checkOut: endStr,
        occurrencesLogged: occCount,
        incidentsReported: incCount,
        reportStatus: 'Awaiting Review',
      });

      guard.status = 'Off Duty';
      guard.trackingState = 'Location Unavailable';
      guard.lastActivity = 'Shift closed & report submitted';
      guard.shiftStartTime = null;
      db.guardActiveShiftIso[guard.id] = null;

      db.activities.unshift({
        id: `act-${Date.now()}`,
        companyId: guard.companyId,
        scope: 'company',
        type: 'review',
        message: `${guard.name} submitted final shift report for ${guard.locationName}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: 'Awaiting Review',
        tone: 'amber',
      });

      return report;
    });

    if (!createdReport) {
      res.status(404).json({ error: 'No guard station assignment found for this account yet.' });
      return;
    }

    broadcastEvent('report:submitted', createdReport);
    res.status(201).json({ report: createdReport });
  });

  // =========================================================================
  // SUPER ADMIN APIs
  // =========================================================================
  app.get('/api/admin/overview', requireAuth, requireRole(['admin']), (_req, res) => {
    const db = dbStore.read();
    const kpis = computeAdminMetrics(db.companies, db.systemHealth);
    const totalSmsSent = db.companies.reduce((sum, c) => sum + c.smsCreditsUsed, 0);
    const totalSmsLimit = db.companies.reduce((sum, c) => sum + c.smsCreditsLimit, 0);

    const billingMap = new Map<string, number>();
    for (const inv of db.invoices) {
      billingMap.set(inv.period, (billingMap.get(inv.period) ?? 0) + inv.amount);
    }
    const billingSeries = Array.from(billingMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    res.json({
      kpis,
      companies: db.companies,
      onboardingQueue: db.companies.filter(
        (c) => c.approvalStatus === 'Pending' || c.approvalStatus === 'In Review',
      ),
      billingSeries,
      platformActivity: db.activities.filter((a) => a.scope === 'admin').slice(0, 8),
      systemHealth: db.systemHealth,
      platformUsers: db.platformUsers,
      invoices: db.invoices,
      supportTickets: db.supportTickets,
      auditLogs: db.auditLogs,
      maintenance: db.maintenance,
      maintenanceHistory: db.maintenanceHistory,
      smsSummary: {
        creditsUsed: totalSmsSent,
        creditsLimit: totalSmsLimit,
        messagesSent: totalSmsSent,
        failedMessages: 0,
      },
    });
  });

  app.post('/api/admin/maintenance', requireAuth, requireRole(['admin']), (req: AuthedRequest, res) => {
    const body = req.body as Partial<MaintenanceConfig>;
    const current = dbStore.read().maintenance;

    const nextTitle = body.title !== undefined ? body.title.trim() : current.title;
    const nextMessage = body.message !== undefined ? body.message.trim() : current.message;
    const nextDuration =
      body.estimatedDuration !== undefined
        ? body.estimatedDuration.trim()
        : current.estimatedDuration;

    const validation = validateMaintenanceConfigInput({
      title: nextTitle,
      message: nextMessage,
      estimatedDuration: nextDuration,
    });
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const nextEnabled = typeof body.enabled === 'boolean' ? body.enabled : current.enabled;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    const actionType: 'Enabled' | 'Disabled' | 'Updated' =
      nextEnabled !== current.enabled ? (nextEnabled ? 'Enabled' : 'Disabled') : 'Updated';

    const updated = dbStore.mutate((db) => {
      const nextConfig: MaintenanceConfig = {
        enabled: nextEnabled,
        title: nextTitle,
        message: nextMessage,
        severity: body.severity ?? current.severity,
        estimatedDuration: nextDuration,
        scheduledWindow:
          body.scheduledWindow !== undefined
            ? body.scheduledWindow.trim() || 'Immediate'
            : current.scheduledWindow,
        affectedScopes: {
          companyDashboard:
            body.affectedScopes?.companyDashboard ?? current.affectedScopes.companyDashboard,
          supervisorDashboard:
            body.affectedScopes?.supervisorDashboard ?? current.affectedScopes.supervisorDashboard,
          guardDashboard:
            body.affectedScopes?.guardDashboard ?? current.affectedScopes.guardDashboard,
        },
        allowReadOnlyAccess:
          typeof body.allowReadOnlyAccess === 'boolean'
            ? body.allowReadOnlyAccess
            : current.allowReadOnlyAccess,
        notifyUsersBanner:
          typeof body.notifyUsersBanner === 'boolean'
            ? body.notifyUsersBanner
            : current.notifyUsersBanner,
        contactNote:
          body.contactNote !== undefined ? body.contactNote.trim() : current.contactNote,
        updatedAt: timestamp,
        updatedBy: req.authUser!.name,
      };

      db.maintenance = nextConfig;
      db.maintenanceHistory.unshift({
        id: `mh-${Date.now()}`,
        action: actionType,
        title: nextConfig.title,
        severity: nextConfig.severity,
        duration: nextConfig.estimatedDuration,
        actor: req.authUser!.name,
        timestamp,
      });
      db.maintenanceHistory = db.maintenanceHistory.slice(0, 20);

      // Reflect maintenance state in Application Services system health record
      const appService = db.systemHealth.find((s) => s.id === 'svc-app');
      if (appService) {
        appService.status = nextConfig.enabled ? 'Maintenance' : 'Operational';
        appService.note = nextConfig.enabled
          ? `Maintenance mode active (${nextConfig.severity})`
          : 'Express API healthy';
      }

      db.activities.unshift({
        id: `act-${Date.now()}`,
        scope: 'admin',
        type: 'company',
        message:
          actionType === 'Enabled'
            ? `Platform maintenance enabled (${nextConfig.severity})`
            : actionType === 'Disabled'
              ? 'Platform maintenance disabled — systems operational'
              : `Maintenance configuration updated (${nextConfig.title})`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: nextConfig.enabled ? 'Maintenance' : 'Operational',
        tone: nextConfig.enabled ? 'amber' : 'emerald',
      });

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actor: req.authUser!.name,
        role: 'Super Admin',
        action: `Maintenance ${actionType}`,
        target: `${nextConfig.title} (${nextConfig.estimatedDuration})`,
        timestamp,
        ipAddress: '10.24.18.9',
      });

      return nextConfig;
    });

    broadcastEvent('maintenance:updated', updated);
    res.json({ maintenance: updated });
  });

  app.post('/api/admin/invoices', requireAuth, requireRole(['admin']), (req: AuthedRequest, res) => {
    const { companyId, amount, period, planName, status } = req.body as {
      companyId?: string;
      amount?: number;
      period?: string;
      planName?: string;
      status?: 'Paid' | 'Pending' | 'Overdue';
    };
    const numericAmount = Number(amount);
    if (!companyId || !period || !period.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ error: 'Valid company, billing period, and positive amount are required' });
      return;
    }

    const created = dbStore.mutate((db) => {
      const comp = db.companies.find((c) => c.id === companyId);
      if (!comp) return null;
      const invoiceId = `INV-${new Date().getFullYear()}-${String(1100 + db.invoices.length + 1)}`;
      const inv: BillingInvoiceRecord = {
        id: invoiceId,
        companyId: comp.id,
        companyName: comp.name,
        planName: (planName ?? comp.planName).trim(),
        amount: numericAmount,
        period: period.trim(),
        status: status ?? 'Pending',
        issuedAt: new Date().toISOString().slice(0, 10),
      };
      db.invoices.unshift(inv);
      db.activities.unshift({
        id: `act-${Date.now()}`,
        scope: 'admin',
        type: 'billing',
        message: `Generated invoice ${inv.id} for ${comp.name} (GH₵${inv.amount.toLocaleString()})`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: inv.status,
        tone: inv.status === 'Paid' ? 'emerald' : 'amber',
      });
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actor: req.authUser!.name,
        role: 'Super Admin',
        action: 'Generated Invoice',
        target: `${inv.id} · ${comp.name}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        ipAddress: '10.24.18.9',
      });
      return inv;
    });

    if (!created) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    broadcastEvent('billing:updated', created);
    res.status(201).json({ invoice: created });
  });

  app.post('/api/admin/invoices/:id/status', requireAuth, requireRole(['admin']), (req: AuthedRequest, res) => {
    const { status } = req.body as { status?: 'Paid' | 'Pending' | 'Overdue' };
    if (!status || !['Paid', 'Pending', 'Overdue'].includes(status)) {
      res.status(400).json({ error: 'Valid invoice status is required' });
      return;
    }

    const updated = dbStore.mutate((db) => {
      const inv = db.invoices.find((i) => i.id === req.params.id);
      if (!inv) return null;
      inv.status = status;
      db.activities.unshift({
        id: `act-${Date.now()}`,
        scope: 'admin',
        type: 'billing',
        message: `Invoice ${inv.id} (${inv.companyName}) marked ${status}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: status,
        tone: status === 'Paid' ? 'emerald' : status === 'Overdue' ? 'red' : 'amber',
      });
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actor: req.authUser!.name,
        role: 'Super Admin',
        action: `Invoice Marked ${status}`,
        target: `${inv.id} · ${inv.companyName}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        ipAddress: '10.24.18.9',
      });
      return inv;
    });

    if (!updated) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    broadcastEvent('billing:updated', updated);
    res.json({ invoice: updated });
  });

  app.post('/api/admin/companies/:id/manage', requireAuth, requireRole(['admin']), (req: AuthedRequest, res) => {
    const { action } = req.body as { action?: 'approve' | 'suspend' | 'activate' | 'renew' };
    if (!action) {
      res.status(400).json({ error: 'Action is required' });
      return;
    }
    const updated = dbStore.mutate((db) => {
      const comp = db.companies.find((c) => c.id === req.params.id);
      if (!comp) return null;
      if (action === 'approve') {
        comp.approvalStatus = 'Approved';
        if (comp.subscriptionStatus === 'Trial') {
          comp.subscriptionStatus = 'Active';
          comp.monthlyFee = comp.planName === 'Enterprise' ? 1450 : 650;
        }
      } else if (action === 'suspend') {
        comp.approvalStatus = 'Suspended';
      } else if (action === 'activate') {
        comp.approvalStatus = 'Approved';
        comp.subscriptionStatus = 'Active';
        if (comp.monthlyFee === 0) comp.monthlyFee = 650;
      } else if (action === 'renew') {
        comp.subscriptionStatus = 'Active';
        comp.approvalStatus = 'Approved';
      }

      db.activities.unshift({
        id: `act-${Date.now()}`,
        scope: 'admin',
        type: 'company',
        message: `Company ${action}d — ${comp.name}`,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(),
        statusLabel: comp.approvalStatus,
        tone: action === 'suspend' ? 'red' : 'emerald',
      });

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actor: req.authUser!.name,
        role: 'Super Admin',
        action: `Company ${action}`,
        target: comp.name,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        ipAddress: '10.24.18.9',
      });

      return comp;
    });

    if (!updated) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    broadcastEvent('company:updated', updated);
    res.json({ company: updated });
  });

  app.post('/api/admin/tickets/:id/resolve', requireAuth, requireRole(['admin']), (req, res) => {
    const updated = dbStore.mutate((db) => {
      const tkt = db.supportTickets.find((t) => t.id === req.params.id);
      if (!tkt) return null;
      tkt.status = 'Resolved';
      tkt.updatedAt = 'Just now';
      return tkt;
    });
    if (!updated) {
      res.status(404).json({ error: 'Support ticket not found' });
      return;
    }
    res.json({ ticket: updated });
  });

  // Vite Dev Middleware or Static Production Serve
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(3000, '0.0.0.0', () => {
    console.log('Sentinel GuardOps server running on http://localhost:3000');
  });
}

startServer().catch((err) => {
  console.error('Failed to start Sentinel GuardOps server:', err);
  process.exit(1);
});
