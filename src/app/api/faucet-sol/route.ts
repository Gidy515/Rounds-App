import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

export async function POST(req: NextRequest) {
  try {
    const { wallet } = await req.json();

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const userPubkey = new PublicKey(wallet);

    // Request 2 SOL — Helius devnet RPC allows higher limits
    const sig = await connection.requestAirdrop(
      userPubkey,
      2 * LAMPORTS_PER_SOL
    );

    // Confirm with retry
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: sig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    return NextResponse.json({
      success: true,
      signature: sig,
      amount: 2,
    });
  } catch (err: any) {
    console.error("SOL faucet error:", err);

    // Friendly error messages
    const message = err.message ?? "";
    if (
      message.includes("429") ||
      message.includes("Rate limit") ||
      message.includes("403")
    ) {
      return NextResponse.json(
        {
          error:
            "Devnet SOL faucet rate limit hit. Try https://faucet.solana.com directly.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: message || "Airdrop failed" },
      { status: 500 }
    );
  }
}
