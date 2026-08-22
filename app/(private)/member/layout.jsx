"use client";
import MemberNavbar, { MemberSidebarProvider, useMemberSidebar } from "@/components/members/Navbar";
import React from "react";

const metadata = {
  title: "Member Dashboard",
  description: "Member Dashboard",
};

function MemberContent({ children }) {
  const { isCollapsed } = useMemberSidebar();
  return (
    <main className="transition-all duration-300">
      <div className={`transition-all duration-300 ${isCollapsed ? "md:pl-0" : "md:pl-64"}`}>
        {children}
      </div>
    </main>
  );
}

function MemberLayout({ children }) {
  return (
    <MemberSidebarProvider>
      <div className="min-h-screen bg-background">
        <MemberNavbar />
        <MemberContent>{children}</MemberContent>
      </div>
    </MemberSidebarProvider>
  );
}

export default MemberLayout;
