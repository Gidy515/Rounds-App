import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID, USDC_MINT, CONFIG_PDA } from "./constants";

// Circle PDA derivation
export function deriveCirclePda(
  contributionAmount: BN,
  totalMembers: number,
  frequency: number,
  nonce: number = 0,
  usdcMint: PublicKey = USDC_MINT
): [PublicKey, number] {
  const amountBuffer = contributionAmount.toArrayLike(Buffer, "le", 8);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("circle"),
      amountBuffer,
      Buffer.from([totalMembers]),
      Buffer.from([frequency]),
      usdcMint.toBuffer(),
      Buffer.from([nonce]),
    ],
    PROGRAM_ID
  );
}

export function deriveMemberPda(
  circlePda: PublicKey,
  memberPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("member"), circlePda.toBuffer(), memberPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveCollateralRecordPda(
  circlePda: PublicKey,
  memberPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("colrec"), circlePda.toBuffer(), memberPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function derivePaymentRecordPda(
  circlePda: PublicKey,
  cycle: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("payment"), circlePda.toBuffer(), Buffer.from([cycle])],
    PROGRAM_ID
  );
}

export function deriveCollateralVaultPda(
  circlePda: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("collateral_vault"), circlePda.toBuffer()],
    PROGRAM_ID
  );
}

export function derivePotVaultPda(circlePda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pot_vault"), circlePda.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveProtocolConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function deriveTreasuryVaultAddress(
  usdcMint: PublicKey = USDC_MINT
): PublicKey {
  return getAssociatedTokenAddressSync(
    usdcMint,
    CONFIG_PDA,
    true,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

export function deriveUserUsdcAta(
  userPubkey: PublicKey,
  usdcMint: PublicKey = USDC_MINT
): PublicKey {
  return getAssociatedTokenAddressSync(
    usdcMint,
    userPubkey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

// Frequency enum to number mapping
// Must match Rust PayoutFrequency enum order
export const FREQUENCY_TO_NUM: Record<string, number> = {
  daily: 0,
  weekly: 1,
  biweekly: 2,
  monthly: 3,
};
