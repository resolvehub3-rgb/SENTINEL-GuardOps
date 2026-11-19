import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, X, ArrowRight } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
];

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setMobileOpen(false);
  }, [pathname]);

  const dashboardHomePath =
    user?.role === 'company'
      ? '/company'
      : user?.role === 'supervisor'
        ? '/supervisor'
        : user?.role === 'guard'
          ? '/guard'
          : user?.role === 'admin'
            ? '/admin'
            : '/login';

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B1324] text-slate-900 dark:text-slate-100">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 h-[68px] border-b border-slate-200 dark:border-[#1E2E4A] bg-white/95 dark:bg-[#0B1324]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0 focus:outline-none">
            <BrandLogo lightText={theme === 'dark'} />
          </Link>

          {/* Desktop Center Navigation */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[#10A878] bg-[#10A878]/10'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#10213D] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#1E2E4A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <Link
                to={dashboardHomePath}
                className="h-9 px-4 rounded-lg bg-[#10A878] hover:bg-[#0E9369] text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-[#24395D] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#10A878] hover:text-[#10A878] inline-flex items-center whitespace-nowrap transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="h-9 px-4 rounded-lg bg-[#10A878] hover:bg-[#0E9369] text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <span>Register Your Company</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#1E2E4A] text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#1E2E4A] text-slate-700 dark:text-slate-200"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#0F1B33] px-4 py-4 shadow-xl">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-[#10A878] bg-[#10A878]/10'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#1E2E4A] flex flex-col gap-2.5">
              {user ? (
                <Link
                  to={dashboardHomePath}
                  className="h-11 rounded-xl bg-[#10A878] text-white text-sm font-bold flex items-center justify-center gap-2"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="h-11 rounded-xl bg-[#10A878] text-white text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <span>Register Your Company</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="h-11 rounded-xl border border-slate-200 dark:border-[#24395D] text-sm font-bold text-slate-800 dark:text-white flex items-center justify-center"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Page Body */}
      <main className="flex-1">{children}</main>

      {/* Enterprise Footer */}
      <footer className="bg-[#10213D] text-slate-300 border-t border-[#1E355C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Column 1: Brand Summary */}
            <div>
              <BrandLogo lightText />
              <p className="mt-4 text-xs leading-relaxed text-slate-300 max-w-xs">
                Security operations management platform developed by Samley Technologies. Built for
                private security companies to coordinate guards, supervisors, locations, attendance,
                incidents, and duty reports from one centralized system.
              </p>
            </div>

            {/* Column 2: Product Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Product
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/features" className="hover:text-[#10A878] transition-colors">
                    Platform Features
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="hover:text-[#10A878] transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-[#10A878] transition-colors">
                    Pricing (GH₵150 / month)
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#10A878] transition-colors">
                    Register Your Company
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Company Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Company
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/about" className="hover:text-[#10A878] transition-colors">
                    About Sentinel GuardOps
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#10A878] transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#10A878] transition-colors">
                    Portal Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Access & Support */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Access &amp; Onboarding
              </h3>
              <p className="text-xs leading-relaxed text-slate-300 mb-4">
                Ready to centralize guard deployments, field occurrence logs, and incident
                accountability for your security company?
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10A878] hover:text-emerald-300 transition-colors"
              >
                <span>Register Your Company</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>&copy; 2026 Samley Technologies. All Rights Reserved. Sentinel GuardOps.</p>
            <p className="font-medium text-slate-400">
              Enterprise Security Operations Management
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
