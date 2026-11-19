import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  MapPin,
  Shield,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import {
  validateClientOnboardingInput,
  validateStationAssignmentInput,
} from '../../utils/operations';
import type {
  ClientRecord,
  GuardRecord,
  LocationRecord,
  SupervisorRecord,
} from '../../types/guardops';

export interface CreateClientPayload {
  clientName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  stationName: string;
  stationAddress: string;
  zone: string;
  postName: string;
  monthlyPrice: number;
  billingCycle: 'Monthly' | 'Quarterly' | 'Annual';
  shiftCoverage: string;
  requiredGuards: number;
  contractStartDate: string;
  serviceNotes: string;
  status: 'Active' | 'Onboarding';
}

export interface AssignStationPayload {
  locationId: string;
  supervisorMode?: 'existing' | 'new';
  supervisorId?: string;
  newSupervisorName?: string;
  newSupervisorEmail?: string;
  newSupervisorPhone?: string;
  guardMode: 'existing' | 'new';
  guardId?: string;
  newGuardName?: string;
  newGuardPhone?: string;
  postName: string;
  shiftType: 'Day' | 'Evening' | 'Night';
}

interface ClientRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  supervisors: SupervisorRecord[];
  guards: GuardRecord[];
  onCreateClient: (
    payload: CreateClientPayload,
  ) => Promise<{ client: ClientRecord; location: LocationRecord }>;
  onAssignStation: (payload: AssignStationPayload) => Promise<void>;
}

const INDUSTRIES = [
  'Educational Institution',
  'Commercial Retail',
  'Corporate Office',
  'Residential Estate',
  'Industrial & Logistics',
  'Healthcare Facility',
  'Hospitality',
  'Government / Public',
];

