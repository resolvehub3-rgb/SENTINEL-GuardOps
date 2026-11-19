import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Lock, Mail, Phone, User } from 'lucide-react';
import { MarketingLayout } from '../../components/marketing/MarketingLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { validateCompanyRegistrationInput } from '../../utils/operations';
import { usePageMeta } from '../../utils/seo';

export function RegisterPage() {
  usePageMeta(
    'Register Your Security Company | Sentinel GuardOps',
    'Create your Sentinel GuardOps security company account and begin organizing guards, supervisors, locations, and shift reports at GH₵150/month.',
  );

  const { registerCompany } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateCompanyRegistrationInput({
      companyName,
      contactName,
      email,
      password,
    });
    if (!validation.valid) {
      setError(validation.error ?? 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await registerCompany({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      showToast({
        title: 'Company Registered',
        description: 'Your Sentinel GuardOps company workspace is ready.',
        tone: 'success',
      });
      navigate('/company', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register company.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketingLayout>
      <section className="py-12 sm:py-16 bg-slate-50 dark:bg-[#0D162B]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Context Column */}
          <div className="lg:col-span-5 space-y-6 pt-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-2">
                Company Onboarding
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#10213D] dark:text-white">
                Bring Your Security Operations Together.
              </h1>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Register your security company to launch your centralized Company Operations
                Dashboard, add supervisors and guards, and monitor every secured site.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-6 space-y-4">
              <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-[#1E2E4A] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#10A878]">
                  Complete Plan
                </span>
                <span className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                  GH₵150 <span className="text-xs font-medium text-slate-500">/ month</span>
                </span>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10A878] shrink-0 mt-0.5" />
                  <span>Full Company, Supervisor &amp; Guard portals included</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10A878] shrink-0 mt-0.5" />
                  <span>Digital Occurrence Book &amp; incident evidence tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10A878] shrink-0 mt-0.5" />
                  <span>Immediate access to your company workspace upon signup</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Registration Form */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Register Your Security Company
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 mb-6">
              Create your primary security company owner account. Client accounts are added directly
              inside your Company Dashboard.
            </p>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="reg-company-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Security Company Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-company-name"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Sentinel Force Security Ltd"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-contact-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Primary Contact Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-contact-name"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Samuel Mensah"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+233 ..."
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Work Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@company.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password (Minimum 8 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[#10A878] hover:bg-[#0E9369] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>{submitting ? 'Creating Company Account...' : 'Create Company Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#1E2E4A] text-center text-xs text-slate-500 dark:text-slate-400">
              Already registered with Sentinel GuardOps?{' '}
              <Link to="/login" className="font-bold text-[#10A878] hover:underline">
                Sign in to your portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
