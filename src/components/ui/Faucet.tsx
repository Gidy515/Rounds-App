"use client";

import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Spinner } from "./Spinner";

export const Faucet: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [solLoading, setSolLoading] = useState(false);
  const [usdcLoading, setUsdcLoading] = useState(false);
  const [solMsg, setSolMsg] = useState<string | null>(null);
  const [usdcMsg, setUsdcMsg] = useState<string | null>(null);

  async function airdropSol() {
    if (!publicKey) return;
    setSolLoading(true);
    setSolMsg(null);
    try {
      const res = await fetch("/api/faucet-sol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (data.success) {
        setSolMsg("2 SOL airdropped successfully");
      } else {
        setSolMsg(data.error || "Airdrop failed");
      }
    } catch (e: any) {
      setSolMsg("Airdrop failed — try again");
    } finally {
      setSolLoading(false);
      setTimeout(() => setSolMsg(null), 4000);
    }
  }

  async function airdropUsdc() {
    if (!publicKey) return;
    setUsdcLoading(true);
    setUsdcMsg(null);
    try {
      const res = await fetch("/api/faucet-usdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (data.success) {
        setUsdcMsg("1000 USDC minted to your wallet");
      } else {
        setUsdcMsg(data.error || "Faucet failed");
      }
    } catch (e: any) {
      setUsdcMsg("Faucet failed — try again");
    } finally {
      setUsdcLoading(false);
      setTimeout(() => setUsdcMsg(null), 4000);
    }
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.018)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "1rem",
        }}
      >
        <span style={{ fontSize: "16px" }}>🚰</span>
        <h3
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "15px",
            fontWeight: "600",
            color: "#F0F0FF",
          }}
        >
          Devnet Faucet
        </h3>
        <span
          style={{
            fontSize: "10px",
            color: "#F59E0B",
            padding: "2px 7px",
            background: "rgba(245,158,11,0.1)",
            borderRadius: "4px",
            border: "1px solid rgba(245,158,11,0.2)",
            fontWeight: "600",
          }}
        >
          DEVNET
        </span>
      </div>

      <p
        style={{
          color: "#6B6B8A",
          fontSize: "13px",
          marginBottom: "1rem",
          lineHeight: "1.5",
        }}
      >
        Get test tokens to try Rounds Protocol. No real funds needed.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {/* SOL faucet */}
        <div>
          <button
            onClick={airdropSol}
            disabled={solLoading || !publicKey}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)",
              color: "#A78BFA",
              fontWeight: "600",
              fontSize: "13px",
              cursor: solLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: solLoading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {solLoading ? <Spinner size={14} color="#A78BFA" /> : null}
            Get 2 SOL
          </button>
          {solMsg && (
            <p
              style={{
                fontSize: "12px",
                color: solMsg.includes("success") ? "#10B981" : "#EF4444",
                marginTop: "6px",
                textAlign: "center",
              }}
            >
              {solMsg}
            </p>
          )}
        </div>

        {/* USDC faucet */}
        <div>
          <button
            onClick={airdropUsdc}
            disabled={usdcLoading || !publicKey}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(6,182,212,0.1)",
              border: "1px solid rgba(6,182,212,0.2)",
              color: "#06B6D4",
              fontWeight: "600",
              fontSize: "13px",
              cursor: usdcLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: usdcLoading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {usdcLoading ? <Spinner size={14} color="#06B6D4" /> : null}
            Get 1,000 USDC
          </button>
          {usdcMsg && (
            <p
              style={{
                fontSize: "12px",
                color:
                  usdcMsg.includes("success") || usdcMsg.includes("minted")
                    ? "#10B981"
                    : "#EF4444",
                marginTop: "6px",
                textAlign: "center",
              }}
            >
              {usdcMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
