"use client";

import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { CONFIG_PDA } from "@/lib/constants";
import idl from "@/idl/rounds_protocol.json";
import type { RoundsProtocol } from "@/types/rounds_protocol";

export function useProtocolConfig() {
  const { connection } = useConnection();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const dummyWallet = {
          publicKey: Keypair.generate().publicKey,
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any[]) => txs,
        };
        const provider = new AnchorProvider(connection, dummyWallet as any, {
          commitment: "confirmed",
        });
        const program = new Program<RoundsProtocol>(idl as any, provider);
        const data = await program.account.protocolConfig.fetch(CONFIG_PDA);
        setConfig(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, [connection]);

  return { config, loading, error };
}
