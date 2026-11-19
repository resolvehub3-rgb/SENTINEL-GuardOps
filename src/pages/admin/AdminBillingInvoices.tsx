import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Plus,
  Printer,
  Search,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KpiCard } from '../../components/common/KpiCard';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { apiRequest } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { computeBillingTotals } from '../../utils/operations';
import type { BillingInvoiceRecord, CompanyAccountRecord } from '../../types/guardops';

interface AdminBillingInvoicesProps {
  invoices: BillingInvoiceRecord[];
  companies: CompanyAccountRecord[];
  billingSeries: Array<{ month: string; revenue: number }>;
  onRefresh: () => Promise<void>;
}

export function AdminBillingInvoices({
  invoices,
  companies,
  billingSeries,
  onRefresh,
}: AdminBillingInvoicesProps) {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending' | 'Overdue'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoiceRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create invoice modal state
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '');
  const [period, setPeriod] = useState(() =>
    new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  );
  const [amount, setAmount] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<'Pending' | 'Paid'>('Pending');
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => computeBillingTotals(invoices), [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (q) {
        return (
          inv.id.toLowerCase().includes(q) ||
          inv.companyName.toLowerCase().includes(q) ||
          inv.period.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, search, statusFilter]);

  const collectionRate =
    totals.totalBilled > 0
      ? Math.round((totals.collectedAmount / totals.totalBilled) * 100)
      : 0;

  const handleUpdateInvoiceStatus = async (
    invoiceId: string,
    status: 'Paid' | 'Pending' | 'Overdue',
  ) => {
    try {
      await apiRequest(`/api/admin/invoices/${invoiceId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      showToast({ title: `Invoice marked ${status}`, tone: status === 'Paid' ? 'success' : 'info' });
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status } : null));
      }
      await onRefresh();
    } catch (err) {
      showToast({
        title: 'Failed to update invoice',
        description: err instanceof Error ? err.message : 'Server error',
        tone: 'error',
      });
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const comp = companies.find((c) => c.id === companyId);
      await apiRequest('/api/admin/invoices', {
        method: 'POST',
        body: JSON.stringify({
          companyId,
          period,
          amount: Number(amount),
          planName: comp?.planName ?? 'Enterprise',
          status: invoiceStatus,
        }),
      });
      showToast({ title: 'Invoice generated', tone: 'success' });
      setCreateOpen(false);
      await onRefresh();
    } catch (err) {
      showToast({
        title: 'Could not generate invoice',
        description: err instanceof Error ? err.message : 'Invalid input',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cardCls =
    'rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-5';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Platform Billing &amp; Invoices
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track monthly invoice collections, generate company billing statements, and reconcile
            overdue accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!companyId && companies[0]) {
              setCompanyId(companies[0].id);
              if (companies[0].monthlyFee > 0) setAmount(String(companies[0].monthlyFee));
            }
            setCreateOpen(true);
          }}
          className="h-10 px-4 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Invoice</span>
        </button>
      </div>

      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Invoiced Volume"
          value={`GH₵${totals.totalBilled.toLocaleString()}`}
          trend={`${invoices.length} invoices issued`}
          trendDirection="up"
          tone="navy"
          icon={FileText}
        />
        <KpiCard
          label="Collected Revenue (Paid)"
          value={`GH₵${totals.collectedAmount.toLocaleString()}`}
          trend={`${totals.paidCount} paid · ${collectionRate}% rate`}
          trendDirection="up"
          tone="emerald"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Pending Collection"
          value={`GH₵${totals.pendingAmount.toLocaleString()}`}
          trend={`${totals.pendingCount} awaiting payment`}
          trendDirection="flat"
          tone="indigo"
          icon={Clock}
        />
        <KpiCard
          label="Overdue Balance"
          value={`GH₵${totals.overdueAmount.toLocaleString()}`}
          trend={`${totals.overdueCount} overdue notice`}
          trendDirection="down"
          tone="amber"
          icon={AlertTriangle}
        />
      </div>

      {/* Revenue Chart + Collection Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className={`${cardCls} lg:col-span-8`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Billing Revenue Trend
              </h3>
              <p className="text-[11px] text-slate-400">Platform recurring revenue trajectory</p>
            </div>
            <CreditCard className="w-4 h-4 text-[#10A878]" />
          </div>
          <div className="h-48 w-full">
            {billingSeries.length === 0 ? (
              <div className="h-full rounded-lg border border-dashed border-slate-200 dark:border-[#1E2E4A] flex items-center justify-center text-xs text-slate-400">
                No billing revenue data yet. Generate or pay an invoice to plot monthly revenue.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billingSeries}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} width={48} />
                  <Tooltip
                    formatter={(value) => [`GH₵${Number(value).toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#10213D',
                      borderColor: '#1E2E4A',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#10A878" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className={`${cardCls} lg:col-span-4 flex flex-col justify-between`}>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Collection Health
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Settlement progress across current cycle invoices
            </p>

            <div className="mt-5">
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Settled Percentage
                </span>
                <span className="font-extrabold text-[#10A878] tabular-nums">
                  {collectionRate}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-[#0D182D] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#10A878]"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100 dark:border-[#1E2E4A] text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Paid Invoices</span>
              <span className="font-bold tabular-nums text-emerald-500">{totals.paidCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Pending Invoices</span>
              <span className="font-bold tabular-nums text-blue-500">{totals.pendingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Overdue Invoices</span>
              <span className="font-bold tabular-nums text-amber-500">{totals.overdueCount}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Invoices Table */}
      <section className={cardCls}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'Paid', 'Pending', 'Overdue'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-[#10A878] text-white'
                    : 'bg-slate-100 dark:bg-[#0D182D] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All Invoices' : tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice # or company..."
              className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-xs w-64 focus:outline-none focus:border-[#10A878]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1E2E4A] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 pr-4">Invoice #</th>
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Billing Period</th>
                <th className="py-3 px-3">Issued</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1A2A46] text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 font-mono-tabular font-bold text-slate-900 dark:text-white">
                      {inv.id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">
                      {inv.companyName}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-300">{inv.planName}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-300">{inv.period}</td>
                    <td className="py-3 px-3 font-mono-tabular text-slate-400">{inv.issuedAt}</td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                      GH₵{inv.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge label={inv.status} compact />
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {inv.status !== 'Paid' && (
                          <button
                            type="button"
                            onClick={() => void handleUpdateInvoiceStatus(inv.id, 'Paid')}
                            className="px-2.5 py-1 rounded-lg bg-[#10A878] text-white text-[11px] font-semibold cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#24395D] text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:border-[#10A878] cursor-pointer"
                        >
                          View Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invoice Detail / Printable Preview Modal */}
      <Modal
        open={selectedInvoice !== null}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Invoice ${selectedInvoice.id}` : 'Invoice'}
        subtitle={selectedInvoice ? `${selectedInvoice.companyName} · ${selectedInvoice.period}` : ''}
      >
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50 dark:bg-[#0D182D] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E2E4A] pb-3">
                <div>
                  <p className="text-[11px] text-slate-400">Billed To</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedInvoice.companyName}
                  </p>
                </div>
                <StatusBadge label={selectedInvoice.status} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Plan</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedInvoice.planName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Billing Period</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedInvoice.period}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Issued Date</span>
                  <span className="font-mono-tabular font-semibold text-slate-700 dark:text-slate-200">
                    {selectedInvoice.issuedAt}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Amount Due</span>
                  <span className="text-base font-extrabold tabular-nums text-[#10A878]">
                    GH₵{selectedInvoice.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-[#24395D] text-slate-700 dark:text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:border-[#10A878]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedInvoice.status !== 'Overdue' && selectedInvoice.status !== 'Paid' && (
                  <button
                    type="button"
                    onClick={() => void handleUpdateInvoiceStatus(selectedInvoice.id, 'Overdue')}
                    className="h-9 px-3.5 rounded-lg border border-red-500/40 text-red-500 font-semibold cursor-pointer"
                  >
                    Flag Overdue
                  </button>
                )}
                {selectedInvoice.status !== 'Paid' && (
                  <button
                    type="button"
                    onClick={() => void handleUpdateInvoiceStatus(selectedInvoice.id, 'Paid')}
                    className="h-9 px-4 rounded-lg bg-[#10A878] text-white font-bold cursor-pointer"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Generate Platform Invoice"
        subtitle="Create a new billing statement for a registered security company"
      >
        <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
          <div>
            <label
              htmlFor="inv-company"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Security Company
            </label>
            {companies.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] px-3 py-3 text-slate-400">
                No registered security companies yet. Register or approve a company first to issue an invoice.
              </div>
            ) : (
              <select
                id="inv-company"
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  const found = companies.find((c) => c.id === e.target.value);
                  if (found && found.monthlyFee > 0) setAmount(String(found.monthlyFee));
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white"
              >
                {companies.slice(0, 20).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.planName})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="inv-period"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Billing Period
              </label>
              <input
                id="inv-period"
                type="text"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="inv-amount"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Amount (GH₵)
              </label>
              <input
                id="inv-amount"
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="inv-status"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Initial Status
            </label>
            <select
              id="inv-status"
              value={invoiceStatus}
              onChange={(e) => setInvoiceStatus(e.target.value as 'Pending' | 'Paid')}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-slate-900 dark:text-white"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-[#24395D] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !companyId}
              className="h-10 px-5 rounded-xl bg-[#10A878] hover:bg-[#0E9369] disabled:opacity-60 text-white font-bold cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
