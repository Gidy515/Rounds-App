"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "@/lib/constants";
import idl from "@/idl/rounds_protocol.json";
import type { RoundsProtocol } from "@/types/rounds_protocol";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    return new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions!,
      },
      { commitment: "confirmed" }
    );
  }, [connection, wallet.publicKey, wallet.signTransaction]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program<RoundsProtocol>(idl as any, provider);
  }, [provider]);

  return { program, provider, connection, wallet };
}
