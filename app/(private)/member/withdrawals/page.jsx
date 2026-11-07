"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownCircle } from "lucide-react";
import { useFetchSavings } from "@/hooks/savings/actions";
import { useFetchSavingsWithdrawals } from "@/hooks/savingswithdrawals/actions";
import CreateWithdrawal from "@/forms/savingswithdrawals/CreateWithdrawal";
import MemberLoadingSpinner from "@/components/general/MemberLoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SACCO_CONFIG } from "@/lib/sacco-config";

const formatKES = (value) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(Number(value || 0));

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-slate-100 text-slate-600 border-slate-200",
  Failed: "bg-red-50 text-red-700 border-red-200",
  Reversed: "bg-slate-100 text-slate-600 border-slate-200",
};

function WithdrawalsPage() {
  const enabled = SACCO_CONFIG.enableWithdrawals;
  const { data: savings, isLoading: loadingSavings } = useFetchSavings();
  const {
    data: withdrawals,
    isLoading: loadingWithdrawals,
    isError,
    refetch,
  } = useFetchSavingsWithdrawals(enabled);
  const [account, setAccount] = useState(null);

  const accounts = useMemo(() => {
    const list = Array.isArray(savings) ? savings : savings?.results || [];
    return list.filter((a) => a.is_active !== false);
  }, [savings]);

  if (!enabled) {
    return (
      <div className="p-8 text-center text-slate-600">
        Your SACCO does not take withdrawal requests through the portal. Please contact the office.
      </div>
    );
  }

  if (loadingSavings || loadingWithdrawals) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MemberLoadingSpinner />
      </div>
    );
  }

  const rows = withdrawals || [];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/member/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Withdrawals</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-xl font-semibold text-slate-900">Withdrawals</h1>
          <p className="text-sm text-slate-500">
            Ask to withdraw from a savings account. Your SACCO approves each request before the money is paid out.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Request a withdrawal</h2>
          {accounts.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-6 text-center text-sm text-slate-500">
              You have no active savings accounts.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accounts.map((a) => (
                <div key={a.reference || a.account_number} className="rounded-lg border bg-white p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{a.account_type}</p>
                    <p className="text-xs text-slate-500">{a.account_number}</p>
                    <p className="text-sm text-slate-700 mt-1">Balance {formatKES(a.balance)}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAccount(a)}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shrink-0"
                  >
                    <ArrowDownCircle className="h-4 w-4 mr-1" /> Withdraw
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Your requests</h2>
          {isError ? (
            <div className="rounded-lg border bg-white p-6 text-center text-sm text-red-600">
              Couldn&apos;t load your withdrawals.{" "}
              <button className="underline" onClick={() => refetch()}>Try again</button>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-6 text-center text-sm text-slate-500">
              Nothing here yet.
            </div>
          ) : (
            <div className="rounded-lg border bg-white divide-y">
              {rows.map((w) => (
                <div key={w.reference || w.identity} className="p-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{formatKES(w.amount)}</p>
                    <p className="text-xs text-slate-500">
                      {w.savings_account} · {String(w.transaction_date || w.created_at || "").slice(0, 10)}
                    </p>
                    {w.rejection_reason && (
                      <p className="text-xs text-slate-600 mt-1">Reason: {w.rejection_reason}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded border ${STATUS_STYLES[w.transaction_status] || STATUS_STYLES.Pending}`}>
                    {w.transaction_status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500">
            See a single account&apos;s full history on{" "}
            <Link href="/member/savings" className="underline">My Savings</Link>.
          </p>
        </section>
      </div>

      {account && (
        <CreateWithdrawal
          isOpen={!!account}
          onClose={() => setAccount(null)}
          account={account}
          refetchAccount={() => refetch()}
        />
      )}
    </div>
  );
}

export default WithdrawalsPage;