export function ClientRegistrationModal({
  open,
  onClose,
  supervisors,
  guards,
  onCreateClient,
  onAssignStation,
}: ClientRegistrationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [clientName, setClientName] = useState('');
  const [industry, setIndustry] = useState('Educational Institution');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationAddress, setStationAddress] = useState('');
  const [zone, setZone] = useState('East District');
  const [postName, setPostName] = useState('Main Gate');
  const [monthlyPrice, setMonthlyPrice] = useState('2400');
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Monthly');
  const [shiftCoverage, setShiftCoverage] = useState('24/7 Coverage');
  const [requiredGuards, setRequiredGuards] = useState('2');
  const [contractStartDate, setContractStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [serviceNotes, setServiceNotes] = useState('');
  const [status, setStatus] = useState<'Active' | 'Onboarding'>('Onboarding');

  // Step 2 created records & fields
  const [createdClient, setCreatedClient] = useState<ClientRecord | null>(null);
  const [createdLocation, setCreatedLocation] = useState<LocationRecord | null>(null);
  const [supervisorMode, setSupervisorMode] = useState<'existing' | 'new'>(
    supervisors.length > 0 ? 'existing' : 'new',
  );
  const [supervisorId, setSupervisorId] = useState(supervisors[0]?.id ?? '');
  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [newSupervisorEmail, setNewSupervisorEmail] = useState('');
  const [newSupervisorPhone, setNewSupervisorPhone] = useState('');
  const [guardMode, setGuardMode] = useState<'existing' | 'new'>(
    guards.length > 0 ? 'existing' : 'new',
  );
  const [guardId, setGuardId] = useState(guards[0]?.id ?? '');
  const [newGuardName, setNewGuardName] = useState('');
  const [newGuardPhone, setNewGuardPhone] = useState('');
  const [assignPostName, setAssignPostName] = useState('Main Gate');
  const [shiftType, setShiftType] = useState<'Day' | 'Evening' | 'Night'>('Day');

  useEffect(() => {
    if (open) {
      setStep(1);
      setError(null);
      setCreatedClient(null);
      setCreatedLocation(null);
      setSupervisorMode(supervisors.length > 0 ? 'existing' : 'new');
      setSupervisorId((prev) => prev || supervisors[0]?.id || '');
      setGuardMode(guards.length > 0 ? 'existing' : 'new');
      setGuardId((prev) => prev || guards[0]?.id || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supervisors.length, guards.length]);

  const resetAndClose = () => {
    setClientName('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setStationName('');
    setStationAddress('');
    setServiceNotes('');
    setNewSupervisorName('');
    setNewSupervisorEmail('');
    setNewSupervisorPhone('');
    setNewGuardName('');
    setNewGuardPhone('');
    setError(null);
    setStep(1);
    onClose();
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const check = validateClientOnboardingInput({
      clientName,
      contactName,
      contactEmail,
      contactPhone,
      stationName,
      stationAddress,
      monthlyPrice,
    });
    if (!check.valid) {
      setError(check.error ?? 'Please complete all required client and station fields.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await onCreateClient({
        clientName: clientName.trim(),
        industry,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        stationName: stationName.trim(),
        stationAddress: stationAddress.trim(),
        zone: zone.trim() || 'Metro Zone',
        postName: postName.trim() || 'Main Gate',
        monthlyPrice: Number(monthlyPrice),
        billingCycle,
        shiftCoverage,
        requiredGuards: Math.max(1, Number(requiredGuards) || 1),
        contractStartDate,
        serviceNotes: serviceNotes.trim(),
        status,
      });
      setCreatedClient(created.client);
      setCreatedLocation(created.location);
      setAssignPostName(postName.trim() || created.location.postCode);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register client.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdLocation) return;
    setError(null);

    const check = validateStationAssignmentInput({
      locationId: createdLocation.id,
      supervisorMode,
      supervisorId,
      newSupervisorName,
      guardMode,
      guardId,
      newGuardName,
      shiftType,
    });
    if (!check.valid) {
      setError(check.error ?? 'Please assign both a supervisor and a guard.');
      return;
    }

    setSubmitting(true);
    try {
      await onAssignStation({
        locationId: createdLocation.id,
        supervisorMode,
        supervisorId: supervisorMode === 'existing' ? supervisorId : undefined,
        newSupervisorName: supervisorMode === 'new' ? newSupervisorName.trim() : undefined,
        newSupervisorEmail: supervisorMode === 'new' ? newSupervisorEmail.trim() : undefined,
        newSupervisorPhone: supervisorMode === 'new' ? newSupervisorPhone.trim() : undefined,
        guardMode,
        guardId: guardMode === 'existing' ? guardId : undefined,
        newGuardName: guardMode === 'new' ? newGuardName.trim() : undefined,
        newGuardPhone: guardMode === 'new' ? newGuardPhone.trim() : undefined,
        postName: assignPostName.trim() || createdLocation.postCode,
        shiftType,
      });
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign supervisor and guard.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#10A878]';

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={step === 1 ? 'Register New Client Account' : 'Assign Supervisor & Guard to Station'}
      subtitle={
        step === 1
          ? 'Record client details, work station location, and contract pricing'
          : `Deploy supervision & guard coverage for ${createdLocation?.name ?? 'new station'}`
      }
      maxWidthClass="max-w-2xl"
    >
      {/* Stepper Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-[#1E2E4A] text-xs">
        <div
          className={`flex items-center gap-1.5 font-bold ${
            step === 1 ? 'text-[#10A878]' : 'text-slate-400'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 1
                ? 'bg-[#10A878] text-white'
                : 'bg-[#10A878]/20 text-[#10A878]'
            }`}
          >
            {step > 1 ? '✓' : '1'}
          </span>
          <span>Client, Station &amp; Pricing</span>
        </div>
        <span className="text-slate-400">→</span>
        <div
          className={`flex items-center gap-1.5 font-bold ${
            step === 2 ? 'text-[#10A878]' : 'text-slate-400'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 2
                ? 'bg-[#10A878] text-white'
                : 'bg-slate-200 dark:bg-[#1E2E4A] text-slate-500'
            }`}
          >
            2
          </span>
          <span>Assign Supervisor &amp; Guard</span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-3.5 py-2.5 flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
            <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>Company-Managed Onboarding:</strong> Clients cannot create self-service accounts.
              Register the client&apos;s contract, work station, and pricing on their behalf.
            </span>
          </div>

          {/* Client Identity */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#10A878]" />
              Client Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cli-name" className="block text-xs font-semibold mb-1">
                  Client / Compound Name *
                </label>
                <input
                  id="cli-name"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Greenfield Academy"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cli-industry" className="block text-xs font-semibold mb-1">
                  Sector / Property Type
                </label>
                <select
                  id="cli-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={inputCls}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="cli-contact" className="block text-xs font-semibold mb-1">
                  Contact Person *
                </label>
                <input
                  id="cli-contact"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Principal Emmanuel Mensah"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cli-email" className="block text-xs font-semibold mb-1">
                  Contact Email *
                </label>
                <input
                  id="cli-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="admin@greenfield.edu"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cli-phone" className="block text-xs font-semibold mb-1">
                  Contact Phone *
                </label>
                <input
                  id="cli-phone"
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+233 24 555 0190"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Station & Pricing */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#1E2E4A] space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#10A878]" />
              Work Station &amp; Contract Pricing
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cli-station" className="block text-xs font-semibold mb-1">
                  Work Station / Compound Name *
                </label>
                <input
                  id="cli-station"
                  required
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="e.g., Greenfield School Compound"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cli-address" className="block text-xs font-semibold mb-1">
                  Station Street Address *
                </label>
                <input
                  id="cli-address"
                  required
                  value={stationAddress}
                  onChange={(e) => setStationAddress(e.target.value)}
                  placeholder="Plot 14 Liberation Road, East Legon"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="cli-zone" className="block text-xs font-semibold mb-1">
                  Zone / Sector
                </label>
                <input
                  id="cli-zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="East District"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cli-post" className="block text-xs font-semibold mb-1">
                  Primary Post / Gate
                </label>
                <input
                  id="cli-post"
                  value={postName}
                  onChange={(e) => setPostName(e.target.value)}
                  placeholder="Main School Gate"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cli-price" className="block text-xs font-semibold mb-1">
                  Monthly Price (GH₵) *
                </label>
                <div className="relative">
                  <span className="text-[11px] font-bold text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    GH₵
                  </span>
                  <input
                    id="cli-price"
                    type="number"
                    min={1}
                    required
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className={`${inputCls} pl-10 tabular-nums`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cli-cycle" className="block text-xs font-semibold mb-1">
                  Billing Cycle
                </label>
                <select
                  id="cli-cycle"
                  value={billingCycle}
                  onChange={(e) =>
                    setBillingCycle(e.target.value as 'Monthly' | 'Quarterly' | 'Annual')
                  }
                  className={inputCls}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="cli-coverage" className="block text-xs font-semibold mb-1">
                  Shift Coverage
                </label>
                <select
                  id="cli-coverage"
                  value={shiftCoverage}
                  onChange={(e) => setShiftCoverage(e.target.value)}
                  className={inputCls}
                >
                  <option value="24/7 Coverage">24/7 Coverage</option>
                  <option value="Day Shift (06:00–18:00)">Day Shift</option>
                  <option value="Night Shift (18:00–06:00)">Night Shift</option>
                </select>
              </div>
              <div>
                <label htmlFor="cli-guards-req" className="block text-xs font-semibold mb-1">
                  Guards Required
                </label>
                <input
                  id="cli-guards-req"
                  type="number"
                  min={1}
                  max={50}
                  value={requiredGuards}
                  onChange={(e) => setRequiredGuards(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cli-start" className="block text-xs font-semibold mb-1">
                  Start Date
                </label>
                <input
                  id="cli-start"
                  type="date"
                  value={contractStartDate}
                  onChange={(e) => setContractStartDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cli-status" className="block text-xs font-semibold mb-1">
                  Initial Status
                </label>
                <select
                  id="cli-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Onboarding')}
                  className={inputCls}
                >
                  <option value="Onboarding">Onboarding</option>
                  <option value="Active">Active</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="cli-notes" className="block text-xs font-semibold mb-1">
                Post Orders / Service Requirements
              </label>
              <textarea
                id="cli-notes"
                rows={2}
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                placeholder="e.g., Verify student pick-up passes, log all campus visitors, lock compound gates at 19:00."
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1E2E4A]">
            <button
              type="button"
              onClick={resetAndClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{submitting ? 'Registering Client...' : 'Register Client & Assign Team'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleStep2Submit} className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#10A878] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {createdClient?.name} registered (GH₵{createdClient?.contractValueMonthly.toLocaleString()}/mo)
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                Work Station: <strong>{createdLocation?.name}</strong> ({createdLocation?.address}). Now
                assign a Supervisor and Guard to activate coverage.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Assign Regional Supervisor *</span>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#24395D] p-0.5 bg-slate-100 dark:bg-[#0D182D] text-[11px]">
                <button
                  type="button"
                  disabled={supervisors.length === 0}
                  onClick={() => setSupervisorMode('existing')}
                  className={`px-2.5 py-1 rounded-md font-semibold disabled:opacity-40 ${
                    supervisorMode === 'existing'
                      ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  Existing Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => setSupervisorMode('new')}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 ${
                    supervisorMode === 'new'
                      ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  Add Supervisor
                </button>
              </div>
            </div>

            {supervisorMode === 'existing' && supervisors.length > 0 ? (
              <select
                id="step2-sup"
                aria-label="Select supervisor for station"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className={inputCls}
              >
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.employeeId}) — {s.assignedLocations.length} sites
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  required
                  value={newSupervisorName}
                  onChange={(e) => setNewSupervisorName(e.target.value)}
                  placeholder="Supervisor Full Name *"
                  className={inputCls}
                />
                <input
                  type="email"
                  value={newSupervisorEmail}
                  onChange={(e) => setNewSupervisorEmail(e.target.value)}
                  placeholder="Supervisor Email"
                  className={inputCls}
                />
                <input
                  value={newSupervisorPhone}
                  onChange={(e) => setNewSupervisorPhone(e.target.value)}
                  placeholder="Phone (+233 ...)"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Assign Security Guard *</span>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#24395D] p-0.5 bg-slate-100 dark:bg-[#0D182D] text-[11px]">
                <button
                  type="button"
                  disabled={guards.length === 0}
                  onClick={() => setGuardMode('existing')}
                  className={`px-2.5 py-1 rounded-md font-semibold disabled:opacity-40 ${
                    guardMode === 'existing'
                      ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  Existing Guard
                </button>
                <button
                  type="button"
                  onClick={() => setGuardMode('new')}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 ${
                    guardMode === 'new'
                      ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  Deploy New Guard
                </button>
              </div>
            </div>

            {guardMode === 'existing' && guards.length > 0 ? (
              <select
                aria-label="Select guard for station"
                value={guardId}
                onChange={(e) => setGuardId(e.target.value)}
                className={inputCls}
              >
                {guards.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.employeeId}) · Currently at {g.locationName} [{g.status}]
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  value={newGuardName}
                  onChange={(e) => setNewGuardName(e.target.value)}
                  placeholder="New Guard Full Name *"
                  className={inputCls}
                />
                <input
                  value={newGuardPhone}
                  onChange={(e) => setNewGuardPhone(e.target.value)}
                  placeholder="Guard Phone (+233 ...)"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="step2-post" className="block text-xs font-semibold mb-1">
                Assigned Post / Gate
              </label>
              <input
                id="step2-post"
                value={assignPostName}
                onChange={(e) => setAssignPostName(e.target.value)}
                placeholder="Main School Gate"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="step2-shift" className="block text-xs font-semibold mb-1">
                Primary Shift
              </label>
              <select
                id="step2-shift"
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as 'Day' | 'Evening' | 'Night')}
                className={inputCls}
              >
                <option value="Day">Day Shift (06:00 AM – 02:00 PM)</option>
                <option value="Evening">Evening Shift (02:00 PM – 10:00 PM)</option>
                <option value="Night">Night Shift (10:00 PM – 06:00 AM)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-[#1E2E4A]">
            <button
              type="button"
              onClick={resetAndClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Assign Later
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{submitting ? 'Deploying Team...' : 'Assign Supervisor & Guard'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

interface StationTeamAssignModalProps {
  open: boolean;
  onClose: () => void;
  clientName: string;
  stations: LocationRecord[];
  initialLocationId?: string;
  supervisors: SupervisorRecord[];
  guards: GuardRecord[];
  onAssignStation: (payload: AssignStationPayload) => Promise<void>;
}

export function StationTeamAssignModal({
  open,
  onClose,
  clientName,
  stations,
  initialLocationId,
  supervisors,
  guards,
  onAssignStation,
}: StationTeamAssignModalProps) {
  const [locationId, setLocationId] = useState(initialLocationId ?? stations[0]?.id ?? '');
  const [supervisorMode, setSupervisorMode] = useState<'existing' | 'new'>(
    supervisors.length > 0 ? 'existing' : 'new',
  );
  const [supervisorId, setSupervisorId] = useState(supervisors[0]?.id ?? '');
  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [newSupervisorEmail, setNewSupervisorEmail] = useState('');
  const [newSupervisorPhone, setNewSupervisorPhone] = useState('');
  const [guardMode, setGuardMode] = useState<'existing' | 'new'>(
    guards.length > 0 ? 'existing' : 'new',
  );
  const [guardId, setGuardId] = useState(guards[0]?.id ?? '');
  const [newGuardName, setNewGuardName] = useState('');
  const [newGuardPhone, setNewGuardPhone] = useState('');
  const [postName, setPostName] = useState('Main Gate');
  const [shiftType, setShiftType] = useState<'Day' | 'Evening' | 'Night'>('Day');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const targetLoc =
        stations.find((s) => s.id === initialLocationId) ?? stations[0];
      setLocationId(targetLoc?.id ?? '');
      setSupervisorMode(supervisors.length > 0 ? 'existing' : 'new');
      setSupervisorId(
        targetLoc?.supervisorId && targetLoc.supervisorId !== ''
          ? targetLoc.supervisorId
          : supervisors[0]?.id ?? '',
      );
      setNewSupervisorName('');
      setNewSupervisorEmail('');
      setNewSupervisorPhone('');
      setPostName(targetLoc?.postCode || 'Main Gate');
      setGuardId(guards[0]?.id ?? '');
      setGuardMode(guards.length > 0 ? 'existing' : 'new');
      setNewGuardName('');
      setNewGuardPhone('');
      setError(null);
    }
  }, [open, initialLocationId, stations, supervisors, guards]);

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#10A878]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const check = validateStationAssignmentInput({
      locationId,
      supervisorMode,
      supervisorId,
      newSupervisorName,
      guardMode,
      guardId,
      newGuardName,
      shiftType,
    });
    if (!check.valid) {
      setError(check.error ?? 'Please select a station, supervisor, and guard.');
      return;
    }

    setSubmitting(true);
    try {
      await onAssignStation({
        locationId,
        supervisorMode,
        supervisorId: supervisorMode === 'existing' ? supervisorId : undefined,
        newSupervisorName: supervisorMode === 'new' ? newSupervisorName.trim() : undefined,
        newSupervisorEmail: supervisorMode === 'new' ? newSupervisorEmail.trim() : undefined,
        newSupervisorPhone: supervisorMode === 'new' ? newSupervisorPhone.trim() : undefined,
        guardMode,
        guardId: guardMode === 'existing' ? guardId : undefined,
        newGuardName: guardMode === 'new' ? newGuardName.trim() : undefined,
        newGuardPhone: guardMode === 'new' ? newGuardPhone.trim() : undefined,
        postName: postName.trim() || 'Main Gate',
        shiftType,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign team.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Supervisor & Guard"
      subtitle={`Station deployment for ${clientName}`}
    >
      {error && (
        <div
          role="alert"
          className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {stations.length === 0 ? (
        <p className="text-xs text-slate-500 py-4">
          No work stations found for this client yet. Add a location first to assign personnel.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="assign-station" className="block text-xs font-semibold mb-1">
              Target Client Station *
            </label>
            <select
              id="assign-station"
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                const loc = stations.find((s) => s.id === e.target.value);
                if (loc) setPostName(loc.postCode);
              }}
              className={inputCls}
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} — {st.address}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Assigned Supervisor *</span>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#24395D] p-0.5 bg-slate-100 dark:bg-[#0D182D] text-[11px]">
                <button
                  type="button"
                  disabled={supervisors.length === 0}
                  onClick={() => setSupervisorMode('existing')}
                  className={`px-2.5 py-1 rounded-md font-semibold disabled:opacity-40 ${
                    supervisorMode === 'existing'
                      ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  Existing Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => setSupervisorMode('new')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    supervisorMode === 'new'
                      ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  + New Supervisor
                </button>
              </div>
            </div>

            {supervisorMode === 'existing' && supervisors.length > 0 ? (
              <select
                id="assign-sup"
                aria-label="Select supervisor"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className={inputCls}
              >
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.employeeId})
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  required
                  value={newSupervisorName}
                  onChange={(e) => setNewSupervisorName(e.target.value)}
                  placeholder="Supervisor Name *"
                  className={inputCls}
                />
                <input
                  type="email"
                  value={newSupervisorEmail}
                  onChange={(e) => setNewSupervisorEmail(e.target.value)}
                  placeholder="Email"
                  className={inputCls}
                />
                <input
                  value={newSupervisorPhone}
                  onChange={(e) => setNewSupervisorPhone(e.target.value)}
                  placeholder="Phone"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#10A878]" />
                Assigned Guard *
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#24395D] p-0.5 bg-slate-100 dark:bg-[#0D182D] text-[11px]">
                <button
                  type="button"
                  disabled={guards.length === 0}
                  onClick={() => setGuardMode('existing')}
                  className={`px-2.5 py-1 rounded-md font-semibold disabled:opacity-40 ${
                    guardMode === 'existing'
                      ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  Existing Guard
                </button>
                <button
                  type="button"
                  onClick={() => setGuardMode('new')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    guardMode === 'new'
                      ? 'bg-white dark:bg-[#162747] text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  + New Guard
                </button>
              </div>
            </div>

            {guardMode === 'existing' && guards.length > 0 ? (
              <select
                aria-label="Select guard"
                value={guardId}
                onChange={(e) => setGuardId(e.target.value)}
                className={inputCls}
              >
                {guards.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.employeeId}) · {g.locationName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  required
                  value={newGuardName}
                  onChange={(e) => setNewGuardName(e.target.value)}
                  placeholder="Guard Full Name *"
                  className={inputCls}
                />
                <input
                  value={newGuardPhone}
                  onChange={(e) => setNewGuardPhone(e.target.value)}
                  placeholder="Phone Number"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="assign-post" className="block text-xs font-semibold mb-1">
                Post / Gate
              </label>
              <input
                id="assign-post"
                value={postName}
                onChange={(e) => setPostName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="assign-shift" className="block text-xs font-semibold mb-1">
                Shift
              </label>
              <select
                id="assign-shift"
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as 'Day' | 'Evening' | 'Night')}
                className={inputCls}
              >
                <option value="Day">Day Shift</option>
                <option value="Evening">Evening Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#24395D] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#10A878] hover:bg-[#0D9468] disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
            >
              {submitting ? 'Assigning...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
