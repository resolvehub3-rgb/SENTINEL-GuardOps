import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileCheck2,
  MapPin,
  Shield,
  Users,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { StatusBadge } from '../common/StatusBadge';
import { OperationsMap } from '../common/OperationsMap';
import type { GuardRecord } from '../../types/guardops';

const SHOWCASE_GUARDS: GuardRecord[] = [
  {
    id: 'showcase-g1',
    companyId: 'showcase',
    name: 'David Boateng',
    employeeId: 'STG-104',
    avatar: '',
    phone: '',
    status: 'On Duty',
    trackingState: 'On Duty',
    locationId: 'loc-1',
    locationName: 'Riverside Commercial Complex',
    postName: 'Main Gate',
    supervisorId: 'sup-1',
    supervisorName: 'Marcus Mensah',
    shiftType: 'Day',
    shiftWindow: '06:00 AM - 02:00 PM',
    shiftStartTime: null,
    lastActivity: 'Checked in at Main Gate',
    lastGpsUpdate: 'Live',
    gpsAccuracyMeters: 8,
    mapX: 34,
    mapY: 42,
    attendanceScore: 98,
  },
  {
    id: 'showcase-g2',
    companyId: 'showcase',
    name: 'Priya Mensah',
    employeeId: 'STG-109',
    avatar: '',
    phone: '',
    status: 'On Duty',
    trackingState: 'On Duty',
    locationId: 'loc-2',
    locationName: 'Central Corporate Plaza',
    postName: 'Reception Desk',
    supervisorId: 'sup-1',
    supervisorName: 'Marcus Mensah',
    shiftType: 'Day',
    shiftWindow: '06:00 AM - 02:00 PM',
    shiftStartTime: null,
    lastActivity: 'Patrol verified',
    lastGpsUpdate: 'Live',
    gpsAccuracyMeters: 10,
    mapX: 56,
    mapY: 50,
    attendanceScore: 99,
  },
  {
    id: 'showcase-g3',
    companyId: 'showcase',
    name: 'Isaac Owusu',
    employeeId: 'STG-118',
    avatar: '',
    phone: '',
    status: 'On Duty',
    trackingState: 'Location Stale',
    locationId: 'loc-3',
    locationName: 'Metro Logistics Depot',
    postName: 'North Perimeter',
    supervisorId: 'sup-1',
    supervisorName: 'Marcus Mensah',
    shiftType: 'Day',
    shiftWindow: '06:00 AM - 02:00 PM',
    shiftStartTime: null,
    lastActivity: 'Gate verification logged',
    lastGpsUpdate: '12m ago',
    gpsAccuracyMeters: 22,
    mapX: 70,
    mapY: 36,
    attendanceScore: 94,
  },
];

interface PreviewKpiTileProps {
  label: string;
  value: string;
  tone: 'navy' | 'emerald' | 'amber' | 'indigo';
  icon: typeof Shield;
}

const PREVIEW_TONE_CLASSES: Record<PreviewKpiTileProps['tone'], string> = {
  navy: 'bg-[#10213D] border-[#1E355C] text-white',
  emerald: 'bg-[#10A878] border-[#16BC87] text-white',
  amber: 'bg-[#F5820D] border-[#FB9832] text-white',
  indigo: 'bg-[#6B4CE6] border-[#8065EC] text-white',
};

