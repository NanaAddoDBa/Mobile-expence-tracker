import React, { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  ScanLine,
  User,
  Bell,
  Wallet,
  Menu,
  X,
  LogOut,
  Sliders,
  Check,
  CircleDollarSign,
} from "lucide-react";
import { ActiveView, useAppNavigation } from "../../app/providers/AppNavigationProvider";
import { useMockAuth } from "../../app/providers/MockAuthProvider";
import { useNotifications } from "../../app/providers/NotificationProvider";
import { USES_HTTP_API } from "../../services/api/apiMode";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const {
    activeView,
    setActiveView,
    openProfileTab,
  } = useAppNavigation();
  const {
    currentUser,
    logout,
  } = useMockAuth();
  const {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
  } = useNotifications();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "expenses", label: "Expenses", icon: <Receipt className="w-5 h-5" /> },
    { id: "income", label: "Income", icon: <CircleDollarSign className="w-5 h-5" /> },
    { id: "budgets", label: "Budgets", icon: <Sliders className="w-5 h-5" /> },
    { id: "goals", label: "Goals", icon: <PiggyBank className="w-5 h-5" /> },
    { id: "receipts", label: "Receipts", icon: <ScanLine className="w-5 h-5" /> },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  ] as const;

  const bottomNavItems = [
    menuItems[0],
    menuItems[1],
    menuItems[2],
    menuItems[3],
    menuItems[6],
  ] as const;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleNav = (view: ActiveView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col md:flex-row transition-colors duration-200">
      
      {/* LEFT SIDEBAR - DESKTOP ONLY */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 z-20">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <Wallet className="w-5 h-5" color="currentColor" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Expense Tracker
          </span>
        </div>

        {/* User Badge Info */}
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-semibold flex items-center justify-center text-xs tracking-wider border border-indigo-100 dark:border-indigo-900/30">
            {getInitials(currentUser?.name)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
              {currentUser?.name || "Demo User"}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-1">
              {currentUser?.email || "demo@example.com"}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 py-4">
          {menuItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5 text-current" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* HEADER BAR FOR MOBILE OR ACTIONS */}
      <div className="md:pl-64 flex flex-col flex-1 w-full pb-16 md:pb-0">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 h-16 flex items-center justify-between px-4 md:px-8 z-30">
          
          {/* Mobile hamburger menu */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 dark:text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Expense Tracker
            </span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {menuItems.find((item) => item.id === activeView)?.label || "Dashboard"}
            </h1>
          </div>

          {/* Action Inbox Tools */}
          <div className="flex items-center gap-4 relative">
            
            {/* Quick overview metric (desktop-only inline context) */}
            <button
              type="button"
              onClick={() => openProfileTab("demo")}
              className="hidden lg:flex items-center gap-1.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-500/10 border border-slate-100 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              title="Mock services are used. No real banking, payment, or OCR APIs are connected."
            >
              <span className="text-emerald-500 font-bold">•</span>{" "}
              {USES_HTTP_API ? "Backend API active" : "Mock data active"}
            </button>

            {/* Notification bell dropdown button */}
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Dropdown element */}
            {notifDropdownOpen && (
              <>
                <button
                  onClick={() => setNotifDropdownOpen(false)}
                  className="fixed inset-0 cursor-default bg-transparent w-full h-full z-40"
                  aria-label="Close Notifications"
                />
                <div className="absolute right-0 top-11 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl w-80 py-2.5 max-h-[420px] flex flex-col z-50 overflow-hidden animate-slide-up">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Budget Alerts ({unreadCount})
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Dismiss All
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto max-h-72 flex-1 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 px-4">
                        No recent alerts.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex gap-2.5 ${
                            notif.isRead ? "opacity-60" : "opacity-100 font-semibold"
                          }`}
                        >
                          <div className="pt-0.5">
                            {notif.type === "warning" ? (
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex shrink-0" />
                            ) : notif.type === "success" ? (
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 bg-sky-500 rounded-full flex shrink-0" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-slate-400 mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {!notif.isRead && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 self-center"
                              title="Dismiss"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Micro initials circle (mobile quick logout or profile jump) */}
            <button
              onClick={() => setActiveView("profile")}
              className="md:hidden w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-100 dark:border-indigo-950"
            >
              {getInitials(currentUser?.name)}
            </button>
          </div>
        </header>

        {/* MOBILE SLIDE-OUT DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity w-full h-full cursor-default"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close Mobile Nav background"
            />
            <div className="relative bg-white dark:bg-slate-900 w-64 h-full flex flex-col p-4 shadow-xl border-l border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-1">
                {menuItems.map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold rounded-xl transition-all"
                >
                  <LogOut className="w-5 h-5 text-current" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CORE VIEWS VIEWPORT CONTAINER */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in focus:outline-hidden">
          {children}
        </main>

        {/* BOTTOM FIXED METRO NAV - MOBILE ONLY */}
        <nav
          aria-label="Mobile primary navigation"
          className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/60 px-2 py-2 flex items-center justify-around md:hidden z-30 shadow-lg"
        >
          {bottomNavItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
                aria-label={item.label}
              >
                {React.cloneElement(item.icon, { className: "w-5 h-5 stroke-2" })}
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
};
