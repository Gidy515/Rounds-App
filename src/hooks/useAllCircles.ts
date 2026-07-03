"use client";

import { useState, useEffect, useCallback } from "react";
import { BorshAccountsCoder } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import idl from "@/idl/rounds_protocol.json";
import { RPC_URL } from "@/lib/constants";
import BN from "bn.js";

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
  nonce: number;
}

const PROGRAM_ID = new PublicKey(
  "7BBvnkQ4AKMFU6EfWvScSqi69eu9TjLoDzpmzG8ZeFhN"
);
const CIRCLE_ACCOUNT_SIZE = 96;

export function useAllCircles() {
  const [circles, setCircles] = useState<CircleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const conn = new Connection(RPC_URL, "confirmed");
      console.log("useAllCircles: using RPC:", RPC_URL);

      const accounts = await conn.getProgramAccounts(PROGRAM_ID, {
        commitment: "confirmed",
        filters: [{ dataSize: CIRCLE_ACCOUNT_SIZE }],
      });

      console.log("useAllCircles: raw accounts fetched:", accounts.length);

      const coder = new BorshAccountsCoder(idl as any);

      const data: CircleData[] = accounts
        .map((acc) => {
          try {
            const decoded = coder.decode("CircleAccount", acc.account.data);

            // BorshAccountsCoder returns u64 as hex strings and enums with PascalCase keys
            const hexToBN = (val: any): any => {
              if (!val) return new BN(0);
              if (typeof val === "string") return new BN(val, 16);
              if (typeof val === "number") return new BN(val);
              if (val.toNumber) return val;
              return new BN(val.toString());
            };

            // Normalize enum keys to lowercase — { Weekly: {} } → { weekly: {} }
            const normalizeEnum = (val: any): any => {
              if (!val || typeof val !== "object") return val;
              const key = Object.keys(val)[0];
              if (!key) return val;
              return { [key.toLowerCase()]: {} };
            };

            return {
              address: acc.pubkey,
              contributionAmount: hexToBN(decoded.contribution_amount),
              totalMembers: Number(decoded.total_members),
              activeMembers: Number(decoded.active_members),
              currentMembers: Number(decoded.current_members),
              frequency: normalizeEnum(decoded.frequency),
              state: normalizeEnum(decoded.state),
              currentCycle: Number(decoded.current_cycle),
              cycleDeadlineSlot: hexToBN(decoded.cycle_deadline_slot),
              cancelDeadlineSlot: hexToBN(decoded.cancel_deadline_slot),
              usdcMint: decoded.usdc_mint,
              startedAtSlot: hexToBN(decoded.started_at_slot),
              completedAtSlot: hexToBN(decoded.completed_at_slot),
              bump: Number(decoded.bump),
              nonce: Number(decoded.nonce ?? 0),
            };
          } catch (e: any) {
            console.log(
              "useAllCircles: failed to decode:",
              acc.pubkey.toBase58(),
              e.message
            );
            return null;
          }
        })
        .filter(Boolean) as CircleData[];

      console.log("useAllCircles: final circles count:", data.length);
      setCircles(data);
    } catch (err: any) {
      console.error("useAllCircles error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  return { circles, loading, error, refetch: fetchCircles };
}
