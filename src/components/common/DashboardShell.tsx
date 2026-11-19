import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { NotificationRecord } from '../../types/guardops';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badgeCount?: number;
}

export interface SidebarNavGroup {
  groupLabel?: string;
  items: SidebarNavItem[];
}

interface DashboardShellProps {
  headerTitle: string;
  headerSubtitle: string;
  orgLabel: string;
  groups: SidebarNavGroup[];
  activeRoute: string;
  onNavigate: (routeId: string) => void;
  notifications: NotificationRecord[];
  onMarkNotificationRead: (id: string) => void;
  children: React.ReactNode;
}

export function DashboardShell({
  headerTitle,
  headerSubtitle,
  orgLabel,
  groups,
  activeRoute,
  onNavigate,
  notifications,
  onMarkNotificationRead,
  children,
}: DashboardShellProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNavContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-[#0D1A33] text-slate-200 border-r border-[#1A2C4E]">
      <div
        className={`h-16 flex items-center justify-between border-b border-[#1A2C4E] shrink-0 ${
          collapsed && !isMobile ? 'px-2 gap-1' : 'px-4'
        }`}
      >
        <BrandLogo
          compact={collapsed && !isMobile}
          size={collapsed && !isMobile ? 'sm' : 'md'}
          lightText
        />
        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <nav
        aria-label="Role sidebar navigation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
      >
        {groups.map((group, idx) => (
          <div key={group.groupLabel ?? idx} className="space-y-1">
            {group.groupLabel && !(collapsed && !isMobile) && (
              <p className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400/80">
                {group.groupLabel}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    if (isMobile) setMobileOpen(false);
                  }}
                  title={collapsed && !isMobile ? item.label : undefined}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#10A878] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!(collapsed && !isMobile) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </span>
                  {!(collapsed && !isMobile) &&
                    typeof item.badgeCount === 'number' &&
                    item.badgeCount > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#1B2F54] text-emerald-300'
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#1A2C4E] shrink-0">
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-red-500/15 transition-colors whitespace-nowrap"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!(collapsed && !isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F1F5F9] dark:bg-[#0B1324] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderNavContent(false)}</div>
      </aside>

      {/* Mobile / Tablet Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-68 max-w-[82vw] h-full">
            {renderNavContent(true)}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#10213D] text-white border-b border-[#1D355D] px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-200 hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden shrink-0">
              <BrandLogo compact size="sm" lightText />
            </div>
            <div className="flex items-baseline gap-2.5 min-w-0 truncate">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                {headerTitle}
              </h1>
              <span className="hidden md:inline text-slate-400" aria-hidden="true">
                |
              </span>
              <p className="hidden md:inline text-xs font-medium text-slate-300 truncate">
                {headerSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                aria-label="Open notifications"
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#10A878] text-[10px] font-bold text-white flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-[#1E2E4A] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Notifications
                    </span>
                    <span className="text-xs font-semibold text-[#10A878] tabular-nums">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1C2C49]">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                        No notifications for this portal.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                            !n.read ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </p>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {n.timeAgo}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {n.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/14 transition-colors text-xs font-semibold whitespace-nowrap"
              >
                <span className="w-7 h-7 rounded-full bg-[#10A878] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {user?.initials ?? 'SG'}
                </span>
                <span className="hidden sm:inline max-w-[160px] truncate">{orgLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-[#1E2E4A]">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.title}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8"
                    >
                      Portal Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Switch Portal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
