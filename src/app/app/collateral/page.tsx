"use client";

import { FC, useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMyCircles } from "@/hooks/useMyCircles";
import { useKaminoApy } from "@/hooks/useKaminoApy";
import { Spinner } from "@/components/ui/Spinner";
import { StateBadge } from "@/components/ui/Badge";
import { formatUsdc, formatFrequency, truncateAddress } from "@/lib/utils";
import BN from "bn.js";

// ── Helpers ───────────────────────────────────────────────
function toBN(val: any): BN {
  if (val instanceof BN) return val;
  if (val?.toNumber) return new BN(val.toNumber());
  return new BN(val?.toString?.() ?? "0");
}

function estimateAnnualYield(collateralLamports: number, apy: number): number {
  return (collateralLamports / 1_000_000) * apy;
}

function estimateEarned(
  collateralLamports: number,
  apy: number,
  startedAtSlot: any
): number {
  const startSlot =
    startedAtSlot?.toNumber?.() ?? toBN(startedAtSlot).toNumber();
  if (startSlot === 0) return 0;
  const GENESIS_TIMESTAMP = 1584326400000;
  const estimatedCurrentSlot = Math.floor(
    (Date.now() - GENESIS_TIMESTAMP) / 400
  );
  const slotsElapsed = Math.max(0, estimatedCurrentSlot - startSlot);
  const yearsElapsed = (slotsElapsed * 0.4) / (365 * 24 * 3600);
  return (collateralLamports / 1_000_000) * apy * yearsElapsed;
}

function getDismissedKey(walletAddress: string): string {
  return `rounds_dismissed_circles_${walletAddress}`;
}

function loadDismissed(walletAddress: string): string[] {
  try {
    const stored = localStorage.getItem(getDismissedKey(walletAddress));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDismissed(walletAddress: string, dismissed: string[]): void {
  try {
    localStorage.setItem(
      getDismissedKey(walletAddress),
      JSON.stringify(dismissed)
    );
  } catch {}
}

// ── Stat card ─────────────────────────────────────────────
const StatCard: FC<{
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: string;
}> = ({ label, value, sub, color, icon }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.018)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "16px",
      padding: "1.5rem",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }}
    />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.75rem",
      }}
    >
      <span style={{ fontSize: "13px", color: "#6B6B8A", fontWeight: "500" }}>
        {label}
      </span>
      <span style={{ fontSize: "20px" }}>{icon}</span>
    </div>
    <div
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "1.75rem",
        fontWeight: "700",
        color: "#F0F0FF",
        lineHeight: "1",
        marginBottom: sub ? "4px" : 0,
      }}
    >
      {value}
    </div>
    {sub && <div style={{ fontSize: "12px", color: "#5C5C7A" }}>{sub}</div>}
  </div>
);

