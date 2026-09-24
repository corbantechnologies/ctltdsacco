"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFetchMember } from "@/hooks/members/actions";
import MemberLoadingSpinner from "@/components/general/MemberLoadingSpinner";
import { CreditCard, PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function LoansPage() {
    const router = useRouter();
    const { data: member, isLoading, isError } = useFetchMember();

    const activeLoan = useMemo(() => {
        if (!member?.loan_accounts || member.loan_accounts.length === 0) return null;
        // Prioritize active or funded loans, fallback to the most recent loan
        return (
            member.loan_accounts.find((l) => l.status === "Active" || l.status === "Funded") ||
            member.loan_accounts[0]
        );
    }, [member]);

    useEffect(() => {
        if (activeLoan) {
            const ref = activeLoan.reference || activeLoan.account_number;
            router.replace(`/member/loans/${ref}`);
        }
    }, [activeLoan, router]);

    if (isLoading || activeLoan) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6">
                <div className="text-center space-y-3">
                    <MemberLoadingSpinner />
                    <p className="text-sm font-medium text-slate-600">Loading your loan account...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-8 text-center">
                <p className="text-red-500 font-medium">Failed to load member profile.</p>
                <Button className="mt-4" onClick={() => router.push("/member/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

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

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 sm:p-12 text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-amber-50 text-[var(--primary)] flex items-center justify-center mx-auto">
                        <CreditCard className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">No Active Loan Account</h2>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                            You currently do not have an active loan account with us. You can apply for a new loan anytime based on your savings and guarantor standing.
                        </p>
                    </div>
                    <div className="pt-2 flex justify-center gap-3">
                        <Button asChild className="bg-[#045e32] hover:bg-[#034625] text-white">
                            <Link href="/member/loan-applications" className="flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" /> Apply for Loan
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/member/dashboard">
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoansPage;