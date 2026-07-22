"use client";

import useAxiosAuth from "@/hooks/authentication/useAxiosAuth";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { Loader2, ChevronDown, CreditCard, AlertCircle, Info } from "lucide-react";
import { createLoanRepaymentMpesa } from "@/services/loanrepayments";

// Repayment type options displayed to the member
const REPAYMENT_TYPES = [
    {
        value: "Regular Repayment",
        label: "Regular Repayment",
        description: "Pay your next scheduled installment",
        amountKey: "next_installment_amount",
        editable: false,
    },
    {
        value: "Partial Payment",
        label: "Partial Payment",
        description: "Pay any amount toward your loan balance",
        amountKey: null,
        editable: true,
    },
    {
        value: "Early Settlement",
        label: "Early Settlement",
        description: "Fully settle your loan (future interest waived)",
        amountKey: "settlement_amount",
        editable: false,
    },
    {
        value: "Loan Clearance",
        label: "Loan Clearance",
        description: "Settle loan + all outstanding penalties",
        amountKey: "clearance_amount",
        editable: false,
    },
    {
        value: "Penalty Payment",
        label: "Penalty Payment",
        description: "Pay outstanding penalty charges only",
        amountKey: "total_penalties",
        editable: false,
    },
];

export default function MpesaCreateLoanPaymentForm({
    isOpen,
    onClose,
    loanReference,
    loanAccountNumber,
    payoffQuote,        // { settlement_amount, clearance_amount, next_installment_amount, total_penalties }
}) {
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState(REPAYMENT_TYPES[0]);
    const token = useAxiosAuth();
    const router = useRouter();

    // Resolve the auto-fill amount from payoffQuote for the currently selected type
    const getAutoFillAmount = (type) => {
        if (!type.amountKey || !payoffQuote) return "";
        const val = payoffQuote[type.amountKey];
        return val != null ? String(parseFloat(val).toFixed(2)) : "";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-[#045e32]" />
                        M-Pesa Loan Repayment
                    </DialogTitle>
                    <DialogDescription>
                        Select your repayment type and enter your M-Pesa phone number.
                    </DialogDescription>
                </DialogHeader>

                <Formik
                    enableReinitialize
                    initialValues={{
                        loan_account: loanAccountNumber,
                        amount: getAutoFillAmount(selectedType),
                        phone_number: "",
                        transaction_status: "Pending",
                        repayment_type: selectedType.value,
                    }}
                    validate={(values) => {
                        const errors = {};
                        if (!values.amount || parseFloat(values.amount) <= 0) {
                            errors.amount = "Please enter a valid amount";
                        }
                        if (!values.phone_number) {
                            errors.phone_number = "Phone number is required";
                        } else if (!/^(2547|2541)\d{8}$/.test(values.phone_number)) {
                            errors.phone_number = "Format: 2547XXXXXXXX or 2541XXXXXXXX";
                        }
                        return errors;
                    }}
                    onSubmit={async (values) => {
                        setLoading(true);
                        try {
                            const response = await createLoanRepaymentMpesa(values, token);
                            toast.success("Payment request created! Proceeding to M-Pesa…");
                            router.push(`/member/loans/${loanReference}/${response?.reference || ""}`);
                            onClose();
                        } catch (error) {
                            const errorMsg =
                                error?.response?.data?.error ||
                                error?.response?.data?.loan_account?.[0] ||
                                error?.response?.data?.amount?.[0] ||
                                "Failed to create payment request";
                            toast.error(errorMsg);
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    {({ errors, touched, values, setFieldValue }) => (
                        <Form className="space-y-5">

                            {/* Repayment Type Selector */}
                            <div className="space-y-2">
                                <Label>Repayment Type</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {REPAYMENT_TYPES.map((type) => {
                                        const autoAmount = getAutoFillAmount(type);
                                        const isUnavailable = !type.editable && !autoAmount;
                                        return (
                                            <button
                                                key={type.value}
                                                type="button"
                                                disabled={isUnavailable}
                                                onClick={() => {
                                                    setSelectedType(type);
                                                    setFieldValue("repayment_type", type.value);
                                                    setFieldValue("amount", getAutoFillAmount(type));
                                                }}
                                                className={`text-left p-3 rounded-lg border transition-all ${
                                                    selectedType.value === type.value
                                                        ? "border-[#045e32] bg-[#045e32]/5 ring-1 ring-[#045e32]"
                                                        : isUnavailable
                                                        ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                                        : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className={`text-sm font-medium ${
                                                            selectedType.value === type.value
                                                                ? "text-[#045e32]"
                                                                : "text-gray-800"
                                                        }`}>
                                                            {type.label}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {type.description}
                                                        </p>
                                                    </div>
                                                    {autoAmount && (
                                                        <span className="text-xs font-mono font-semibold text-[#045e32] ml-2 shrink-0">
                                                            KES {parseFloat(autoAmount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Amount Field */}
                            <div className="space-y-2">
                                <Label htmlFor="amount">
                                    Amount (KES)
                                    {!selectedType.editable && (
                                        <span className="ml-2 text-xs text-muted-foreground">(auto-filled)</span>
                                    )}
                                </Label>
                                <Field
                                    as={Input}
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    readOnly={!selectedType.editable}
                                    placeholder={selectedType.editable ? "Enter amount" : "Select a type above"}
                                    className={`${errors.amount && touched.amount ? "border-red-500" : ""} ${
                                        !selectedType.editable ? "bg-gray-50 cursor-not-allowed" : ""
                                    }`}
                                />
                                <ErrorMessage name="amount" component="p" className="text-red-500 text-xs" />
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phone_number">M-Pesa Phone Number</Label>
                                <Field
                                    as={Input}
                                    id="phone_number"
                                    name="phone_number"
                                    type="text"
                                    placeholder="254712345678"
                                    className={errors.phone_number && touched.phone_number ? "border-red-500" : ""}
                                />
                                <ErrorMessage name="phone_number" component="p" className="text-red-500 text-xs" />
                                <p className="text-[0.75rem] text-muted-foreground">
                                    Format: 2547XXXXXXXX or 2541XXXXXXXX
                                </p>
                            </div>

                            {/* Info Banner */}
                            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>
                                    An M-Pesa prompt will be sent to your phone. Enter your PIN to authorise.
                                    Your loan balance will be updated automatically once confirmed.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#045e32] hover:bg-[#034625] h-11"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Payment Request…
                                    </>
                                ) : (
                                    "Initiate M-Pesa Payment"
                                )}
                            </Button>
                        </Form>
                    )}
                </Formik>
            </DialogContent>
        </Dialog>
    );
}