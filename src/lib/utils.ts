import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format USDC amount (6 decimals) to human readable
export function formatUsdc(lamports: any): string {
  let amount: number;

  if (lamports === null || lamports === undefined) {
    amount = 0;
  } else if (typeof lamports === "bigint") {
    amount = Number(lamports);
  } else if (typeof lamports === "number") {
    amount = lamports;
  } else if (typeof lamports === "object" && "toNumber" in lamports) {
    amount = lamports.toNumber();
  } else if (typeof lamports === "object" && "words" in lamports) {
    // Raw BN from BorshAccountsCoder
    const BN = require("bn.js");
    amount = new BN(lamports).toNumber();
  } else {
    amount = Number(lamports);
  }

  const usdc = amount / 1_000_000;

  if (usdc >= 1_000_000) return `${(usdc / 1_000_000).toFixed(2)}M`;
  if (usdc >= 1_000) return `${(usdc / 1_000).toFixed(2)}K`;
  return usdc.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Parse human readable USDC to lamports
export function parseUsdc(amount: string | number): BN {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new BN(Math.floor(num * 1_000_000));
}

// Truncate wallet address
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Format slot to approximate time
export function slotsToTime(slots: number): string {
  const seconds = slots * 0.4;
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

// Format frequency enum to label
export function formatFrequency(frequency: any): string {
  if (frequency?.daily) return "Daily";
  if (frequency?.weekly) return "Weekly";
  if (frequency?.biweekly) return "Biweekly";
  if (frequency?.monthly) return "Monthly";
  return "Unknown";
}

// Format circle state to label
export function formatState(state: any): string {
  if (state?.open) return "Open";
  if (state?.ready) return "Ready";
  if (state?.active) return "Active";
  if (state?.completed) return "Completed";
  if (state?.cancelled) return "Cancelled";
  return "Unknown";
}

// Calculate collateral for a given position
export function calculateCollateral(
  position: number,
  totalMembers: number,
  contributionAmount: BN
): BN {
  const remainingCycles = totalMembers - position;
  return contributionAmount.muln(remainingCycles);
}

// Calculate premium (10% of contribution)
export function calculatePremium(contributionAmount: BN): BN {
  return contributionAmount.muln(1000).divn(10000);
}

// Calculate total cost to join at a given position
export function calculateJoinCost(
  position: number,
  totalMembers: number,
  contributionAmount: BN
): BN {
  const collateral = calculateCollateral(
    position,
    totalMembers,
    contributionAmount
  );
  const premium =
    position > 1 ? calculatePremium(contributionAmount) : new BN(0);
  return collateral.add(contributionAmount).add(premium);
}

// Shorten transaction signature
export function shortenSig(sig: string): string {
  return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
}

// Solana explorer URL
export function explorerUrl(
  address: string,
  type: "address" | "tx" = "address"
): string {
  return `https://explorer.solana.com/${type}/${address}?cluster=devnet`;
}

// Check if string is valid public key
export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}
