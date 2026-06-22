import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

export const CONFIG_PDA = new PublicKey(process.env.NEXT_PUBLIC_CONFIG_PDA!);

export const TREASURY_VAULT = new PublicKey(
  process.env.NEXT_PUBLIC_TREASURY_VAULT!
);

export const USDC_MINT = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!);

export const CLUSTER =
  (process.env.NEXT_PUBLIC_CLUSTER as "devnet" | "mainnet-beta") ?? "devnet";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

export { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID };

// Protocol constants — must match Rust program
export const PREMIUM_BPS = 1_000;
export const BPS_DENOMINATOR = 10_000;
export const MIN_CONTRIBUTION = 1_000_000; // 1 USDC
export const MAX_MEMBERS = 20;
export const MIN_MEMBERS = 2;
export const MAX_FEE_BPS = 1_000;

// Frequency options for UI
export const FREQUENCY_OPTIONS = [
  { label: "Daily", value: { daily: {} }, slots: 216_000 },
  { label: "Weekly", value: { weekly: {} }, slots: 1_512_000 },
  { label: "Biweekly", value: { biweekly: {} }, slots: 3_024_000 },
  { label: "Monthly", value: { monthly: {} }, slots: 6_480_000 },
] as const;

// Contribution presets for create circle form
export const CONTRIBUTION_PRESETS = [
  { label: "10 USDC", value: 10_000_000 },
  { label: "50 USDC", value: 50_000_000 },
  { label: "100 USDC", value: 100_000_000 },
  { label: "500 USDC", value: 500_000_000 },
  { label: "1000 USDC", value: 1_000_000_000 },
] as const;

// Member count presets
export const MEMBER_PRESETS = [2, 3, 5, 8, 10, 15, 20] as const;
