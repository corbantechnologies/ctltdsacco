"use client";

import {
  getSavingsWithdrawal,
  getSavingsWithdrawals,
} from "@/services/savingswithdrawals";
import useAxiosAuth from "../authentication/useAxiosAuth";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

// Pass enabled=false when withdrawals are switched off for this SACCO: the
// API refuses every withdrawal request then.
export function useFetchSavingsWithdrawals(enabled = true) {
  const token = useAxiosAuth();
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: () => getSavingsWithdrawals(token),
    enabled: enabled && !!session?.user?.token,
  });
}

export function useFetchSavingsWithdrawal(reference) {
  const token = useAxiosAuth();

  return useQuery({
    queryKey: ["withdrawal", reference],
    queryFn: () => getSavingsWithdrawal(reference, token),
    enabled: !!reference,
  });
}
