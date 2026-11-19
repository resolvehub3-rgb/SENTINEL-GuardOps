import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { shouldDisplayMaintenanceModal } from '../../utils/operations';
import type { MaintenanceConfig } from '../../types/guardops';
import { StatusBadge } from './StatusBadge';

interface MaintenanceModalViewProps {
  open: boolean;
  maintenance: MaintenanceConfig;
  isPreview?: boolean;
  onClosePreview?: () => void;
  onDismissReadOnly?: () => void;
  onRefreshStatus?: () => void;
  refreshing?: boolean;
  onSignOut?: () => void;
}

export function MaintenanceModalView({
  open,
  maintenance,
  isPreview = false,
  onClosePreview,
  onDismissReadOnly,
  onRefreshStatus,
  refreshing = false,
  onSignOut,
}: MaintenanceModalViewProps) {
  if (!open) return null;

  const severityTone =
    maintenance.severity === 'Emergency'
      ? 'red'
      : maintenance.severity === 'Upgrade'
        ? 'blue'
        : 'amber';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#070D1B]/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-modal-title"
      data-testid="maintenance-modal"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-white dark:bg-[#101C33] shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-5 bg-[#10213D] text-white border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              {maintenance.severity === 'Emergency' ? (
                <ShieldAlert className="w-5 h-5 text-amber-300" />
              ) : (
                <Wrench className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  System Under Maintenance
                </span>
                <StatusBadge label={maintenance.severity} tone={severityTone} compact />
              </div>
              <h2
                id="maintenance-modal-title"
                className="text-lg font-extrabold text-white mt-1 leading-snug"
              >
                {maintenance.title}
              </h2>
            </div>
          </div>

          {isPreview && onClosePreview && (
            <button
              type="button"
              onClick={onClosePreview}
              aria-label="Close maintenance preview"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {maintenance.message}
          </p>

          {/* Timing & Window Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50 dark:bg-[#0B1324] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-[#10A878]" />
                <span>Estimated Duration</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {maintenance.estimatedDuration}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50 dark:bg-[#0B1324] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Maintenance Window</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {maintenance.scheduledWindow || 'Immediate'}
              </p>
            </div>
          </div>

          {maintenance.contactNote && (
            <div className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D] px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
              {maintenance.contactNote}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>Last updated: {maintenance.updatedAt}</span>
            <span>Sentinel GuardOps Platform</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0B1324] border-t border-slate-200 dark:border-[#1E2E4A] flex flex-wrap items-center justify-between gap-2.5">
          {isPreview ? (
            <>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Preview of live dashboard modal
              </span>
              <button
                type="button"
                onClick={onClosePreview}
                className="h-10 px-5 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {onRefreshStatus && (
                  <button
                    type="button"
                    disabled={refreshing}
                    onClick={onRefreshStatus}
                    className="h-10 px-4 rounded-xl bg-[#10A878] hover:bg-[#0E9369] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>{refreshing ? 'Checking...' : 'Refresh Status'}</span>
                  </button>
                )}
                {maintenance.allowReadOnlyAccess && onDismissReadOnly && (
                  <button
                    type="button"
                    onClick={onDismissReadOnly}
                    className="h-10 px-4 rounded-xl border border-slate-300 dark:border-[#24395D] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#10A878] cursor-pointer transition-colors"
                  >
                    Continue Read-Only
                  </button>
                )}
              </div>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="h-10 px-3.5 rounded-xl border border-slate-300 dark:border-[#24395D] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-500 hover:border-red-400 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function GlobalMaintenanceWatcher() {
  const { user, logout } = useAuth();
  const [maintenance, setMaintenance] = useState<MaintenanceConfig | null>(null);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await apiRequest<{ maintenance: MaintenanceConfig }>('/api/platform/maintenance');
      setMaintenance(res.maintenance);
      if (!res.maintenance.enabled) {
        setDismissedAt(null);
      }
    } catch {
      // ignore transient network check failures
    }
  }, []);

  useEffect(() => {
    void fetchMaintenance();
  }, [fetchMaintenance, user?.role]);

  useRealtime((event, payload) => {
    if (event === 'maintenance:updated' && payload) {
      const next = payload as MaintenanceConfig;
      setMaintenance(next);
      setDismissedAt(null);
    } else if (event === 'ws:connected') {
      void fetchMaintenance();
    }
  });

  if (!user || !maintenance) return null;

  const shouldShow = shouldDisplayMaintenanceModal(maintenance, user.role);
  if (!shouldShow) return null;

  if (maintenance.allowReadOnlyAccess && dismissedAt === maintenance.updatedAt) {
    return (
      <div
        role="status"
        className="fixed bottom-4 left-4 z-[60] rounded-xl border border-amber-500/40 bg-[#10213D] text-white px-4 py-2.5 shadow-xl flex items-center gap-3 text-xs"
      >
        <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-semibold">Maintenance active (read-only mode)</span>
        <button
          type="button"
          onClick={() => setDismissedAt(null)}
          className="text-amber-300 font-bold hover:underline cursor-pointer"
        >
          Details
        </button>
      </div>
    );
  }

  return (
    <MaintenanceModalView
      open
      maintenance={maintenance}
      refreshing={refreshing}
      onRefreshStatus={async () => {
        setRefreshing(true);
        await fetchMaintenance();
        setRefreshing(false);
      }}
      onDismissReadOnly={
        maintenance.allowReadOnlyAccess
          ? () => setDismissedAt(maintenance.updatedAt)
          : undefined
      }
      onSignOut={() => void logout()}
    />
  );
}
