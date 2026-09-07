"use client";

import React from "react";
import Link from "next/link";
import { useFetchMember } from "@/hooks/members/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Plus,
  ArrowRight,
  FileText,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import SavingsCard from "@/components/members/dashboard/SavingsCard";
import LoanCard from "@/components/members/dashboard/LoanCard";
import { useFetchMemberSummary } from "@/hooks/summary/actions";
import MemberFinancialSummary from "@/components/members/dashboard/MemberFinancialSummary";

const MemberDashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 md:p-8 space-y-8 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-64 bg-slate-200 rounded" />
      </div>
      <div className="h-10 w-32 bg-slate-200 rounded" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="h-16 bg-slate-200 rounded-xl" />
      <div className="h-16 bg-slate-200 rounded-xl" />
      <div className="h-16 bg-slate-200 rounded-xl" />
      <div className="h-16 bg-slate-200 rounded-xl" />
    </div>
    <div className="grid gap-4 md:gap-6 md:grid-cols-3">
      <div className="h-28 bg-slate-200 rounded-lg" />
      <div className="h-28 bg-slate-200 rounded-lg" />
      <div className="h-28 bg-slate-200 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 h-96 bg-slate-200 rounded-lg" />
      <div className="lg:col-span-2 h-96 bg-slate-200 rounded-lg" />
    </div>
  </div>
);

function MemberDashboard() {
  const [summaryYear, setSummaryYear] = React.useState(new Date().getFullYear());

  const {
    isLoading: isLoadingMember,
    data: member,
  } = useFetchMember();

  const {
    isLoading: isLoadingSummary,
    data: summary,
  } = useFetchMemberSummary(member?.member_no, summaryYear);

  if (isLoadingMember || isLoadingSummary) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <MemberDashboardSkeleton />
      </div>
    );
  }

  // Calculate totals
  const totalSavings =
    member?.savings?.reduce(
      (acc, curr) => acc + parseFloat(curr.balance || 0),
      0,
    ) || 0;

  const activeLoansCount =
    member?.loan_accounts?.filter(
      (l) => l.status === "Active" || l.status === "Funded",
    ).length || 0;

  const totalOutstandingLoan =
    member?.loan_accounts?.reduce(
      (acc, curr) => acc + parseFloat(curr.outstanding_balance || 0),
      0,
    ) || 0;

  const availableGuarantorAmount =
    member?.guarantor_profile?.available_amount || 0;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {member?.first_name || "Member"}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Manage your SACCO accounts, apply for credit, and monitor repayments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Member ID</span>
            <span className="font-mono font-bold text-slate-900 text-sm tracking-tight">
              {member?.member_no || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/member/loan-applications" className="group">
          <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs hover:border-[var(--primary)] hover:shadow-sm transition-all">
            <div className="p-2.5 rounded-lg bg-amber-50 text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-[var(--primary)] transition-colors">Apply for Loan</p>
              <p className="text-[10px] text-slate-400">Borrow against savings</p>
            </div>
          </div>
        </Link>

        <Link href="/member/loans" className="group">
          <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs hover:border-orange-500 hover:shadow-sm transition-all">
            <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">My Loans</p>
              <p className="text-[10px] text-slate-400">View balances & terms</p>
            </div>
          </div>
        </Link>

        <Link href="/member/savings" className="group">
          <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs hover:border-emerald-500 hover:shadow-sm transition-all">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">My Savings</p>
              <p className="text-[10px] text-slate-400">View deposits & statement</p>
            </div>
          </div>
        </Link>

        <Link href="/member/guarantorprofile" className="group">
          <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs hover:border-blue-500 hover:shadow-sm transition-all">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Guarantor Profile</p>
              <p className="text-[10px] text-slate-400">Requests & capacity</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Financial Net Standing Grid */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--primary)]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Savings Portfolio
            </CardTitle>
            <div className="p-2 bg-amber-50 rounded-lg">
              <PiggyBank className="h-4 w-4 text-[var(--primary)]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {formatCurrency(totalSavings)}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Across <span className="font-semibold text-slate-700">{member?.savings?.length || 0}</span> active accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Outstanding Loan Balance
            </CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg">
              <CreditCard className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {formatCurrency(totalOutstandingLoan)}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {activeLoansCount > 0 ? (
                <span className="text-amber-600 font-semibold">{activeLoansCount} Active Loan{activeLoansCount !== 1 ? 's' : ''} in Repayment</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Zero Debt / In Good Standing ✓</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Guarantor Capacity
            </CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {formatCurrency(availableGuarantorAmount)}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Available to guarantee peers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown: Savings & Active Loans */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Savings Breakdown */}
        <Card className="col-span-1 lg:col-span-3 shadow-sm border-none bg-white h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
              <Wallet className="h-5 w-5 text-[var(--primary)]" />
              Savings Accounts
            </CardTitle>
            <Link href="/member/savings" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 font-semibold">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {member?.savings?.map((account, index) => (
                <SavingsCard
                  key={account.account_number || index}
                  account={account}
                  memberPath="member"
                />
              ))}
              {(!member?.savings || member.savings.length === 0) && (
                <p className="text-center text-slate-400 py-8 text-sm italic">
                  No active savings accounts found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Loans */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-none bg-white h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Active Loans
            </CardTitle>
            <Link href="/member/loans" className="text-xs text-orange-600 hover:underline flex items-center gap-1 font-semibold">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {member?.loan_accounts
                ?.filter((l) => l.status === "Active" || l.status === "Funded")
                .slice(0, 3)
                .map((loan, index) => (
                  <LoanCard key={loan.reference || index} loan={loan} memberPath="member" />
                ))}
              {(!member?.loan_accounts ||
                member.loan_accounts.filter(
                  (l) => l.status === "Active" || l.status === "Funded",
                ).length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <CreditCard className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600 text-sm font-medium">
                      No active loans
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Need funds? Apply online anytime.
                    </p>
                    <Link href="/member/loan-applications" className="mt-3">
                      <Button size="sm" variant="outline" className="text-xs text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/5">
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="mt-8">
        <MemberFinancialSummary
          summary={summary}
          memberNo={member?.member_no}
          summaryYear={summaryYear}
          setSummaryYear={setSummaryYear}
        />
      </div>
    </div>
  );
}

export default MemberDashboard;
