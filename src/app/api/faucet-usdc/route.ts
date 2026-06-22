import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  mintTo,
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const USDC_MINT = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!);
const FAUCET_AMOUNT = 1_000 * 10 ** 6; // 1000 USDC in lamports

export async function POST(req: NextRequest) {
  try {
    const { wallet } = await req.json();

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    // Load mint authority from env
    const keypairArray = JSON.parse(process.env.FAUCET_KEYPAIR!);
    const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(keypairArray));

    const connection = new Connection(RPC_URL, "confirmed");
    const userPubkey = new PublicKey(wallet);

    // Get or create the user's USDC ATA
    const userAta = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority, // payer
      USDC_MINT,
      userPubkey,
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Mint 1000 USDC to user
    const sig = await mintTo(
      connection,
      mintAuthority, // payer
      USDC_MINT,
      userAta.address,
      mintAuthority.publicKey, // mint authority
      BigInt(FAUCET_AMOUNT),
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    return NextResponse.json({
      success: true,
      signature: sig,
      amount: 1000,
      mint: USDC_MINT.toBase58(),
      ata: userAta.address.toBase58(),
    });
  } catch (err: any) {
    console.error("USDC faucet error:", err);
    return NextResponse.json(
      { error: err.message || "Faucet failed" },
      { status: 500 }
    );
  }
}
