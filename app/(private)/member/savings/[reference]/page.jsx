"use client";

import React, { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useParams } from "next/navigation";
import { useFetchSavingDetail } from "@/hooks/savings/actions";
import { useFetchMember } from "@/hooks/members/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Percent,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Building2,
  Calendar,
  CreditCard,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import MpesaCreateDepositForm from "@/forms/savingsdeposits/MpesaCreateDepositForm";
import toast from "react-hot-toast";
import { SACCO_CONFIG } from "@/lib/sacco-config";

function SavingsDetail() {
  const { reference } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const itemsPerPage = 20;

  const {
    isLoading: isLoadingSaving,
    data: saving,
    refetch: refetchSaving,
  } = useFetchSavingDetail(reference);

  const {
    isLoading: isLoadingMember,
    data: member,
  } = useFetchMember();

  // --- Computed Transactions & Stat Metrics ---
  const allTransactions = useMemo(() => {
    if (!saving) return [];
    const deposits = (saving.deposits || []).map((deposit) => ({
      ...deposit,
      type: "Deposit",
      method: deposit.payment_method || "M-Pesa / Bank",
      status: deposit.transaction_status || "Completed",
      date: deposit.created_at,
    }));
    const withdrawals = (saving.withdrawals || []).map((withdrawal) => ({
      ...withdrawal,
      type: "Withdrawal",
      method: withdrawal.payment_method || "N/A",
      status: withdrawal.transaction_status || "Completed",
      date: withdrawal.created_at,
    }));
    return [...deposits, ...withdrawals].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [saving]);

  const stats = useMemo(() => {
    const totalDeposits = (saving?.deposits || []).reduce(
      (sum, d) => sum + (parseFloat(d.amount) || 0),
      0
    );
    const totalWithdrawals = (saving?.withdrawals || []).reduce(
      (sum, w) => sum + (parseFloat(w.amount) || 0),
      0
    );
    return {
      totalDeposits,
      totalWithdrawals,
    };
  }, [saving]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "DEPOSIT" && t.type === "Deposit") ||
        (typeFilter === "WITHDRAWAL" && t.type === "Withdrawal");

      const matchesSearch =
        !searchTerm ||
        (t.reference && t.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.method && t.method.toLowerCase().includes(searchTerm.toLowerCase()));

      const tDate = new Date(t.date);
      let matchesMonth = true;
      if (monthFilter) {
        const [year, month] = monthFilter.split("-").map(Number);
        const start = startOfMonth(new Date(year, month - 1));
        const end = endOfMonth(new Date(year, month - 1));
        matchesMonth = isWithinInterval(tDate, { start, end });
      }

      return matchesType && matchesSearch && matchesMonth;
    });
  }, [allTransactions, typeFilter, searchTerm, monthFilter]);

  // Pagination
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount) =>
    `KES ${parseFloat(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (dateStr) =>
    dateStr ? format(new Date(dateStr), "MMM dd, yyyy · hh:mm a") : "N/A";

  const copyAccountNumber = () => {
    if (saving?.account_number) {
      navigator.clipboard.writeText(saving.account_number);
      setCopied(true);
      toast.success("Account number copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- PDF Generator ---
  const generateTransactionPDF = () => {
    const doc = new jsPDF();
    const margin = 14;
    let y = 18;

    doc.setFontSize(16);
    doc.setTextColor(4, 94, 50);
    doc.text("SAVINGS ACCOUNT STATEMENT", margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, margin, y);
    y += 12;

    doc.setFontSize(10);
    doc.setTextColor(30);
    doc.text(`Member Name: ${member?.first_name || ""} ${member?.last_name || ""}`, margin, y);
    y += 5;
    doc.text(`Account Scheme: ${saving?.account_type || "Savings"}`, margin, y);
    y += 5;
    doc.text(`Account Number: ${saving?.account_number || "N/A"}`, margin, y);
    y += 5;
    doc.text(`Current Balance: ${formatCurrency(saving?.balance)}`, margin, y);
    y += 12;

    autoTable(doc, {
      startY: y,
      head: [["Date", "Type", "Amount", "Method", "Status"]],
      body: filteredTransactions.map((t) => [
        formatDate(t.date),
        t.type,
        formatCurrency(t.amount),
        t.method,
        t.status,
      ]),
      theme: "striped",
      headStyles: { fillColor: [4, 94, 50] },
      styles: { fontSize: 8 },
    });

    doc.save(`savings_statement_${saving?.account_number || "account"}.pdf`);
  };

  const PersonalSavingDetailSkeleton = () => (
    <div className="mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
      <div className="h-4 w-48 bg-slate-200 rounded" />
      <div className="h-28 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-slate-200 rounded-xl" />
    </div>
  );

  if (isLoadingSaving || isLoadingMember) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <PersonalSavingDetailSkeleton />
      </div>
    );
  }

  if (!saving) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 border-dashed">
          <Wallet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">Savings Account Not Found</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            The requested savings scheme could not be located or accessed.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-12">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/member/dashboard" className="text-slate-500 hover:text-slate-900">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/member/savings" className="text-slate-500 hover:text-slate-900">
                My Savings
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage className="font-semibold text-slate-900">{saving.account_type}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Account Banner Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-700/50">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {saving.account_type}
              </h1>
              <Badge
                className={
                  saving.is_active
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 px-3 py-0.5 text-xs font-semibold"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40 px-3 py-0.5 text-xs font-semibold"
                }
              >
                {saving.is_active ? "● Active Account" : "Inactive"}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-slate-300 text-xs sm:text-sm font-mono">
              <span>Account No: <strong className="text-white">{saving.account_number}</strong></span>
              <button
                onClick={copyAccountNumber}
                className="hover:text-emerald-400 transition-colors p-1 rounded hover:bg-white/10"
                title="Copy Account Number"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {SACCO_CONFIG.enableMpesa && (
            <div className="flex items-center gap-3 w-full md:w-auto justify-stretch sm:justify-end">
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 shadow-lg shadow-emerald-950/40 w-full sm:w-auto h-11 text-sm"
                onClick={() => setDepositModalOpen(true)}
              >
                <ArrowDownLeft className="h-4 w-4 mr-2" /> Make Deposit
              </Button>
            </div>
          )}
        </div>

        {/* 4 Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Available Balance</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(saving.balance)}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Deposited</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatCurrency(stats.totalDeposits)}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Withdrawals</p>
                <p className="text-2xl font-bold text-slate-700 mt-1">
                  {formatCurrency(stats.totalWithdrawals)}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Interest Rate</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {saving.account_type_details?.interest_rate ? `${saving.account_type_details.interest_rate}% p.a` : "N/A"}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Percent className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "overview"
                ? "text-emerald-700 border-b-2 border-emerald-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Account Details & Rules
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "transactions"
                ? "text-emerald-700 border-b-2 border-emerald-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Transaction History ({filteredTransactions.length})
          </button>
        </div>

        {/* Tab 1: Account Details */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" /> Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 p-0 text-sm">
                <div className="flex justify-between p-4">
                  <span className="text-slate-500">Scheme Name</span>
                  <span className="font-semibold text-slate-800">{saving.account_type}</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-500">Account Number</span>
                  <span className="font-mono font-semibold text-slate-800">{saving.account_number}</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-500">Account Reference</span>
                  <span className="font-mono text-slate-600">{saving.reference || "N/A"}</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-500">Currency</span>
                  <span className="font-semibold text-slate-800">KES</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" /> Account Timeline & Interest
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 p-0 text-sm">
                <div className="flex justify-between p-4">
                  <span className="text-slate-500">Interest Computation</span>
                  <span className="font-semibold text-slate-800">
                    {saving.account_type_details?.interest_rate ? `${saving.account_type_details.interest_rate}% Per Annum` : "Non-interest bearing"}
                  </span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-500">Date Opened</span>
                  <span className="font-medium text-slate-800">{formatDate(saving.created_at)}</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-500">Last Activity</span>
                  <span className="font-medium text-slate-800">{formatDate(saving.updated_at)}</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-slate-500">Account Status</span>
                  <span className="font-semibold text-emerald-600">Active & Operational</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Transaction History */}
        {activeTab === "transactions" && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Transaction History</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    View and filter all deposits and withdrawals for this account
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 w-44"
                    />
                  </div>

                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                  >
                    <option value="ALL">All Types</option>
                    <option value="DEPOSIT">Deposits Only</option>
                    <option value="WITHDRAWAL">Withdrawals Only</option>
                  </select>

                  {/* PDF Export Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateTransactionPDF}
                    className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-xs font-bold text-slate-700">Date & Time</TableHead>
                      <TableHead className="text-xs font-bold text-slate-700">Type</TableHead>
                      <TableHead className="text-xs font-bold text-slate-700">Amount</TableHead>
                      <TableHead className="text-xs font-bold text-slate-700">Payment Method</TableHead>
                      <TableHead className="text-xs font-bold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {paginatedTransactions.map((t, index) => (
                      <TableRow key={index} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="text-xs font-medium text-slate-800">
                          {formatDate(t.date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              t.type === "Withdrawal"
                                ? "bg-rose-50 text-rose-700 border-rose-100/50"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100/50"
                            }
                          >
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900">
                          {formatCurrency(t.amount)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {t.method}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {t.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}

                    {paginatedTransactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          No transactions found matching your criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Showing page {currentPage} of {totalPages} ({totalItems} total records)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Deposit Modal Trigger */}
      <MpesaCreateDepositForm
        isOpen={depositModalOpen}
        onClose={() => {
          setDepositModalOpen(false);
          refetchSaving();
        }}
        savings_account={saving}
      />
    </div>
  );
}

export default SavingsDetail;