function PreviewKpiTile({ label, value, tone, icon: Icon }: PreviewKpiTileProps) {
  return (
    <div className={`rounded-xl border p-2.5 sm:p-3 ${PREVIEW_TONE_CLASSES[tone]}`}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-white/85 whitespace-nowrap">{label}</p>
          <p className="text-base sm:text-lg font-bold tracking-tight tabular-nums text-white leading-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HeroProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* Desktop Command Preview Frame */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1E355C] bg-white dark:bg-[#0E1A32] shadow-2xl overflow-hidden">
        {/* Browser Chrome */}
        <div className="h-9 px-4 bg-[#10213D] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500/60" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300">
            Company Operations Dashboard
          </span>
          <span className="text-[11px] font-semibold text-[#10A878]">Live View</span>
        </div>

        {/* App Shell */}
        <div className="p-4 sm:p-5 bg-[#F1F5F9] dark:bg-[#0B1324] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <BrandLogo size="sm" lightText={false} />
            <StatusBadge label="Operations Active" compact />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <PreviewKpiTile label="On Duty" value="248" tone="navy" icon={Shield} />
            <PreviewKpiTile label="Locations" value="42" tone="emerald" icon={MapPin} />
            <PreviewKpiTile label="Incidents" value="7" tone="amber" icon={AlertTriangle} />
            <PreviewKpiTile label="Attendance" value="96%" tone="indigo" icon={Clock} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Live Guard Locations
                </p>
                <span className="text-[11px] font-semibold text-[#10A878]">On Duty Only</span>
              </div>
              <OperationsMap guards={SHOWCASE_GUARDS} heightClass="h-44" showLegend={false} />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-3 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white mb-2.5">
                  Recent Activity
                </p>
                <div className="space-y-2.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0D182D] border border-slate-100 dark:border-[#1E2E4A]">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      Guard reported on duty
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Riverside Complex · Main Gate
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0D182D] border border-slate-100 dark:border-[#1E2E4A]">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      Shift report finalized
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Verified by Supervisor
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0D182D] border border-slate-100 dark:border-[#1E2E4A]">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      Occurrence entry logged
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Central Plaza · Patrol Complete
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlapping Mobile Guard App Frame on Large Screens */}
      <div className="hidden sm:block sm:w-60 sm:ml-auto sm:-mt-28 sm:mr-3 relative z-10 rounded-2xl border-2 border-[#1E355C] bg-[#0B1324] shadow-2xl overflow-hidden">
        <div className="h-7 px-3 bg-[#10213D] flex items-center justify-between border-b border-white/10">
          <span className="text-[11px] font-bold text-white">Guard Mobile</span>
          <span className="text-[11px] font-semibold text-[#10A878]">On Duty</span>
        </div>
        <div className="p-3 space-y-2.5 text-white">
          <div className="rounded-lg bg-[#10213D] p-2.5 border border-[#1E355C]">
            <p className="text-[11px] text-slate-300">Assigned Post</p>
            <p className="text-xs font-bold mt-0.5 truncate">Main Gate · Day Shift</p>
          </div>
          <div className="h-9 rounded-lg bg-[#10A878] flex items-center justify-center gap-1.5 text-xs font-bold text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>REPORT ON DUTY</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="rounded-lg bg-[#121E36] border border-[#1E2E4A] p-2 text-center font-semibold">
              Observation
            </div>
            <div className="rounded-lg bg-[#121E36] border border-[#1E2E4A] p-2 text-center font-semibold">
              Incident
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PortalFrameProps {
  portalId: 'company' | 'supervisor' | 'guard';
}

export function PortalMockupFrame({ portalId }: PortalFrameProps) {
  if (portalId === 'company') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-[#F1F5F9] dark:bg-[#0B1324] p-4 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2E4A] pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#10A878]" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Security Company Management Console
            </span>
          </div>
          <StatusBadge label="Live Workspace" compact />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PreviewKpiTile label="On Duty" value="248" tone="navy" icon={Shield} />
          <PreviewKpiTile label="Locations" value="42" tone="emerald" icon={MapPin} />
          <PreviewKpiTile label="Incidents" value="7" tone="amber" icon={AlertTriangle} />
          <PreviewKpiTile label="Attendance" value="96%" tone="indigo" icon={Users} />
        </div>
        <OperationsMap guards={SHOWCASE_GUARDS} heightClass="h-56" />
      </div>
    );
  }

  if (portalId === 'supervisor') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-[#F1F5F9] dark:bg-[#0B1324] p-4 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2E4A] pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[#10A878]" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Supervisor Command &amp; Report Review
            </span>
          </div>
          <StatusBadge label="Field Ops" compact />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PreviewKpiTile label="Assigned" value="32" tone="navy" icon={Users} />
          <PreviewKpiTile label="On Duty" value="30" tone="emerald" icon={CheckCircle2} />
          <PreviewKpiTile label="Open Alerts" value="3" tone="amber" icon={AlertTriangle} />
          <PreviewKpiTile label="Review Queue" value="3" tone="indigo" icon={FileCheck2} />
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] divide-y divide-slate-200 dark:divide-[#1E2E4A]">
          {[
            {
              title: 'Day Shift Report · Riverside Commercial Complex',
              status: 'Awaiting Review',
            },
            {
              title: 'Perimeter Access Check · Central Corporate Plaza',
              status: 'Finalized',
            },
            {
              title: 'Gate Incident Follow-up · Metro Logistics Depot',
              status: 'Investigating',
            },
          ].map((row) => (
            <div key={row.title} className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {row.title}
              </span>
              <StatusBadge label={row.status} compact />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-2">
      <div className="w-full max-w-[340px] rounded-3xl border-4 border-[#10213D] bg-[#0B1324] text-white p-4 shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <BrandLogo size="sm" lightText />
          <StatusBadge label="On Duty" compact />
        </div>
        <div className="rounded-xl bg-[#121E36] border border-[#1E355C] p-3.5 space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Assigned Site &amp; Post</p>
          <p className="text-sm font-bold text-white">Riverside Commercial Complex</p>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <span>Main Entrance Gate</span>
            <span className="font-mono-tabular text-[#10A878] font-bold">06:00 – 14:00</span>
          </div>
        </div>
        <div className="h-11 rounded-xl bg-[#10A878] text-white text-xs font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>REPORT ON DUTY</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-[#121E36] border border-[#1E2E4A] p-3 flex flex-col items-center gap-1.5 text-center">
            <BookOpen className="w-4 h-4 text-[#10A878]" />
            <span className="text-xs font-semibold">Record Observation</span>
          </div>
          <div className="rounded-xl bg-[#121E36] border border-[#1E2E4A] p-3 flex flex-col items-center gap-1.5 text-center">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold">Report Incident</span>
          </div>
          <div className="rounded-xl bg-[#121E36] border border-[#1E2E4A] p-3 flex flex-col items-center gap-1.5 text-center">
            <Camera className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold">Capture Evidence</span>
          </div>
          <div className="rounded-xl bg-[#121E36] border border-[#1E2E4A] p-3 flex flex-col items-center gap-1.5 text-center">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">Close Shift</span>
          </div>
        </div>
      </div>
    </div>
  );
}
