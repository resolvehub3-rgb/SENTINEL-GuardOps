import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck2,
  History,
  Home,
  LogOut,
  MapPin,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  User,
  Video,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useRealtime } from '../../context/RealtimeContext';
import { apiRequest } from '../../services/api';
import {
  formatShiftDuration,
  validateIncidentInput,
  validateOccurrenceInput,
  validateShiftCloseInput,
} from '../../utils/operations';
import type {
  GuardRecord,
  GuardShiftHistoryItem,
  IncidentRecord,
  IncidentSeverity,
  OccurrenceCategory,
  OccurrenceRecord,
} from '../../types/guardops';

interface GuardStatePayload {
  guard: GuardRecord;
  isOnDuty: boolean;
  shiftStartedIso: string | null;
  todayOccurrences: OccurrenceRecord[];
  todayIncidents: IncidentRecord[];
  shiftHistory: GuardShiftHistoryItem[];
  evidenceSampleUrl: string;
}

type BottomTab = 'home' | 'occurrences' | 'incidents' | 'history' | 'profile';
type HomeActionView = 'main' | 'record-observation' | 'report-incident' | 'capture-evidence' | 'close-shift' | 'shift-submitted';

const OCCURRENCE_CATEGORIES: OccurrenceCategory[] = [
  'Routine Patrol',
  'Visitor',
  'Vehicle',
  'Suspicious Activity',
  'Security Check',
  'Handover',
  'Equipment',
  'Other',
];

const INCIDENT_TYPES = [
  'Theft',
  'Unauthorized Entry',
  'Assault',
  'Property Damage',
  'Fire',
  'Medical Emergency',
  'Suspicious Activity',
  'Safety Violation',
  'Other',
];

const SEVERITIES: IncidentSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

