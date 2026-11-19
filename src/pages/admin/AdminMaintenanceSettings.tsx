import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  History,
  Power,
  Save,
  ShieldAlert,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { MaintenanceModalView } from '../../components/common/MaintenanceModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { validateMaintenanceConfigInput } from '../../utils/operations';
import type {
  MaintenanceConfig,
  MaintenanceHistoryRecord,
  MaintenanceSeverity,
} from '../../types/guardops';

interface AdminMaintenanceSettingsProps {
  maintenance: MaintenanceConfig;
  history: MaintenanceHistoryRecord[];
  onUpdated: (next: MaintenanceConfig) => void;
}

const PRESET_TEMPLATES: Array<{
  label: string;
  severity: MaintenanceSeverity;
  title: string;
  duration: string;
  message: string;
}> = [
  {
    label: 'Planned Maintenance (30m)',
    severity: 'Planned',
    title: 'System Under Scheduled Maintenance',
    duration: '30 minutes',
    message:
      'Sentinel GuardOps is undergoing scheduled platform maintenance to improve operational performance. Dashboard access will resume shortly.',
  },
  {
    label: 'Database & Telemetry Upgrade (1h)',
    severity: 'Upgrade',
    title: 'Platform Infrastructure Upgrade',
    duration: '1 hour',
    message:
      'We are upgrading database storage and realtime dispatch telemetry across all regions. Guard and supervisor records remain safely preserved.',
  },
  {
    label: 'Emergency Security Patch (15m)',
    severity: 'Emergency',
    title: 'Urgent Security Maintenance',
    duration: '15 minutes',
    message:
      'Emergency platform maintenance is underway to apply a critical security update. Please wait while services reconnect automatically.',
  },
];

