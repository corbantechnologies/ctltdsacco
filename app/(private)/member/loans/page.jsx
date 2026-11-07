"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFetchMember } from "@/hooks/members/actions";
import MemberLoadingSpinner from "@/components/general/MemberLoadingSpinner";
import { CreditCard, PlusCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const STATUS_ORDER = { Active: 0, Funded: 1, Defaulted: 2, "Written Off": 3, Closed: 4 };

const STATUS_STYLES = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Funded: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Defaulted: "bg-red-50 text-red-700 border-red-100",
    "Written Off": "bg-red-50 text-red-700 border-red-100",
    Closed: "bg-slate-100 text-slate-600 border-slate-200",
};

const ARREARS_STYLES = {
    "In Arrears": "bg-amber-50 text-amber-700 border-amber-100",
    Defaulted: "bg-red-50 text-red-700 border-red-100",
};

function LoanRow({ loan }) {
    const ref = loan.reference || loan.account_number;
    return (
        <Link
            href={`/member/loans/${ref}`}
            className="block bg-white rounded-xl border border-slate-200/80 p-4 hover:shadow-sm hover:border-slate-300 transition"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                        {/loan$/i.test(String(loan.product || "").trim()) ? loan.product : `${loan.product} Loan`}
                    </p>
                    <p className="text-xs text-slate-500 break-all">{loan.account_number}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[loan.status] || STATUS_STYLES.Closed}`}
                    >
                        {loan.status}
                    </span>
                    {loan.status === "Active" && ARREARS_STYLES[loan.arrears_stage] && (
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${ARREARS_STYLES[loan.arrears_stage]}`}
                        >
                            {loan.arrears_stage}
                            {loan.days_in_arrears ? ` · ${loan.days_in_arrears}d` : ""}
                        </span>
                    )}
                </div>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                    <p className="text-xs text-slate-500">Principal</p>
                    <p className="font-medium text-slate-900">{formatCurrency(loan.principal)}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(loan.outstanding_balance)}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Paid so far</p>
                    <p className="font-medium text-slate-900">{formatCurrency(loan.total_amount_paid)}</p>
                </div>
                <div className="flex items-end justify-between sm:block">
                    <div>
                        <p className="text-xs text-slate-500">Started</p>
                        <p className="font-medium text-slate-900">{loan.start_date || "Not yet"}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 sm:hidden" />
                </div>
            </div>
        </Link>
    );
}

function LoansPage() {
    const router = useRouter();
    const { data: member, isLoading, isError } = useFetchMember();

    // Every loan account the member has, open loans first, newest first.
    const loans = useMemo(() => {
        const list = [...(member?.loan_accounts || [])];
        return list.sort((a, b) => {
            const byStatus = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
            if (byStatus !== 0) return byStatus;
            return String(b.created_at || "").localeCompare(String(a.created_at || ""));
        });
    }, [member]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6">
                <div className="text-center space-y-3">
                    <MemberLoadingSpinner />
                    <p className="text-sm font-medium text-slate-600">Loading your loans...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-8 text-center">
                <p className="text-red-500 font-medium">Failed to load your loans.</p>
                <Button className="mt-4" onClick={() => router.push("/member/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    const openLoans = loans.filter((l) => l.status !== "Closed" && l.status !== "Written Off");
    const totalBalance = openLoans.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="w-full px-4 sm:px-6 py-6 space-y-6 max-w-4xl mx-auto">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/member/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbPage>My Loans</BreadcrumbPage>
                    </BreadcrumbList>
                </Breadcrumb>

                {loans.length > 0 ? (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">My Loans</h1>
                                <p className="text-sm text-slate-500">
                                    {openLoans.length} open {openLoans.length === 1 ? "loan" : "loans"}, total balance{" "}
                                    <span className="font-semibold text-slate-900">{formatCurrency(totalBalance)}</span>
                                </p>
                            </div>
                            <Button asChild className="bg-[#045e32] hover:bg-[#034625] text-white w-full sm:w-auto">
                                <Link href="/member/loan-applications" className="flex items-center justify-center gap-2">
                                    <PlusCircle className="h-4 w-4" /> Apply for Loan
                                </Link>
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {loans.map((loan) => (
                                <LoanRow key={loan.reference || loan.account_number} loan={loan} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 sm:p-12 text-center space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-amber-50 text-[var(--primary)] flex items-center justify-center mx-auto">
                            <CreditCard className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-900">No Loan Accounts</h2>
                            <p className="text-sm text-slate-500 max-w-md mx-auto">
                                You do not have a loan account with us yet. You can apply for a loan anytime based on your savings and guarantor standing.
                            </p>
                        </div>
                        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                            <Button asChild className="bg-[#045e32] hover:bg-[#034625] text-white">
                                <Link href="/member/loan-applications" className="flex items-center justify-center gap-2">
                                    <PlusCircle className="h-4 w-4" /> Apply for Loan
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/member/dashboard">Back to Dashboard</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoansPage;
