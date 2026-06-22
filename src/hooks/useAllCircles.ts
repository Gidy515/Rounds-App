"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import idl from "@/idl/rounds_protocol.json";
import type { RoundsProtocol } from "@/types/rounds_protocol";

export interface CircleData {
  address: PublicKey;
  contributionAmount: any;
  totalMembers: number;
  activeMembers: number;
  currentMembers: number;
  frequency: any;
  state: any;
  currentCycle: number;
  cycleDeadlineSlot: any;
  cancelDeadlineSlot: any;
  usdcMint: PublicKey;
  startedAtSlot: any;
  completedAtSlot: any;
  bump: number;
}

export function useAllCircles() {
  const { connection } = useConnection();
  const [circles, setCircles] = useState<CircleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dummyWallet = {
        publicKey: Keypair.generate().publicKey,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any[]) => txs,
      };
      const provider = new AnchorProvider(connection, dummyWallet as any, {
        commitment: "confirmed",
      });
      const program = new Program<RoundsProtocol>(idl as any, provider);

      const allCircles = await program.account.circleAccount.all();

      const data: CircleData[] = allCircles.map((c: any) => ({
        address: c.publicKey,
        contributionAmount: c.account.contributionAmount,
        totalMembers: c.account.totalMembers,
        activeMembers: c.account.activeMembers,
        currentMembers: c.account.currentMembers,
        frequency: c.account.frequency,
        state: c.account.state,
        currentCycle: c.account.currentCycle,
        cycleDeadlineSlot: c.account.cycleDeadlineSlot,
        cancelDeadlineSlot: c.account.cancelDeadlineSlot,
        usdcMint: c.account.usdcMint,
        startedAtSlot: c.account.startedAtSlot,
        completedAtSlot: c.account.completedAtSlot,
        bump: c.account.bump,
      }));

      const stateOrder: Record<string, number> = {
        open: 0,
        ready: 1,
        active: 2,
        completed: 3,
        cancelled: 4,
      };

      data.sort((a, b) => {
        const aState = Object.keys(a.state)[0];
        const bState = Object.keys(b.state)[0];
        return (stateOrder[aState] ?? 5) - (stateOrder[bState] ?? 5);
      });

      setCircles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  return { circles, loading, error, refetch: fetchCircles };
}
