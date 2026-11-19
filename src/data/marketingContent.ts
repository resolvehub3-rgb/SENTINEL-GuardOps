export interface FeatureItem {
  id: string;
  title: string;
  summary: string;
  details: string;
  iconName:
    | 'Building2'
    | 'ClipboardCheck'
    | 'Smartphone'
    | 'Clock'
    | 'MapPin'
    | 'BookOpen'
    | 'AlertTriangle'
    | 'FileCheck2'
    | 'Users'
    | 'MessageSquare'
    | 'Activity'
    | 'Lock';
  audience: string;
}

export interface PortalShowcaseItem {
  id: 'company' | 'supervisor' | 'guard';
  name: string;
  badgeText: string;
  audience: string;
  headline: string;
  description: string;
  highlights: string[];
}

export interface HowItWorksStep {
  stepNumber: string;
  title: string;
  summary: string;
  bullets: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const TRUST_STRIP_ITEMS = [
  'Guard Attendance & Shift Verification',
  'Digital Occurrence & Incident Reporting',
  'Live Operational Visibility',
  'Structured Multi-Role Dashboards',
];

export const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'company-dashboard',
    title: 'Company Operations Dashboard',
    summary:
      'Centralized command view across active guards, secured locations, open incidents, and attendance rates.',
    details:
      'Monitor daily shift coverage across client locations, inspect attendance trends, review operational alerts, and keep client rosters structured in one place.',
    iconName: 'Building2',
    audience: 'Company Owners & Operations Managers',
  },
  {
    id: 'supervisor-portal',
    title: 'Supervisor Command Portal',
    summary:
      'Dedicated field management workspace to oversee assigned guards, shift schedules, and active alerts.',
    details:
      'Supervisors track guards assigned to their sectors, acknowledge escalated site incidents, inspect occurrence books, and verify incoming duty submissions.',
    iconName: 'ClipboardCheck',
    audience: 'Field Supervisors & Team Leads',
  },
  {
    id: 'guard-mobile',
    title: 'Security Guard Mobile Interface',
    summary:
      'Mobile-first duty portal designed for quick check-ins, clear post instructions, and instant field reporting.',
    details:
      'Guards view assigned locations and shift times, report on duty with one tap, record observations, escalate incidents, upload evidence, and submit end-of-shift handovers.',
    iconName: 'Smartphone',
    audience: 'Field Security Guards',
  },
  {
    id: 'attendance-shifts',
    title: 'Attendance & Shift Tracking',
    summary:
      'Timestamped duty start and shift close records that replace manual paper sign-in sheets.',
    details:
      'Track when each guard reports on duty, monitor active shift timers, record late arrivals or absences, and keep auditable attendance records by location.',
    iconName: 'Clock',
    audience: 'Operations & HR Teams',
  },
  {
    id: 'live-gps',
    title: 'Live Guard Location Monitoring',
    summary:
      'Visual operational map showing active on-duty guards across secured posts and client sites.',
    details:
      'Filter active guards by location, post, or status, inspect last GPS check-in timestamps, and spot stale or unavailable tracking signals immediately.',
    iconName: 'MapPin',
    audience: 'Dispatch & Command Centres',
  },
  {
    id: 'occurrence-book',
    title: 'Digital Occurrence Book',
    summary:
      'Structured daily logbook capturing routine patrols, gate checks, visitor events, and site observations.',
    details:
      'Every observation submitted from the field is timestamped, tied to the guard and post, and immediately visible to supervisors and management.',
    iconName: 'BookOpen',
    audience: 'Guards & Supervisors',
  },
  {
    id: 'incident-reporting',
    title: 'Incident Reporting & Alerts',
    summary:
      'Rapid field incident reporting with severity classification, location tagging, and evidence attachment.',
    details:
      'Classify incidents from Low to Critical, attach site photos, dispatch or acknowledge response steps, and track resolution status until closed.',
    iconName: 'AlertTriangle',
    audience: 'Supervisors & Management',
  },
  {
    id: 'duty-report-review',
    title: 'Duty Report Review & Approval',
    summary:
      'Supervisor verification workflow to finalize accurate shift reports or return incomplete filings.',
    details:
      'End-of-shift handover notes and summaries enter the supervisor review queue where they can be finalized or returned with clear correction notes.',
    iconName: 'FileCheck2',
    audience: 'Supervisors & Quality Control',
  },
  {
    id: 'client-location-mgmt',
    title: 'Client & Location Management',
    summary:
      'Organize client accounts, contract sites, security posts, and guard assignments cleanly.',
    details:
      'Maintain accurate client directories, assign primary supervisors per site, track guard allocation per location, and review site compliance.',
    iconName: 'Users',
    audience: 'Company Management',
  },
  {
    id: 'activity-audit',
    title: 'Shift Handover & Activity Logs',
    summary:
      'Chronological operational timeline preserving shift handovers, escalations, and approvals.',
    details:
      'Maintain a clear operational record of who was on post, what happened during the shift, and which supervisor reviewed the report.',
    iconName: 'Activity',
    audience: 'Operations & Compliance',
  },
  {
    id: 'client-feedback',
    title: 'Client Reviews & Service Visibility',
    summary:
      'Track site-level feedback and service quality trends across active security contracts.',
    details:
      'Combine attendance metrics, incident response, and operational notes to stay proactive with every corporate, residential, or industrial client.',
    iconName: 'MessageSquare',
    audience: 'Company Owners & Client Leads',
  },
  {
    id: 'role-access',
    title: 'Role-Based Access Control',
    summary:
      'Strict workspace isolation separating Company Owners, Supervisors, and Security Guards.',
    details:
      'Each team member receives only the tools and records relevant to their operational role, keeping company data structured and accountable.',
    iconName: 'Lock',
    audience: 'Every Security Company',
  },
];

