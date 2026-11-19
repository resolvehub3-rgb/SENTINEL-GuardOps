import React, { useState } from 'react';
import {
  Building2,
  ClipboardCheck,
  Lock,
  Mail,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/common/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePageMeta } from '../utils/seo';
import type { UserRole } from '../types/guardops';

const PORTALS: Array<{
  role: UserRole;
  title: string;
  subtitle: string;
  icon: typeof Building2;
}> = [
  {
    role: 'company',
    title: 'Company Owner',
    subtitle: 'Acme Security Ltd',
    icon: Building2,
  },
  {
    role: 'supervisor',
    title: 'Supervisor',
    subtitle: 'Field Ops Lead',
    icon: ClipboardCheck,
  },
  {
    role: 'guard',
    title: 'Security Guard',
    subtitle: 'Mobile Duty App',
    icon: Smartphone,
  },
  {
    role: 'admin',
    title: 'Super Admin',
    subtitle: 'Samley Platform',
    icon: ShieldCheck,
  },
];

export function LoginPage() {
  usePageMeta(
    'Sign In | Sentinel GuardOps',
    'Sign in to your Sentinel GuardOps Company, Supervisor, Guard, or Platform Admin portal.',
  );
  const { loginWithCredentials, loginToPortal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting('form');
    try {
      await loginWithCredentials(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(null);
    }
  };

  const handlePortalAccess = async (role: UserRole) => {
    setError(null);
    setSubmitting(role);
    try {
      await loginToPortal(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portal sign-in failed');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0B1324] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Minimal Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="focus:outline-none">
            <BrandLogo lightText={theme === 'dark'} />
          </Link>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#10A878] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Website</span>
          </Link>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Centered Minimalist Auth Card */}
      <main className="w-full max-w-[460px] mx-auto my-8">
        <div className="rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-3">
              <BrandLogo compact size="lg" lightText={theme === 'dark'} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to Sentinel GuardOps
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Authorized security operations access
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50 dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting !== null}
              className="w-full h-11 rounded-xl bg-[#10A878] hover:bg-[#0E9369] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>{submitting === 'form' ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Role-Isolated Portal Quick Entry */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#1E2E4A]">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center mb-3">
              Select an isolated role portal
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {PORTALS.map((portal) => {
                const Icon = portal.icon;
                const isBusy = submitting === portal.role;
                return (
                  <button
                    key={portal.role}
                    type="button"
                    disabled={submitting !== null}
                    onClick={() => void handlePortalAccess(portal.role)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-[#24395D] bg-slate-50/80 dark:bg-[#0D182D] hover:border-[#10A878] hover:bg-emerald-500/5 text-left transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#10213D] text-[#10A878] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {isBusy ? 'Opening...' : portal.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {portal.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
              New security company?{' '}
              <Link to="/register" className="font-bold text-[#10A878] hover:underline">
                Register Your Company
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-slate-500 dark:text-slate-500">
        Samley Technologies · Sentinel GuardOps Security Operations Platform
      </footer>
    </div>
  );
}