export function GuardMobilePortal() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [state, setState] = useState<GuardStatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomTab>('home');
  const [actionView, setActionView] = useState<HomeActionView>('main');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);

  // Evidence capture state
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [capturedEvidence, setCapturedEvidence] = useState<{
    url: string;
    type: 'photo' | 'video';
    capturedAt: string;
  } | null>(null);

  // Observation Form
  const [occCategory, setOccCategory] = useState<OccurrenceCategory>('Routine Patrol');
  const [occDescription, setOccDescription] = useState('');
  const [occError, setOccError] = useState<string | null>(null);
  const [occSuccess, setOccSuccess] = useState(false);

  // Incident Form
  const [incType, setIncType] = useState('Unauthorized Entry');
  const [incSeverity, setIncSeverity] = useState<IncidentSeverity>('High');
  const [incLocation, setIncLocation] = useState('');
  const [incDescription, setIncDescription] = useState('');
  const [incError, setIncError] = useState<string | null>(null);
  const [incSuccess, setIncSuccess] = useState(false);

  // Close Shift Form
  const [handoverNotes, setHandoverNotes] = useState('');
  const [finalSummary, setFinalSummary] = useState('');
  const [reviewedConfirmed, setReviewedConfirmed] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    try {
      const res = await apiRequest<GuardStatePayload>('/api/guard/state');
      setState(res);
      setIncLocation((prev) => prev || `${res.guard.locationName} — ${res.guard.postName}`);
    } catch (err) {
      showToast({
        title: 'Failed to load guard duty state',
        description: err instanceof Error ? err.message : 'Network error',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useRealtime((event) => {
    if (event.startsWith('report:') || event.startsWith('duty:')) {
      void loadState();
    }
  });

  const handleReportOnDuty = async () => {
    setSubmitting(true);
    try {
      await apiRequest('/api/guard/report-duty', { method: 'POST' });
      await loadState();
      showToast({
        title: 'Reported On Duty',
        description: 'Shift timer and simulated post tracking are now active.',
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Unable to report on duty',
        description: err instanceof Error ? err.message : 'Error',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateOccurrenceInput({ category: occCategory, description: occDescription });
    if (!check.valid) {
      setOccError(check.error ?? 'Invalid occurrence input');
      return;
    }
    setOccError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/guard/occurrences', {
        method: 'POST',
        body: JSON.stringify({
          category: occCategory,
          description: occDescription,
          evidenceUrl: capturedEvidence?.url,
          evidenceType: capturedEvidence?.type,
        }),
      });
      setOccDescription('');
      setCapturedEvidence(null);
      setOccSuccess(true);
      await loadState();
      window.setTimeout(() => {
        setOccSuccess(false);
        setActionView('main');
      }, 1500);
    } catch (err) {
      setOccError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateIncidentInput({
      type: incType,
      severity: incSeverity,
      locationName: incLocation,
      description: incDescription,
    });
    if (!check.valid) {
      setIncError(check.error ?? 'Invalid incident input');
      return;
    }
    setIncError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/guard/incidents', {
        method: 'POST',
        body: JSON.stringify({
          type: incType,
          severity: incSeverity,
          locationName: incLocation,
          description: incDescription,
          evidenceUrl: capturedEvidence?.url,
        }),
      });
      setIncDescription('');
      setCapturedEvidence(null);
      setIncSuccess(true);
      await loadState();
      window.setTimeout(() => {
        setIncSuccess(false);
        setActionView('main');
      }, 1500);
    } catch (err) {
      setIncError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateShiftCloseInput({
      handoverNotes,
      finalSummary,
      reviewedConfirmed,
    });
    if (!check.valid) {
      setCloseError(check.error ?? 'Review required fields');
      return;
    }
    setCloseError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/guard/close-shift', {
        method: 'POST',
        body: JSON.stringify({ handoverNotes, finalSummary, reviewedConfirmed }),
      });
      setHandoverNotes('');
      setFinalSummary('');
      setReviewedConfirmed(false);
      await loadState();
      setActionView('shift-submitted');
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : 'Close shift failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedTime = new Date(nowMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedDate = new Date(nowMs).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const cardCls =
    'rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-4';

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0B1324] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Compact Mobile Top App Bar (52px) */}
      <header className="sticky top-0 z-30 h-[52px] bg-[#10213D] text-white border-b border-[#1D355D] px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {bottomTab === 'home' && actionView !== 'main' && actionView !== 'shift-submitted' ? (
            <button
              type="button"
              onClick={() => setActionView('main')}
              aria-label="Back to active duty"
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <BrandLogo size="sm" lightText />
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Sign out of Guard Mobile"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Mobile-First Scrollable Content */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-24">
        {loading || !state ? (
          <LoadingSkeleton rows={5} />
        ) : bottomTab === 'home' ? (
          <>
            {actionView === 'shift-submitted' ? (
              <div className={`${cardCls} text-center py-8 space-y-4`}>
                <div className="w-16 h-16 rounded-full bg-[#10A878]/15 text-[#10A878] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-lg font-bold">Final Shift Report Submitted</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your shift report has been queued for supervisor review ({state.guard.supervisorName}) and logged in your duty history.
                </p>
                <button
                  type="button"
                  onClick={() => setActionView('main')}
                  className="w-full min-h-[48px] rounded-xl bg-[#10A878] hover:bg-[#0D9468] text-white text-sm font-bold"
                >
                  Done
                </button>
              </div>
            ) : !state.isOnDuty ? (
              /* FIRST SCREEN: REPORT ON DUTY */
              <div className="space-y-4">
                <div className={cardCls}>
                  <div className="flex items-center gap-3.5">
                    <img
                      src={state.guard.avatar}
                      alt={state.guard.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#10A878]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {state.guard.name}
                      </p>
                      <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                        {state.guard.employeeId}
                      </p>
                      <div className="mt-1">
                        <StatusBadge label="Off Duty · Ready" tone="amber" compact />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1D2D4A] space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                        <MapPin className="w-3.5 h-3.5 text-[#10A878]" />
                        Assigned Post
                      </span>
                      <span className="font-bold text-right truncate">
                        {state.guard.locationName} · {state.guard.postName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                        <User className="w-3.5 h-3.5 text-[#10A878]" />
                        Supervisor
                      </span>
                      <span className="font-semibold whitespace-nowrap">{state.guard.supervisorName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-[#10A878]" />
                        Scheduled Shift
                      </span>
                      <span className="font-mono-tabular font-semibold whitespace-nowrap">
                        {state.guard.shiftWindow}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400 shrink-0 whitespace-nowrap">Date & Time</span>
                      <span className="font-mono-tabular font-semibold whitespace-nowrap">
                        {formattedDate} · {formattedTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dominant Primary Action */}
                <div className={`${cardCls} space-y-3`}>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-center">
                    Confirm your assigned location and report on duty to begin your shift.
                  </p>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleReportOnDuty()}
                    className="w-full min-h-[56px] rounded-xl bg-[#10A878] hover:bg-[#0E9369] active:scale-[0.99] text-white text-base font-extrabold tracking-wide shadow-lg shadow-[#10A878]/20 transition-all cursor-pointer"
                  >
                    {submitting ? 'STARTING SHIFT...' : 'REPORT ON DUTY'}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center">
                    Prototype simulation: location confirmation updates duty state without live GPS hardware.
                  </p>
                </div>
              </div>
            ) : actionView === 'main' ? (
              /* ACTIVE DUTY SCREEN */
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#10213D] text-white p-5 border border-[#1E355C] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#10A878]" />
                      <span className="text-sm font-bold text-[#10A878]">On Duty Active</span>
                    </div>
                    <span className="font-mono-tabular text-sm font-bold bg-white/10 px-2.5 py-1 rounded-lg">
                      {formatShiftDuration(state.shiftStartedIso, nowMs)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400 block">Assigned Post</span>
                      <span className="font-bold">
                        {state.guard.locationName} · {state.guard.postName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Supervisor</span>
                      <span className="font-bold">{state.guard.supervisorName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Shift Started</span>
                      <span className="font-mono-tabular font-semibold">
                        {state.guard.shiftStartTime ?? formattedTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tracking State</span>
                      <span className="font-semibold text-emerald-300">
                        Active (Prototype)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Prominent Quick Action Cards */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActionView('record-observation')}
                      className={`${cardCls} min-h-[120px] flex flex-col items-center justify-center text-center gap-2.5 hover:border-[#10A878] active:scale-[0.98] transition-all cursor-pointer`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-blue-500/12 text-blue-500 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Record Observation</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionView('report-incident')}
                      className={`${cardCls} min-h-[120px] flex flex-col items-center justify-center text-center gap-2.5 hover:border-red-500 active:scale-[0.98] transition-all cursor-pointer`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-red-500/12 text-red-500 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Report Incident</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionView('capture-evidence')}
                      className={`${cardCls} min-h-[120px] flex flex-col items-center justify-center text-center gap-2.5 hover:border-indigo-500 active:scale-[0.98] transition-all cursor-pointer`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-indigo-500/12 text-indigo-500 flex items-center justify-center">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Capture Evidence</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionView('close-shift')}
                      className={`${cardCls} min-h-[120px] flex flex-col items-center justify-center text-center gap-2.5 hover:border-[#10A878] active:scale-[0.98] transition-all cursor-pointer`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#10A878]/12 text-[#10A878] flex items-center justify-center">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Close Shift</span>
                    </button>
                  </div>
                </div>

                {/* Shift Quick Summary */}
                <div className={`${cardCls} flex items-center justify-between text-xs`}>
                  <div>
                    <span className="text-slate-400">Logged This Shift: </span>
                    <span className="font-bold tabular-nums">
                      {state.todayOccurrences.length} observations · {state.todayIncidents.length} incidents
                    </span>
                  </div>
                  {capturedEvidence && (
                    <span className="text-[#10A878] font-semibold">1 evidence ready</span>
                  )}
                </div>
              </div>
            ) : actionView === 'record-observation' ? (
              /* RECORD OBSERVATION FORM */
              <div className={cardCls}>
                {occSuccess ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-[#10A878] mx-auto" />
                    <h3 className="text-base font-bold">Observation Recorded</h3>
                    <p className="text-xs text-slate-400">Returning to Active Duty...</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => void handleSubmitOccurrence(e)} className="space-y-4">
                    <div>
                      <h2 className="text-base font-bold">Record Observation</h2>
                      <p className="text-xs text-slate-400">
                        {state.guard.name} · {state.guard.locationName} · {formattedTime}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D182D] border border-slate-200 dark:border-[#1E2E4A] text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <p>Post: {state.guard.postName} ({state.guard.shiftType} Shift)</p>
                      <p>GPS Context: {state.guard.locationName} (Simulated Prototype Check-in)</p>
                    </div>

                    <div>
                      <label htmlFor="occ-cat" className="block text-xs font-semibold mb-1.5">
                        Occurrence Category
                      </label>
                      <select
                        id="occ-cat"
                        value={occCategory}
                        onChange={(e) => setOccCategory(e.target.value as OccurrenceCategory)}
                        className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm"
                      >
                        {OCCURRENCE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="occ-desc" className="block text-xs font-semibold mb-1.5">
                        Observation Description
                      </label>
                      <textarea
                        id="occ-desc"
                        rows={4}
                        value={occDescription}
                        onChange={(e) => setOccDescription(e.target.value)}
                        placeholder="Describe patrol findings, visitor entry, or gate status..."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm"
                      />
                    </div>

                    {capturedEvidence && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[#10A878]/40 bg-[#10A878]/10">
                        <img
                          src={capturedEvidence.url}
                          alt="Attached evidence"
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-bold">Evidence Attached ({capturedEvidence.type})</p>
                          <p className="text-slate-400">{capturedEvidence.capturedAt}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCapturedEvidence(null)}
                          className="text-xs text-red-400 font-semibold px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {occError && (
                      <p role="alert" className="text-xs font-medium text-red-500">
                        {occError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full min-h-[50px] rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-sm font-bold"
                    >
                      {submitting ? 'Submitting...' : 'Submit Occurrence'}
                    </button>
                  </form>
                )}
              </div>
            ) : actionView === 'report-incident' ? (
              /* REPORT INCIDENT FORM */
              <div className={cardCls}>
                {incSuccess ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-[#10A878] mx-auto" />
                    <h3 className="text-base font-bold">Incident Reported</h3>
                    <p className="text-xs text-slate-400">
                      Supervisor and Company Command notified.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={(e) => void handleSubmitIncident(e)} className="space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-red-500 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Report Security Incident
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Immediate escalation to supervisor {state.guard.supervisorName}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="inc-type" className="block text-xs font-semibold mb-1.5">
                        Incident Type
                      </label>
                      <select
                        id="inc-type"
                        value={incType}
                        onChange={(e) => setIncType(e.target.value)}
                        className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm"
                      >
                        {INCIDENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold mb-1.5">Severity Level</span>
                      <div className="grid grid-cols-4 gap-2">
                        {SEVERITIES.map((sev) => {
                          const active = incSeverity === sev;
                          const color =
                            sev === 'Critical'
                              ? active
                                ? 'bg-red-600 text-white border-red-600'
                                : 'border-red-500/30 text-red-500'
                              : sev === 'High'
                                ? active
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'border-amber-500/30 text-amber-500'
                                : active
                                  ? 'bg-[#10213D] text-white border-[#10A878]'
                                  : 'border-slate-200 dark:border-[#24395D]';
                          return (
                            <button
                              key={sev}
                              type="button"
                              onClick={() => setIncSeverity(sev)}
                              className={`min-h-[44px] rounded-xl border text-xs font-bold transition-colors ${color}`}
                            >
                              {sev}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="inc-loc" className="block text-xs font-semibold mb-1.5">
                        Incident Location
                      </label>
                      <input
                        id="inc-loc"
                        value={incLocation}
                        onChange={(e) => setIncLocation(e.target.value)}
                        className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="inc-desc" className="block text-xs font-semibold mb-1.5">
                        Incident Description
                      </label>
                      <textarea
                        id="inc-desc"
                        rows={4}
                        value={incDescription}
                        onChange={(e) => setIncDescription(e.target.value)}
                        placeholder="Provide clear factual details of what occurred..."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm"
                      />
                    </div>

                    {capturedEvidence && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[#10A878]/40 bg-[#10A878]/10">
                        <img
                          src={capturedEvidence.url}
                          alt="Incident evidence"
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-bold">Evidence Ready ({capturedEvidence.type})</p>
                          <p className="text-slate-400">{capturedEvidence.capturedAt}</p>
                        </div>
                      </div>
                    )}

                    {incError && (
                      <p role="alert" className="text-xs font-medium text-red-500">
                        {incError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full min-h-[50px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold"
                    >
                      {submitting ? 'Submitting...' : 'Submit Incident'}
                    </button>
                  </form>
                )}
              </div>
            ) : actionView === 'capture-evidence' ? (
              /* CAPTURE EVIDENCE INTERFACE */
              <div className={`${cardCls} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold">Capture Evidence</h2>
                    <p className="text-[11px] text-slate-400">
                      Prototype camera preview (simulated hardware capture)
                    </p>
                  </div>
                  <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0D182D]">
                    <button
                      type="button"
                      onClick={() => setCaptureMode('photo')}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
                        captureMode === 'photo' ? 'bg-[#10A878] text-white' : 'text-slate-400'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" /> Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptureMode('video')}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
                        captureMode === 'video' ? 'bg-[#10A878] text-white' : 'text-slate-400'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" /> Video
                    </button>
                  </div>
                </div>

                {/* Camera Preview / Captured Frame */}
                <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-[#24395D] bg-slate-950 h-56">
                  <img
                    src={state.evidenceSampleUrl}
                    alt="Perimeter gate camera preview"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${
                      capturedEvidence ? 'opacity-100' : 'opacity-80'
                    }`}
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/65 text-white text-[11px] font-mono-tabular">
                    {capturedEvidence
                      ? `CAPTURED ${capturedEvidence.type.toUpperCase()} · ${capturedEvidence.capturedAt}`
                      : `${captureMode.toUpperCase()} VIEWFINDER · ${state.guard.postName}`}
                  </div>
                </div>

                {!capturedEvidence ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCapturedEvidence({
                        url: state.evidenceSampleUrl,
                        type: captureMode,
                        capturedAt: new Date().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                      })
                    }
                    className="w-full min-h-[50px] rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {captureMode === 'photo' ? <Camera className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    <span>{captureMode === 'photo' ? 'Capture Photo' : 'Record Video Clip'}</span>
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActionView('record-observation')}
                        className="min-h-[46px] rounded-xl bg-[#10213D] border border-[#10A878] text-white text-xs font-bold px-3"
                      >
                        Attach to Occurrence
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionView('report-incident')}
                        className="min-h-[46px] rounded-xl bg-red-600 text-white text-xs font-bold px-3"
                      >
                        Attach to Incident
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCapturedEvidence(null)}
                      className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-[#24395D] text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retake
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* CLOSE SHIFT WORKFLOW */
              <div className={cardCls}>
                <form onSubmit={(e) => void handleCloseShift(e)} className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold">Close Shift & Final Report</h2>
                    <p className="text-xs text-slate-400">
                      Review shift records before submitting to {state.guard.supervisorName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D182D] border border-slate-200 dark:border-[#1E2E4A] text-xs">
                    <div>
                      <span className="text-slate-400 block">Shift Start</span>
                      <span className="font-mono-tabular font-bold">
                        {state.guard.shiftStartTime ?? '06:00 AM'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Location</span>
                      <span className="font-bold">{state.guard.locationName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Occurrences</span>
                      <span className="font-bold tabular-nums">{state.todayOccurrences.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Incidents</span>
                      <span className="font-bold tabular-nums">{state.todayIncidents.length}</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="close-handover" className="block text-xs font-semibold mb-1.5">
                      Handover Notes
                    </label>
                    <textarea
                      id="close-handover"
                      rows={3}
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      placeholder="Keys, radio equipment, visitor badges, and gate status for relief guard..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="close-summary" className="block text-xs font-semibold mb-1.5">
                      Final Shift Summary
                    </label>
                    <textarea
                      id="close-summary"
                      rows={3}
                      value={finalSummary}
                      onChange={(e) => setFinalSummary(e.target.value)}
                      placeholder="Overall shift summary for supervisor review..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewedConfirmed}
                      onChange={(e) => setReviewedConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#10A878]"
                    />
                    <span>
                      I confirm I have reviewed my final shift summary, occurrences, and handover notes.
                    </span>
                  </label>

                  {closeError && (
                    <p role="alert" className="text-xs font-medium text-red-500">
                      {closeError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[50px] rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-sm font-bold"
                  >
                    {submitting ? 'Submitting...' : 'Submit Final Shift Report'}
                  </button>
                </form>
              </div>
            )}
          </>
        ) : bottomTab === 'occurrences' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">My Occurrences</h2>
              {state.isOnDuty && (
                <button
                  type="button"
                  onClick={() => {
                    setBottomTab('home');
                    setActionView('record-observation');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#10A878] text-white text-xs font-semibold"
                >
                  + Record
                </button>
              )}
            </div>
            {state.todayOccurrences.length === 0 ? (
              <div className={cardCls}>
                <p className="text-xs text-slate-400 text-center py-4">
                  No occurrences recorded by you yet.
                </p>
              </div>
            ) : (
              state.todayOccurrences.map((occ) => (
                <div key={occ.id} className={cardCls}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#10A878]">{occ.category}</span>
                    <StatusBadge label={occ.status} compact />
                  </div>
                  <p className="text-sm font-semibold mt-1">{occ.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{occ.createdAt}</p>
                </div>
              ))
            )}
          </div>
        ) : bottomTab === 'incidents' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">My Incidents</h2>
              {state.isOnDuty && (
                <button
                  type="button"
                  onClick={() => {
                    setBottomTab('home');
                    setActionView('report-incident');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
                >
                  + Report
                </button>
              )}
            </div>
            {state.todayIncidents.length === 0 ? (
              <div className={cardCls}>
                <p className="text-xs text-slate-400 text-center py-4">
                  No incidents reported during this shift.
                </p>
              </div>
            ) : (
              state.todayIncidents.map((inc) => (
                <div key={inc.id} className={cardCls}>
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge label={inc.severity} compact />
                    <StatusBadge label={inc.status} compact />
                  </div>
                  <p className="text-sm font-bold mt-2">{inc.type}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                    {inc.description}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : bottomTab === 'history' ? (
          <div className="space-y-3">
            <h2 className="text-base font-bold">Duty History</h2>
            {state.shiftHistory.map((item) => (
              <div key={item.id} className={cardCls}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-xs font-bold">{item.date}</span>
                  <StatusBadge label={item.reportStatus} compact />
                </div>
                <p className="text-sm font-bold mt-1">{item.postName}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  In: {item.checkIn} · Out: {item.checkOut} · {item.occurrencesLogged} obs · {item.incidentsReported} inc
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${cardCls} space-y-4`}>
            <div className="flex items-center gap-3.5">
              <img
                src={state.guard.avatar}
                alt={state.guard.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#10A878]"
              />
              <div>
                <h2 className="text-base font-bold">{state.guard.name}</h2>
                <p className="text-xs font-mono-tabular text-slate-400">{state.guard.employeeId}</p>
                <p className="text-xs text-[#10A878] font-semibold mt-0.5">
                  Acme Security Ltd
                </p>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A] text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Assigned Post</span>
                <span className="font-semibold">{state.guard.locationName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Supervisor</span>
                <span className="font-semibold">{state.guard.supervisorName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Attendance Score</span>
                <span className="font-bold text-[#10A878] tabular-nums">
                  {state.guard.attendanceScore}%
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full min-h-[46px] rounded-xl border border-red-500/30 text-red-500 font-bold text-xs flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (60px) */}
      <nav
        aria-label="Guard mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 h-[60px] bg-white/95 dark:bg-[#0D1A33]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#1E2E4A]"
      >
        <div className="max-w-lg mx-auto h-full grid grid-cols-5 items-center">
          {(
            [
              { id: 'home', label: 'Home', icon: Home },
              { id: 'occurrences', label: 'Occurrences', icon: BookOpen },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
              { id: 'history', label: 'History', icon: History },
              { id: 'profile', label: 'Profile', icon: User },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = bottomTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setBottomTab(tab.id);
                  if (tab.id === 'home') setActionView('main');
                }}
                className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                  active
                    ? 'text-[#10A878]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
