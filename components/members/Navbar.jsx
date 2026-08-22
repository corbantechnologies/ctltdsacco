"use client";
import { SACCO_CONFIG } from "@/lib/sacco-config";

import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Menu as MenuIcon,
  X as XIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
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

// --- Removed Dark Mode Toggle ---

const MENU_LINKS = [
  { label: "Dashboard", href: "/member/dashboard" },
  { label: "My Savings", href: "/member/savings" },
  { label: "Loan Applications", href: "/member/loan-applications" },
  { label: "Guarantor Profile", href: "/member/guarantorprofile" },
  { label: "Profile Settings", href: "/member/settings" },
  { label: "Help Center", href: "/member/help" },
];

function MemberNavbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isCollapsed, toggle } = useMemberSidebar();

  const sidebarContent = (setIsMenuOpen) => (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
        <Link
          href="/member/dashboard"
          className="flex items-center gap-2"
          onClick={() => setIsMenuOpen && setIsMenuOpen(false)}
        >
          <span className="text-xl font-bold tracking-tight text-[var(--primary)]">
            {SACCO_CONFIG.name}
            <span className="text-[10px] font-normal uppercase tracking-[2px] opacity-75 ml-1.5 block text-slate-500 dark:text-slate-400">
              MEMBER PORTAL
            </span>
          </span>
        </Link>
        {setIsMenuOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(false)}
            className="md:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <XIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {MENU_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2.5 text-[14px] font-semibold rounded transition-colors ${
                isActive
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[var(--primary)]"
              }`}
              onClick={() => setIsMenuOpen && setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t dark:border-slate-700">
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded font-semibold dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
          onClick={() => {
            if (setIsMenuOpen) setIsMenuOpen(false);
            signOut({ callbackUrl: "/login" });
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Top Navbar */}
      <header className="bg-[var(--primary)] text-white z-30 shadow h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 mr-1 md:hidden"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 mr-1 hidden md:flex"
            onClick={toggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
          <Link href="/member/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              {SACCO_CONFIG.name}
              <span className="text-[10px] font-normal uppercase tracking-[2px] opacity-75 ml-1.5 hidden sm:inline-block">
                MEMBER PORTAL
              </span>
            </span>
          </Link>
        </div>
        
      </header>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r dark:border-slate-700 shadow-2xl flex flex-col transition-transform duration-300 md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent(setIsMobileOpen)}
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r dark:border-slate-700 shadow-sm transition-all duration-300 overflow-hidden ${
          isCollapsed ? "w-0 border-r-0" : "w-64"
        }`}
      >
        {sidebarContent(null)}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

export default MemberNavbar;