export const PORTAL_SHOWCASE_ITEMS: PortalShowcaseItem[] = [
  {
    id: 'company',
    name: 'Company Management Dashboard',
    badgeText: 'Owner & Operations View',
    audience: 'For Security Company Owners & Operations Managers',
    headline: 'Complete oversight across every client site and shift.',
    description:
      'Monitor active guard deployment, manage locations and client accounts, track attendance compliance, and oversee operational incidents from one command centre.',
    highlights: [
      'Real-time headcount across active locations and posts',
      'Live GPS operations map with guard post filter controls',
      'Attendance trends, client directory, and operational reporting',
    ],
  },
  {
    id: 'supervisor',
    name: 'Supervisor Dashboard',
    badgeText: 'Field Supervision View',
    audience: 'For Security Supervisors & Sector Leads',
    headline: 'Keep assigned teams coordinated and verify every shift report.',
    description:
      'Inspect assigned guards on duty, review incoming occurrence logs, acknowledge urgent incidents, and approve or return end-of-shift reports.',
    highlights: [
      'Assigned guard roster and live post status monitoring',
      'Incident attention queue with severity prioritization',
      'One-click shift report finalization or return-for-correction',
    ],
  },
  {
    id: 'guard',
    name: 'Security Guard Mobile App',
    badgeText: 'Field Mobile Interface',
    audience: 'For Guards on Post Across Mobile Devices',
    headline: 'Built for speed and clarity in the field.',
    description:
      'A focused mobile experience that lets guards report on duty in seconds, log occurrence book entries, escalate incidents with photos, and close shifts cleanly.',
    highlights: [
      'Large tap targets for Report On Duty and live shift timer',
      'Fast observation logging, incident alerts, and photo uploads',
      'Guided shift closing with handover notes and summary review',
    ],
  },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    stepNumber: '01',
    title: 'Register Your Company',
    summary:
      'Create your Sentinel GuardOps company account and initialize your private operational workspace.',
    bullets: [
      'Submit your security company name, primary contact details, and credentials',
      'Gain immediate access to your Company Operations Dashboard',
      'Centralize all sites, supervisors, and guards under one company account',
    ],
  },
  {
    stepNumber: '02',
    title: 'Set Up Locations, Supervisors & Guards',
    summary:
      'Structure your client sites, define guard posts, and assign supervisors and security personnel.',
    bullets: [
      'Register client organizations and individual secured locations',
      'Add field supervisors and assign them to sectors or client sites',
      'Assign guards to locations, posts, and scheduled day or night shifts',
    ],
  },
  {
    stepNumber: '03',
    title: 'Guards Report & Log Field Operations',
    summary:
      'Field personnel use the mobile-friendly guard portal throughout their scheduled shift.',
    bullets: [
      'Guards tap Report On Duty at post start with live shift timer tracking',
      'Routine checks are logged directly into the Digital Occurrence Book',
      'Incidents and site observations are captured with severity and photo evidence',
    ],
  },
  {
    stepNumber: '04',
    title: 'Supervisors Verify & Management Tracks Everything',
    summary:
      'Close the operational loop with structured report reviews and executive site visibility.',
    bullets: [
      'Supervisors review incoming incidents and finalize end-of-shift reports',
      'Incomplete shift filings can be returned with clear correction reasons',
      'Company management views clean attendance, incident, and site activity data',
    ],
  },
];

