import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { LoginPage } from './pages/LoginPage';
import { CompanyPortal } from './pages/company/CompanyPortal';
import { SupervisorPortal } from './pages/supervisor/SupervisorPortal';
import { GuardMobilePortal } from './pages/guard/GuardMobilePortal';
import { AdminPortal } from './pages/admin/AdminPortal';
import { HomePage } from './pages/marketing/HomePage';
import { FeaturesPage } from './pages/marketing/FeaturesPage';
import { HowItWorksPage } from './pages/marketing/HowItWorksPage';
import { PricingPage } from './pages/marketing/PricingPage';
import { AboutPage } from './pages/marketing/AboutPage';
import { ContactPage } from './pages/marketing/ContactPage';
import { RegisterPage } from './pages/marketing/RegisterPage';
import { BrandLogo } from './components/common/BrandLogo';
import { GlobalMaintenanceWatcher } from './components/common/MaintenanceModal';

function RoleRouter() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1324] flex flex-col items-center justify-center gap-3 text-white">
        <BrandLogo size="lg" lightText />
        <p className="text-xs text-slate-400 font-medium">Initializing secure workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const homePath =
    user.role === 'company'
      ? '/company'
      : user.role === 'supervisor'
        ? '/supervisor'
        : user.role === 'guard'
          ? '/guard'
          : '/admin';

  const isAutostart = new URLSearchParams(location.search).get('autostart') === '1';
  if (isAutostart && !location.pathname.startsWith(homePath)) {
    return <Navigate to={homePath} replace />;
  }

  const onCustomerDashboard =
    location.pathname.startsWith('/company') ||
    location.pathname.startsWith('/supervisor') ||
    location.pathname.startsWith('/guard');

  return (
    <>
      {onCustomerDashboard && <GlobalMaintenanceWatcher />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register" element={<Navigate to={homePath} replace />} />
        <Route path="/login" element={<Navigate to={homePath} replace />} />
        {user.role === 'company' && <Route path="/company/*" element={<CompanyPortal />} />}
        {user.role === 'supervisor' && (
          <Route path="/supervisor/*" element={<SupervisorPortal />} />
        )}
        {user.role === 'guard' && <Route path="/guard/*" element={<GuardMobilePortal />} />}
        {user.role === 'admin' && <Route path="/admin/*" element={<AdminPortal />} />}
        <Route path="*" element={<Navigate to={homePath} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RealtimeProvider>
            <BrowserRouter>
              <RoleRouter />
            </BrowserRouter>
          </RealtimeProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
