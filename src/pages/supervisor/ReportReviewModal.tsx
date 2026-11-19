import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, AlertTriangle, FileText } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { validateReportReviewAction } from '../../utils/operations';
import type {
  IncidentRecord,
  OccurrenceRecord,
  ShiftReportRecord,
} from '../../types/guardops';

interface ReportReviewModalProps {
  report: ShiftReportRecord | null;
  occurrences: OccurrenceRecord[];
  incidents: IncidentRecord[];
  onClose: () => void;
  onSubmitReview: (
    reportId: string,
    action: 'finalize' | 'return',
    reason?: string,
  ) => Promise<void>;
}

export function ReportReviewModal({
  report,
  occurrences,
  incidents,
  onClose,
  onSubmitReview,
}: ReportReviewModalProps) {
  const [mode, setMode] = useState<'inspect' | 'confirm-finalize' | 'return-form'>('inspect');
  const [returnReason, setReturnReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!report) return null;

  const relatedOccs = occurrences.filter((o) => o.guardId === report.guardId).slice(0, 4);
  const relatedIncs = incidents.filter((i) => i.guardId === report.guardId).slice(0, 3);

  const handleClose = () => {
    setMode('inspect');
    setReturnReason('');
    setError(null);
    onClose();
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmitReview(report.id, 'finalize');
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to finalize report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateReportReviewAction('return', returnReason);
    if (!check.valid) {
      setError(check.error ?? 'Reason is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmitReview(report.id, 'return', returnReason);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to return report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={report !== null}
      onClose={handleClose}
      title={`Shift Report Review — ${report.locationName}`}
      subtitle={`${report.guardName} (${report.employeeId}) · ${report.shiftType} Shift · ${report.shiftDate}`}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Guard & Attendance Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/80 dark:bg-[#0D182D]">
          <div className="flex items-center gap-3">
            <img
              src={report.guardAvatar}
              alt={report.guardName}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border border-[#10A878]/50"
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {report.guardName}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Attendance: {report.attendanceStatus} · Window: {report.shiftStart} – {report.shiftEnd}
              </p>
            </div>
          </div>
          <StatusBadge label={report.status} />
        </div>

        {/* Counts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A]">
            <span className="text-slate-400 block">Occurrences</span>
            <span className="text-base font-bold tabular-nums">{report.occurrencesCount}</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A]">
            <span className="text-slate-400 block">Incidents</span>
            <span className="text-base font-bold tabular-nums">{report.incidentsCount}</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A]">
            <span className="text-slate-400 block">Submitted</span>
            <span className="text-base font-bold">{report.submittedAt}</span>
          </div>
        </div>

        {/* Handover Notes & Final Summary */}
        <div className="space-y-2.5">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2E4A]">
            <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              Handover Notes
            </p>
            <p className="mt-1 text-slate-800 dark:text-slate-200 leading-relaxed">
              {report.handoverNotes}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2E4A]">
            <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              Guard Final Shift Summary
            </p>
            <p className="mt-1 text-slate-800 dark:text-slate-200 leading-relaxed">
              {report.finalSummary}
            </p>
          </div>
        </div>

        {/* Related Occurrences & Incidents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A]">
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#10A878]" />
              Shift Occurrences ({relatedOccs.length})
            </p>
            {relatedOccs.length === 0 ? (
              <p className="text-slate-400">No individual entries attached.</p>
            ) : (
              <ul className="space-y-1.5">
                {relatedOccs.map((o) => (
                  <li key={o.id} className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">{o.category}:</span> {o.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A]">
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Linked Incidents ({relatedIncs.length})
            </p>
            {relatedIncs.length === 0 ? (
              <p className="text-slate-400">Zero incidents logged on this shift.</p>
            ) : (
              <ul className="space-y-1.5">
                {relatedIncs.map((i) => (
                  <li key={i.id} className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">{i.type} ({i.severity}):</span>{' '}
                    {i.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Evidence Attachments */}
        {report.evidenceUrls.length > 0 && (
          <div>
            <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
              Evidence Attachments ({report.evidenceUrls.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {report.evidenceUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Shift evidence ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-[#1E2E4A]"
                />
              ))}
            </div>
          </div>
        )}

        {report.reviewReason && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <span className="font-bold">Previous Return Reason: </span>
            {report.reviewReason}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300 font-medium"
          >
            {error}
          </div>
        )}

        {/* Action Flows */}
        {mode === 'inspect' && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1E2E4A]">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('return-form');
              }}
              className="px-4 py-2 rounded-lg border border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/10 font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return for Correction</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('confirm-finalize');
              }}
              className="px-4 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] text-white font-semibold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finalize Review</span>
            </button>
          </div>
        )}

        {mode === 'confirm-finalize' && (
          <div className="p-4 rounded-xl border border-[#10A878]/40 bg-emerald-500/10 space-y-3">
            <p className="font-bold text-slate-900 dark:text-white">
              Confirm Finalizing Shift Report?
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Finalizing marks this shift report complete and forwards it to Company Management for owner verification.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode('inspect')}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#24395D] font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleFinalize()}
                className="px-4 py-2 rounded-lg bg-[#10A878] text-white font-semibold"
              >
                {submitting ? 'Finalizing...' : 'Confirm Finalize'}
              </button>
            </div>
          </div>
        )}

        {mode === 'return-form' && (
          <form
            onSubmit={(e) => void handleReturn(e)}
            className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-3"
          >
            <label
              htmlFor="return-reason-input"
              className="block font-bold text-slate-900 dark:text-white"
            >
              Reason for Returning Report (Required)
            </label>
            <textarea
              id="return-reason-input"
              rows={3}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Explain what the guard must clarify or correct..."
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-[#24395D] bg-white dark:bg-[#0D182D] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('inspect');
                  setError(null);
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#24395D] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              >
                {submitting ? 'Returning...' : 'Confirm Return'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