export const WHY_CHOOSE_ITEMS = [
  {
    title: 'Built Specifically for Security Companies',
    description:
      'Designed around real guard posts, shift handovers, occurrence books, and supervisor reviews—not generic HR software.',
  },
  {
    title: 'Replaces Paper Logbooks & Scattered Chats',
    description:
      'Move occurrence books, attendance rosters, and incident photos out of fragile notebooks and unorganized messaging threads.',
  },
  {
    title: 'Real-Time Operational Visibility',
    description:
      'Know which guards are on duty, which sites have open alerts, and which shift reports still await supervisor sign-off.',
  },
  {
    title: 'Clear Guard & Supervisor Accountability',
    description:
      'Every check-in, observation, incident update, and report approval is timestamped and linked to an authorized user.',
  },
  {
    title: 'Simple Flat Pricing Without Per-Guard Penalties',
    description:
      'Pay one predictable company rate of GH₵150 per month as you grow your workforce, sites, and client roster.',
  },
  {
    title: 'Fast Onboarding for Field & Office Teams',
    description:
      'Clean role-specific views mean guards need minimal instruction on mobile while management gets instant clarity.',
  },
];

export const COMPLETE_PLAN_INCLUDES = [
  'Company Operations Dashboard',
  'Supervisor Field Command Dashboard',
  'Mobile-Optimized Security Guard Portal',
  'Attendance & Shift Tracking',
  'Digital Occurrence Book',
  'Incident Reporting & Evidence Uploads',
  'Live Guard Location Monitoring Map',
  'Duty Report Review & Finalization Queue',
  'Client & Location Management',
  'Role-Based Access Control',
  'Platform Updates & Ongoing Support',
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is Sentinel GuardOps?',
    answer:
      'Sentinel GuardOps is a B2B security operations management platform developed by Samley Technologies. It equips private security companies with centralized dashboards for management, supervisors, and field guards to manage sites, attendance, occurrence books, incidents, and shift reports.',
  },
  {
    question: 'Who is Sentinel GuardOps designed for?',
    answer:
      'It is built specifically for private security companies, security company owners, operations managers, field supervisors, and deployed security guards managing commercial, residential, industrial, or institutional sites.',
  },
  {
    question: 'Does my security company need technical expertise to use it?',
    answer:
      'No. Each role sees only the tools needed for their daily work. Company management gets a clean web console, supervisors review incoming field activity from one screen, and guards operate from simple tap buttons on their mobile phone.',
  },
  {
    question: 'How do guards use the platform on duty?',
    answer:
      'Guards open the mobile-friendly Security Guard Portal on their smartphone, confirm their assigned post and shift window, tap Report On Duty to start their shift, log Digital Occurrence Book observations or incidents during duty, and close their shift with handover notes.',
  },
  {
    question: 'Can supervisors monitor guards across multiple locations?',
    answer:
      'Yes. Supervisors view every guard assigned to their sector across client sites, monitor active on-duty status on the live map, inspect occurrence logs, acknowledge urgent incidents, and approve or return shift reports.',
  },
  {
    question: 'How does the subscription pricing work?',
    answer:
      'Sentinel GuardOps is offered under one clear plan: GH₵150 per month per security company. There are no confusing pricing tiers or complex per-guard fee calculations.',
  },
  {
    question: 'Is GH₵150 per guard or per company?',
    answer:
      'It is GH₵150 per month for your entire security company subscription, covering your company management dashboard, supervisor dashboard, and guard mobile operations.',
  },
  {
    question: 'Can we manage multiple clients and security locations?',
    answer:
      'Yes. Within your Company Management Dashboard you can register multiple client organizations, configure individual security locations and guard posts, and track attendance and incidents per site.',
  },
  {
    question: 'Does Sentinel GuardOps work on smartphones and desktop computers?',
    answer:
      'Yes. The Company Management and Supervisor portals are optimized for desktop and laptop command screens while remaining responsive on tablets, and the Security Guard portal is purposefully engineered for smartphones.',
  },
  {
    question: 'How do we register our security company?',
    answer:
      'Click "Register Your Company" anywhere on this website, complete the company registration form with your company name, primary contact details, and password, and your company workspace is ready immediately.',
  },
];