// ── Circle yield row ──────────────────────────────────────
const CircleYieldRow: FC<{
  circle: any;
  apy: number;
  onDismiss?: (address: string) => void;
}> = ({ circle, apy, onDismiss }) => {
  const collateralBN = toBN(circle.collateralLocked);
  const collateralLamports = collateralBN.toNumber();
  const collateralUsdc = collateralLamports / 1_000_000;
  const annualYield = estimateAnnualYield(collateralLamports, apy);
  const earned = estimateEarned(collateralLamports, apy, circle.startedAtSlot);
  const stateKey = Object.keys(circle.state)[0];
  const isActive = stateKey === "active";
  const isDismissable = stateKey === "completed" || stateKey === "cancelled";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isDismissable
          ? "2fr 1fr 1fr 1fr 1fr 0.8fr auto"
          : "2fr 1fr 1fr 1fr 1fr 0.8fr",
        gap: "0.75rem",
        padding: "1rem 1.5rem",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        opacity: isDismissable ? 0.7 : 1,
      }}
    >
      {/* Circle info */}
      <div>
        <div
          style={{
            fontSize: "13px",
            color: "#F0F0FF",
            fontWeight: "500",
            marginBottom: "2px",
          }}
        >
          {formatUsdc(collateralBN)}
          {" USDC · "}
          {formatFrequency(circle.frequency)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#5C5C7A",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {truncateAddress(circle.address.toBase58(), 6)}
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "#A78BFA",
              background: "rgba(124,58,237,0.1)",
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            {"Pos "}
            {circle.position}
          </span>
        </div>
      </div>

      {/* Collateral */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#F59E0B" }}>
          {collateralUsdc > 0 ? `${collateralUsdc.toFixed(2)}` : "0.00"}
        </div>
        <div style={{ fontSize: "11px", color: "#5C5C7A" }}>
          {"USDC locked"}
        </div>
      </div>

      {/* APY */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: isDismissable ? "#5C5C7A" : "#10B981",
          }}
        >
          {isDismissable ? "—" : `${(apy * 100).toFixed(2)}%`}
        </div>
        <div style={{ fontSize: "11px", color: "#5C5C7A" }}>{"APY"}</div>
      </div>

      {/* Annual yield */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: isDismissable ? "#5C5C7A" : "#06B6D4",
          }}
        >
          {isDismissable ? "—" : annualYield.toFixed(2)}
        </div>
        <div style={{ fontSize: "11px", color: "#5C5C7A" }}>{"USDC / yr"}</div>
      </div>

      {/* Earned so far */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#A78BFA" }}>
          {isActive && collateralLamports > 0 ? `~${earned.toFixed(6)}` : "—"}
        </div>
        <div style={{ fontSize: "11px", color: "#5C5C7A" }}>
          {"USDC earned"}
        </div>
      </div>

      {/* State + link */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        <StateBadge state={circle.state} />
        <Link
          href={`/app/collateral/${circle.address.toBase58()}`}
          style={{
            fontSize: "11px",
            color: "#10B981",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          {"Details →"}
        </Link>
      </div>

      {/* Dismiss button — only for completed/cancelled */}
      {isDismissable && onDismiss && (
        <button
          onClick={() => onDismiss(circle.address.toBase58())}
          title="Dismiss from view"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#EF4444",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(239,68,68,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(239,68,68,0.1)";
          }}
        >
          {"×"}
        </button>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────
export default function MyYieldPage() {
  const { publicKey } = useWallet();
  const { circles, loading: circlesLoading } = useMyCircles();
  const kaminoApy = useKaminoApy();
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Load dismissed circles from localStorage on wallet connect
  useEffect(() => {
    if (!publicKey) return;
    setDismissed(loadDismissed(publicKey.toBase58()));
  }, [publicKey]);

  function handleDismiss(address: string) {
    if (!publicKey) return;
    const updated = [...dismissed, address];
    setDismissed(updated);
    saveDismissed(publicKey.toBase58(), updated);
  }

  // Separate active circles (show in yield table) from dismissed ones
  const visibleCircles = circles.filter(
    (c) => !dismissed.includes(c.address.toBase58())
  );

  // Only open/ready/active circles count for yield stats
  const yieldCircles = visibleCircles.filter((c) => {
    const stateKey = Object.keys(c.state)[0];
    return stateKey !== "completed" && stateKey !== "cancelled";
  });

  const totalCollateralLamports = yieldCircles.reduce((sum, c) => {
    return sum + toBN(c.collateralLocked).toNumber();
  }, 0);

  const totalCollateralUsdc = totalCollateralLamports / 1_000_000;
  const totalAnnualYield = estimateAnnualYield(
    totalCollateralLamports,
    kaminoApy.supplyApy
  );

  const totalEarned = yieldCircles
    .filter((c) => Object.keys(c.state)[0] === "active")
    .reduce((sum, c) => {
      const lam = toBN(c.collateralLocked).toNumber();
      return sum + estimateEarned(lam, kaminoApy.supplyApy, c.startedAtSlot);
    }, 0);

  const dismissedCount = dismissed.length;

  return (
    <div className="section" style={{ padding: "2.5rem 1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: "700",
                color: "#F0F0FF",
                letterSpacing: "-0.02em",
                marginBottom: "0.25rem",
              }}
            >
              {"My Collateral Yield"}
            </h1>
            <p style={{ color: "#6B6B8A", fontSize: "14px" }}>
              {
                "Yield projections on your locked collateral across all active circles"
              }
            </p>
          </div>

          {/* Live APY badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "9999px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 8px #10B981",
                display: "inline-block",
              }}
            />
            <span
              style={{ fontSize: "13px", fontWeight: "600", color: "#10B981" }}
            >
              {kaminoApy.loading
                ? "Fetching live APY..."
                : `${(kaminoApy.supplyApy * 100).toFixed(
                    2
                  )}% APY · Kamino Finance`}
            </span>
          </div>
        </div>

        {/* Phase 1 notice */}
        <div
          style={{
            padding: "0.875rem 1.25rem",
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: "12px",
          }}
        >
          <p style={{ fontSize: "13px", color: "#A78BFA", lineHeight: "1.5" }}>
            {
              "⚡ Phase 1 — Yield projections using live Kamino USDC APY. Phase 2 will deposit your collateral directly into Kamino so you earn real yield automatically while you save."
            }
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          label="Total Collateral"
          value={`${totalCollateralUsdc.toFixed(2)} USDC`}
          sub="active circles only"
          color="#F59E0B"
          icon="lock"
        />
        <StatCard
          label="Live Kamino APY"
          value={
            kaminoApy.loading
              ? "—"
              : `${(kaminoApy.supplyApy * 100).toFixed(2)}%`
          }
          sub="USDC lending rate"
          color="#10B981"
          icon="yield"
        />
        <StatCard
          label="Projected Annual Yield"
          value={`${totalAnnualYield.toFixed(2)} USDC`}
          sub="at current APY"
          color="#06B6D4"
          icon="money"
        />
        <StatCard
          label="Estimated Earned"
          value={`~${totalEarned.toFixed(6)} USDC`}
          sub="active circles only"
          color="#A78BFA"
          icon="star"
        />
      </div>

      {/* Kamino info strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
          padding: "1.25rem",
          background: "rgba(16,185,129,0.04)",
          border: "1px solid rgba(16,185,129,0.12)",
          borderRadius: "16px",
        }}
      >
        {[
          { label: "Protocol", value: "Kamino Finance" },
          { label: "Market", value: "USDC Main Market" },
          { label: "Risk", value: "Balanced" },
          { label: "Audits", value: "OtterSec · Halborn" },
          {
            label: "Utilization",
            value: kaminoApy.loading
              ? "—"
              : `${(kaminoApy.utilization * 100).toFixed(1)}%`,
          },
          { label: "Protocol TVL", value: "~$3.2B" },
        ].map((item) => (
          <div key={item.label}>
            <div
              style={{
                fontSize: "11px",
                color: "#5C5C7A",
                marginBottom: "2px",
                letterSpacing: "0.05em",
                textTransform: "uppercase" as const,
              }}
            >
              {item.label}
            </div>
            <div
              style={{ fontSize: "13px", color: "#10B981", fontWeight: "500" }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: "rgba(255,255,255,0.018)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            background: "rgba(255,255,255,0.025)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr",
              gap: "0.75rem",
              flex: 1,
            }}
          >
            {[
              "Circle",
              "Collateral",
              "APY",
              "Annual Yield",
              "Earned So Far",
              "Status",
            ].map((h, i) => (
              <div
                key={h}
                style={{
                  fontSize: "11px",
                  color: "#5C5C7A",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                  textAlign: i <= 1 ? "left" : ("center" as const),
                }}
              >
                {h}
              </div>
            ))}
          </div>
          {/* Extra column header for dismiss button */}
          <div style={{ width: "28px" }} />
        </div>

        {/* Rows */}
        {circlesLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "3rem",
            }}
          >
            <Spinner size={24} />
          </div>
        ) : !publicKey ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <p style={{ color: "#6B6B8A", fontSize: "14px" }}>
              {"Connect your wallet to see your yield"}
            </p>
          </div>
        ) : visibleCircles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5C5C7A"
                strokeWidth="1.5"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p
              style={{
                color: "#6B6B8A",
                fontSize: "14px",
                marginBottom: "0.5rem",
              }}
            >
              {dismissedCount > 0
                ? `All circles dismissed. ${dismissedCount} circle${
                    dismissedCount > 1 ? "s" : ""
                  } hidden.`
                : "No circles joined yet"}
            </p>
            {dismissedCount === 0 && (
              <Link
                href="/app/circles"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  color: "#A78BFA",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                {"Browse Circles"}
              </Link>
            )}
          </div>
        ) : (
          visibleCircles.map((circle) => (
            <CircleYieldRow
              key={circle.address.toBase58()}
              circle={circle}
              apy={kaminoApy.supplyApy}
              onDismiss={handleDismiss}
            />
          ))
        )}

        {/* Footer */}
        {visibleCircles.length > 0 && (
          <div
            style={{
              padding: "1rem 1.5rem",
              background: "rgba(255,255,255,0.01)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <p style={{ fontSize: "12px", color: "#5C5C7A" }}>
              {
                "APY sourced live from Kamino Finance mainnet · Variable rate · × dismisses completed/cancelled circles from view"
              }
            </p>
            {dismissedCount > 0 && (
              <button
                onClick={() => {
                  if (!publicKey) return;
                  setDismissed([]);
                  saveDismissed(publicKey.toBase58(), []);
                }}
                style={{
                  fontSize: "12px",
                  color: "#6B6B8A",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {"Restore "}
                {dismissedCount}
                {" dismissed"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