export function AdminMaintenanceSettings({
  maintenance,
  history,
  onUpdated,
}: AdminMaintenanceSettingsProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<MaintenanceConfig>(maintenance);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setForm(maintenance);
  }, [maintenance]);

  const cardCls =
    'rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-5';

  const persistMaintenance = async (nextPayload: MaintenanceConfig, toastTitle: string) => {
    const check = validateMaintenanceConfigInput({
      title: nextPayload.title,
      message: nextPayload.message,
      estimatedDuration: nextPayload.estimatedDuration,
    });
    if (!check.valid) {
      showToast({
        title: 'Invalid maintenance configuration',
        description: check.error,
        tone: 'error',
      });
      return false;
    }

    try {
      const res = await apiRequest<{ maintenance: MaintenanceConfig }>('/api/admin/maintenance', {
        method: 'POST',
        body: JSON.stringify(nextPayload),
      });
      setForm(res.maintenance);
      onUpdated(res.maintenance);
      showToast({ title: toastTitle, tone: res.maintenance.enabled ? 'warning' : 'success' });
      return true;
    } catch (err) {
      showToast({
        title: 'Failed to update maintenance settings',
        description: err instanceof Error ? err.message : 'Server error',
        tone: 'error',
      });
      return false;
    }
  };

  const handleQuickToggle = async () => {
    setToggling(true);
    const nextEnabled = !form.enabled;
    const nextPayload: MaintenanceConfig = { ...form, enabled: nextEnabled };
    await persistMaintenance(
      nextPayload,
      nextEnabled
        ? 'Maintenance Mode Enabled across selected dashboards'
        : 'Maintenance Mode Disabled — dashboards restored',
    );
    setToggling(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await persistMaintenance(form, 'Maintenance settings saved');
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Platform Settings &amp; Maintenance Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Control live maintenance mode, broadcast downtime alerts to active dashboards, and review
            maintenance logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="h-10 px-4 rounded-xl border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#121E36] hover:border-[#10A878] text-xs font-bold text-slate-800 dark:text-white inline-flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Eye className="w-4 h-4 text-[#10A878]" />
          <span>Preview Maintenance Modal</span>
        </button>
      </div>

      {/* Master Maintenance Kill-Switch Banner */}
      <section
        className={`rounded-2xl border p-6 transition-colors ${
          form.enabled
            ? 'border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/10'
            : 'border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                form.enabled
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#10213D] text-[#10A878] border border-[#1E355C]'
              }`}
            >
              {form.enabled ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Global Maintenance Mode
                </h3>
                <StatusBadge
                  label={form.enabled ? 'Maintenance Active' : 'Operational'}
                  tone={form.enabled ? 'amber' : 'emerald'}
                  compact
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {form.enabled
                  ? 'Maintenance mode is currently active. Every selected dashboard (Company, Supervisor, and Guard) immediately displays the System Under Maintenance modal.'
                  : 'All platform dashboards are operating normally. Toggle maintenance mode on to immediately open the maintenance modal across active dashboards.'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Last updated: {maintenance.updatedAt} by {maintenance.updatedBy}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={form.enabled}
              aria-label="Toggle global maintenance mode"
              data-testid="maintenance-master-toggle"
              disabled={toggling}
              onClick={() => void handleQuickToggle()}
              className={`h-11 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60 ${
                form.enabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {toggling
                  ? 'Applying...'
                  : form.enabled
                    ? 'Disable Maintenance Mode'
                    : 'Enable Maintenance Mode'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid: Configuration Form + Scope & Presets */}
      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Maintenance Notice & Timing */}
        <div className="lg:col-span-7 space-y-5">
          <section className={cardCls}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#10A878]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Maintenance Modal Content
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Displayed on user dashboards</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="maint-title"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Maintenance Title *
                  </label>
                  <input
                    id="maint-title"
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white focus:outline-none focus:border-[#10A878]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="maint-severity"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Maintenance Type
                  </label>
                  <select
                    id="maint-severity"
                    value={form.severity}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        severity: e.target.value as MaintenanceSeverity,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white focus:outline-none focus:border-[#10A878]"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Upgrade">Upgrade</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="maint-message"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  User-Facing Maintenance Message *
                </label>
                <textarea
                  id="maint-message"
                  rows={3}
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white focus:outline-none focus:border-[#10A878]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="maint-duration"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Estimated Duration *
                  </label>
                  <input
                    id="maint-duration"
                    type="text"
                    required
                    value={form.estimatedDuration}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedDuration: e.target.value }))}
                    placeholder="e.g. 30 minutes"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white focus:outline-none focus:border-[#10A878]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="maint-window"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Maintenance Window
                  </label>
                  <input
                    id="maint-window"
                    type="text"
                    value={form.scheduledWindow}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledWindow: e.target.value }))}
                    placeholder="e.g. Immediate or 02:00 – 02:30 UTC"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white focus:outline-none focus:border-[#10A878]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="maint-contact"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Emergency Dispatch / Contact Note
                </label>
                <input
                  id="maint-contact"
                  type="text"
                  value={form.contactNote}
                  onChange={(e) => setForm((f) => ({ ...f, contactNote: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white focus:outline-none focus:border-[#10A878]"
                />
              </div>
            </div>
          </section>

          {/* Quick Templates */}
          <section className={cardCls}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#10A878]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Quick Maintenance Presets
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESET_TEMPLATES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      severity: preset.severity,
                      title: preset.title,
                      estimatedDuration: preset.duration,
                      message: preset.message,
                    }))
                  }
                  className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#0D182D] hover:border-[#10A878] text-left transition-colors cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{preset.label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Apply {preset.severity} notice
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Target Scopes + Behavior Controls + Save */}
        <div className="lg:col-span-5 space-y-5">
          <section className={cardCls}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Target Dashboard Scopes
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Choose which operational portals show the System Under Maintenance modal when
              maintenance mode is active.
            </p>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/60 dark:bg-[#0D182D] cursor-pointer">
                <span className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#10A878]" />
                  <span>
                    <strong className="block text-slate-900 dark:text-white">
                      Company Management Dashboard
                    </strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Security company owners &amp; managers
                    </span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.affectedScopes.companyDashboard}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      affectedScopes: { ...f.affectedScopes, companyDashboard: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-[#10A878]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/60 dark:bg-[#0D182D] cursor-pointer">
                <span className="flex items-center gap-2.5">
                  <ClipboardCheck className="w-4 h-4 text-[#10A878]" />
                  <span>
                    <strong className="block text-slate-900 dark:text-white">
                      Supervisor Dashboard
                    </strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Field supervisors &amp; sector leads
                    </span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.affectedScopes.supervisorDashboard}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      affectedScopes: {
                        ...f.affectedScopes,
                        supervisorDashboard: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 accent-[#10A878]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/60 dark:bg-[#0D182D] cursor-pointer">
                <span className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#10A878]" />
                  <span>
                    <strong className="block text-slate-900 dark:text-white">
                      Guard Mobile Dashboard
                    </strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      On-duty mobile guard interface
                    </span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.affectedScopes.guardDashboard}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      affectedScopes: { ...f.affectedScopes, guardDashboard: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-[#10A878]"
                />
              </label>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-[#1E2E4A] space-y-3 text-xs">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span>
                  <strong className="block text-slate-900 dark:text-white">
                    Allow Read-Only Dismissal
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Let users dismiss the modal to view data during maintenance
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.allowReadOnlyAccess}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, allowReadOnlyAccess: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#10A878]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span>
                  <strong className="block text-slate-900 dark:text-white">
                    Show Maintenance Notice Banner
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Display advisory banner if read-only access is granted
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.notifyUsersBanner}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notifyUsersBanner: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#10A878]"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 rounded-xl bg-[#10A878] hover:bg-[#0E9369] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Maintenance Settings...' : 'Save Maintenance Settings'}</span>
              </button>
            </div>
          </section>

          {/* Maintenance History Log */}
          <section className={cardCls}>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-[#10A878]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Maintenance Activity Log
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-[#1D2D4A] text-xs">
              {history.length === 0 ? (
                <p className="py-4 text-center text-slate-400">No maintenance events logged yet.</p>
              ) : (
                history.slice(0, 6).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {item.action} · {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.actor} · {item.duration} · {item.timestamp}
                      </p>
                    </div>
                    <StatusBadge
                      label={item.action}
                      tone={
                        item.action === 'Enabled'
                          ? 'amber'
                          : item.action === 'Disabled'
                            ? 'emerald'
                            : 'blue'
                      }
                      compact
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </form>

      {/* Preview Modal */}
      <MaintenanceModalView
        open={previewOpen}
        maintenance={form}
        isPreview
        onClosePreview={() => setPreviewOpen(false)}
      />
    </div>
  );
}
