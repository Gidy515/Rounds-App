"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import idl from "@/idl/rounds_protocol.json";
import type { RoundsProtocol } from "@/types/rounds_protocol";
import type { CircleData } from "./useAllCircles";

export interface MyCircleData extends CircleData {
  memberAccount: any;
  memberPda: any;
  position: number;
  collateralLocked: any;
  hasReceivedPot: boolean;
  isDefaulted: boolean;
  isKicked: boolean;
}

export function useMyCircles() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [circles, setCircles] = useState<MyCircleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyCircles = useCallback(async () => {
    if (!publicKey) {
      setCircles([]);
      return;
    }

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

      const memberAccounts = await program.account.memberAccount.all([
        {
          memcmp: {
            offset: 8 + 32,
            bytes: publicKey.toBase58(),
          },
        },
      ]);

      const myCircles: MyCircleData[] = [];

      for (const memberAcc of memberAccounts as any[]) {
        try {
          const circleData = await program.account.circleAccount.fetch(
            memberAcc.account.circle
          );
          myCircles.push({
            address: memberAcc.account.circle,
            contributionAmount: circleData.contributionAmount,
            totalMembers: circleData.totalMembers,
            activeMembers: circleData.activeMembers,
            currentMembers: circleData.currentMembers,
            frequency: circleData.frequency,
            state: circleData.state,
            currentCycle: circleData.currentCycle,
            cycleDeadlineSlot: circleData.cycleDeadlineSlot,
            cancelDeadlineSlot: circleData.cancelDeadlineSlot,
            usdcMint: circleData.usdcMint,
            startedAtSlot: circleData.startedAtSlot,
            completedAtSlot: circleData.completedAtSlot,
            bump: circleData.bump,
            nonce: (circleData as any).nonce ?? 0, // ← ADD THIS
            memberAccount: memberAcc.account,
            memberPda: memberAcc.publicKey,
            position: memberAcc.account.position,
            collateralLocked: memberAcc.account.collateralLocked,
            hasReceivedPot: memberAcc.account.hasReceivedPot,
            isDefaulted: memberAcc.account.isDefaulted,
            isKicked: memberAcc.account.isKicked,
          });
        } catch {
          // Circle may have been closed — skip
        }
      }

      setCircles(myCircles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchMyCircles();
  }, [fetchMyCircles]);

  return { circles, loading, error, refetch: fetchMyCircles };
}
