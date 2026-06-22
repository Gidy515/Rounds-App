"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import idl from "@/idl/rounds_protocol.json";
import type { RoundsProtocol } from "@/types/rounds_protocol";

export function useCircle(circleAddress: string | null) {
  const { connection } = useConnection();
  const [circle, setCircle] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCircle = useCallback(async () => {
    if (!circleAddress) return;

    try {
      setLoading(true);
      setError(null);

      const circlePubkey = new PublicKey(circleAddress);

      const dummyWallet = {
        publicKey: Keypair.generate().publicKey,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any[]) => txs,
      };
      const provider = new AnchorProvider(connection, dummyWallet as any, {
        commitment: "confirmed",
      });
      const program = new Program<RoundsProtocol>(idl as any, provider);

      const circleData = await program.account.circleAccount.fetch(
        circlePubkey
      );
      setCircle({ address: circlePubkey, ...circleData });

      const memberAccounts = await program.account.memberAccount.all([
        {
          memcmp: {
            offset: 8,
            bytes: circlePubkey.toBase58(),
          },
        },
      ]);

      const sorted = (memberAccounts as any[]).sort(
        (a: any, b: any) => a.account.position - b.account.position
      );

      setMembers(
        sorted.map((m: any) => ({
          address: m.publicKey,
          ...m.account,
        }))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [connection, circleAddress]);

  useEffect(() => {
    fetchCircle();
  }, [fetchCircle]);

  return { circle, members, loading, error, refetch: fetchCircle };
}
