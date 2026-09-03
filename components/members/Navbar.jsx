"use client";
import { SACCO_CONFIG } from "@/lib/sacco-config";

import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Menu as MenuIcon,
  X as XIcon,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  PiggyBank,
  FileText,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
  User,
} from "lucide-react";

// ─── Sidebar Context ──────────────────────────────────────────────────────────
export const MemberSidebarContext = createContext({ isCollapsed: false, toggle: () => {} });
export const useMemberSidebar = () => useContext(MemberSidebarContext);

export function MemberSidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sacco-member-sidebar-collapsed");
      if (stored !== null) setIsCollapsed(JSON.parse(stored));
    } catch {}
  }, []);

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("sacco-member-sidebar-collapsed", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <MemberSidebarContext.Provider value={{ isCollapsed, toggle }}>
      {children}
    </MemberSidebarContext.Provider>
  );
}

const MENU_LINKS = [
  { label: "Dashboard", href: "/member/dashboard", icon: LayoutDashboard },
  { label: "My Savings", href: "/member/savings", icon: PiggyBank },
  { label: "Loan Applications", href: "/member/loan-applications", icon: FileText },
  { label: "Guarantor Profile", href: "/member/guarantorprofile", icon: ShieldCheck },
  { label: "Profile Settings", href: "/member/settings", icon: Settings },
  { label: "Help Center", href: "/member/help", icon: HelpCircle },
];

function MemberNavbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isCollapsed, toggle } = useMemberSidebar();
  const { data: session } = useSession();

  const sidebarContent = (setIsMenuOpen) => (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link
          href="/member/dashboard"
          className="flex flex-col gap-0.5"
          onClick={() => setIsMenuOpen && setIsMenuOpen(false)}
        >
          <span className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors">
            {SACCO_CONFIG.name}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[2px] text-emerald-400">
            MEMBER PORTAL
          </span>
        </Link>
        {setIsMenuOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <XIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {MENU_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 font-semibold shadow-sm border border-emerald-500/20"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
              onClick={() => setIsMenuOpen && setIsMenuOpen(false)}
            >
              {Icon && (
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
              )}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Logout Area */}
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="outline"
          className="w-full bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          onClick={() => {
            if (setIsMenuOpen) setIsMenuOpen(false);
            signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Top Navbar */}
      <header
        className={`bg-[var(--primary)] text-white sticky top-0 z-30 shadow-md h-16 flex items-center justify-between px-4 md:px-6 transition-all duration-300 ${
          isCollapsed ? "md:pl-6" : "md:pl-[17rem]"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 md:hidden"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <MenuIcon className="h-6 w-6" />
          </Button>

          {/* Desktop sidebar toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hidden md:flex"
            onClick={toggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>

          {/* Title based on sidebar collapse state */}
          {isCollapsed ? (
            <Link href="/member/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                {SACCO_CONFIG.name}
                <span className="text-[10px] font-semibold uppercase tracking-[2px] opacity-85 ml-1.5 hidden sm:inline-block">
                  MEMBER PORTAL
                </span>
              </span>
            </Link>
          ) : (
            <span className="text-sm font-semibold tracking-wider text-white/90 uppercase hidden sm:inline-block">
              Member Portal
            </span>
          )}
        </div>

        {/* Right side user info */}
        <div className="flex items-center gap-3">
          {session?.user && (
            <div className="flex items-center gap-2.5">
              {session.user.member_no && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-white/15 text-white border border-white/20">
                  {session.user.member_no}
                </span>
              )}
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs uppercase border border-white/30 shadow-inner">
                  {session.user.name ? session.user.name[0] : <User className="h-4 w-4" />}
                </div>
                <span className="text-xs font-medium hidden md:inline-block max-w-[130px] truncate">
                  {session.user.name || "Member"}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent(setIsMobileOpen)}
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-800 shadow-lg transition-all duration-300 overflow-hidden ${
          isCollapsed ? "w-0 border-r-0" : "w-64"
        }`}
      >
        {sidebarContent(null)}
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

export default MemberNavbar;
