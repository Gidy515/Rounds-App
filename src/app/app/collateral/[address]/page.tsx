"use client";

import { FC, use } from "react";
import Link from "next/link";
import { useCircle } from "@/hooks/useCircle";
import { useKaminoApy } from "@/hooks/useKaminoApy";
import { Spinner } from "@/components/ui/Spinner";
import { formatUsdc, truncateAddress, explorerUrl } from "@/lib/utils";
import BN from "bn.js";

// ── Helpers ───────────────────────────────────────────────
function estimateAnnualYield(collateralLamports: number, apy: number): number {
  return (collateralLamports / 1_000_000) * apy;
}

function estimateEarned(
  collateralLamports: number,
  apy: number,
  startedAtSlot: any
): number {
  const startSlot = startedAtSlot?.toNumber?.() ?? 0;
  if (startSlot === 0) return 0;
  const slotsElapsed = Math.max(0, Date.now() / 400 - startSlot);
  const yearsElapsed = (slotsElapsed * 0.4) / (365 * 24 * 3600);
  return (collateralLamports / 1_000_000) * apy * yearsElapsed;
}

// ── Member collateral row ─────────────────────────────────
const MemberRow: FC<{
  member: any;
  position: number;
  apy: number;
  startedAtSlot: any;
  isMe: boolean;
}> = ({ member, position, apy, startedAtSlot, isMe }) => {
  const collateralLamports =
    member.collateralLocked?.toNumber?.() ??
    new BN(member.collateralLocked?.toString?.() ?? "0").toNumber();

  const collateralUsdc = collateralLamports / 1_000_000;
  const annualYield = estimateAnnualYield(collateralLamports, apy);
  const earnedSoFar = estimateEarned(collateralLamports, apy, startedAtSlot);
  const memberAddr = (member.member ?? member.address)?.toBase58() ?? "—";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "0.5fr 2fr 1fr 1fr 1fr 1fr",
        gap: "1rem",
        padding: "1rem 1.5rem",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: isMe ? "rgba(124,58,237,0.04)" : "transparent",
      }}
    >
      {/* Position */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: isMe ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "13px",
          fontWeight: "700",
          color: isMe ? "#A78BFA" : "#6B6B8A",
        }}
      >
        {position}
      </div>

      {/* Address */}
      <div>
        <div
          style={{
            fontSize: "13px",
            color: isMe ? "#A78BFA" : "#A0A0B8",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: isMe ? "600" : "400",
            marginBottom: "2px",
          }}
        >
          {truncateAddress(memberAddr, 8)}
          {isMe ? " (you)" : ""}
        </div>
        <span
          onClick={() =>
            window.open(explorerUrl(memberAddr), "_blank", "noreferrer")
          }
          style={{ fontSize: "11px", color: "#7C3AED", cursor: "pointer" }}
        >
          {"Explorer"}
        </span>
      </div>

      {/* Collateral */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#F59E0B" }}>
          {collateralUsdc > 0 ? `${collateralUsdc.toFixed(2)} USDC` : "0 USDC"}
        </div>
        <div style={{ fontSize: "11px", color: "#5C5C7A" }}>{"locked"}</div>
      </div>

      {/* APY */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#10B981" }}>
          {(apy * 100).toFixed(2)}
          {"%"}
        </div>
        <div style={{ fontSize: "11px", color: "#5C5C7A" }}>{"APY"}</div>
      </div>

      {/* Annual yield */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#06B6D4" }}>
          {annualYield.toFixed(2)}
          {" USDC"}
        </div>
        <div style={{ fontSize: "11px", color: "#5C5C7A" }}>{"per year"}</div>
      </div>

      {/* Earned so far */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#A78BFA" }}>
          {collateralLamports > 0 && startedAtSlot?.toNumber?.() > 0
            ? `~${earnedSoFar.toFixed(6)}`
            : "—"}
        </div>
        <div style={{ fontSize: "11px", color: "#5C5C7A" }}>
          {"USDC earned"}
        </div>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────
export default function CircleCollateralPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { circle, members, loading, error } = useCircle(address);
  const kaminoApy = useKaminoApy();

  const totalCollateralLamports = members.reduce((sum, m) => {
    const bn =
      m.collateralLocked?.toNumber?.() ??
      new BN(m.collateralLocked?.toString?.() ?? "0").toNumber();
    return sum + bn;
  }, 0);

  const totalCollateralUsdc = totalCollateralLamports / 1_000_000;
  const totalAnnualYield = estimateAnnualYield(
    totalCollateralLamports,
    kaminoApy.supplyApy
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <Spinner size={32} />
        <p style={{ color: "#6B6B8A", fontSize: "14px" }}>
          {"Loading circle yield data..."}
        </p>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div
        className="section"
        style={{ padding: "2.5rem 1rem", textAlign: "center" }}
      >
        <p style={{ color: "#EF4444", marginBottom: "1rem" }}>
          {"Circle not found"}
        </p>
        <Link
          href="/app/circles"
          style={{ color: "#7C3AED", textDecoration: "none", fontSize: "14px" }}
        >
          {"← Back to circles"}
        </Link>
      </div>
    );
  }

  return (
    <div className="section" style={{ padding: "2.5rem 1rem" }}>
      {/* Back */}
      <Link
        href={`/app/circles/${address}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          color: "#6B6B8A",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        {"← Back to circle"}
      </Link>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: "700",
              color: "#F0F0FF",
              letterSpacing: "-0.02em",
            }}
          >
            {"Collateral Yield"}
          </h1>
          {/* Live APY badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "9999px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 6px #10B981",
                display: "inline-block",
              }}
            />
            <span
              style={{ fontSize: "12px", fontWeight: "600", color: "#10B981" }}
            >
              {kaminoApy.loading
                ? "Fetching APY..."
                : `${(kaminoApy.supplyApy * 100).toFixed(
                    2
                  )}% APY · Kamino Live`}
            </span>
          </div>
        </div>
        <p
          style={{
            color: "#6B6B8A",
            fontSize: "13px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {truncateAddress(address, 8)}
          {" · "}
          {members.length}
          {" members"}
        </p>
      </div>

      {/* Phase 1 notice */}
      <div
        style={{
          padding: "0.875rem 1.25rem",
          background: "rgba(124,58,237,0.06)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: "12px",
          marginBottom: "2rem",
        }}
      >
        <p style={{ fontSize: "13px", color: "#A78BFA", lineHeight: "1.5" }}>
          {
            "⚡ Phase 1 — Yield projections using live Kamino USDC APY. Phase 2 deposits collateral directly into Kamino so members earn real yield automatically."
          }
        </p>
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            label: "Total Collateral",
            value: `${totalCollateralUsdc.toFixed(2)} USDC`,
            color: "#F59E0B",
            icon: "🔒",
          },
          {
            label: "Live APY",
            value: kaminoApy.loading
              ? "—"
              : `${(kaminoApy.supplyApy * 100).toFixed(2)}%`,
            color: "#10B981",
            icon: "📈",
          },
          {
            label: "Annual Yield",
            value: `${totalAnnualYield.toFixed(2)} USDC`,
            color: "#06B6D4",
            icon: "💰",
          },
          {
            label: "Members",
            value: members.length.toString(),
            color: "#A78BFA",
            icon: "👥",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "1.25rem",
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
                background: `linear-gradient(90deg, ${s.color}, transparent)`,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontSize: "12px", color: "#6B6B8A" }}>
                {s.label}
              </span>
              <span style={{ fontSize: "16px" }}>{s.icon}</span>
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1.4rem",
                fontWeight: "700",
                color: s.color,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Member collateral table */}
      <div
        style={{
          background: "rgba(255,255,255,0.018)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.5fr 2fr 1fr 1fr 1fr 1fr",
            gap: "1rem",
            padding: "1rem 1.5rem",
            background: "rgba(255,255,255,0.025)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {[
            "#",
            "Member Address",
            "Collateral",
            "APY",
            "Annual Yield",
            "Earned So Far",
          ].map((h, i) => (
            <div
              key={h}
              style={{
                fontSize: "11px",
                color: "#5C5C7A",
                fontWeight: "600",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                textAlign: i <= 1 ? "left" : "center",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {members.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#6B6B8A", fontSize: "14px" }}>
              {"No members yet"}
            </p>
          </div>
        ) : (
          members.map((m: any, i: number) => (
            <MemberRow
              key={i}
              member={m}
              position={m.position ?? i + 1}
              apy={kaminoApy.supplyApy}
              startedAtSlot={circle.startedAtSlot}
              isMe={false}
            />
          ))
        )}

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "rgba(255,255,255,0.01)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <p style={{ fontSize: "12px", color: "#5C5C7A" }}>
            {
              "APY sourced live from Kamino Finance mainnet USDC lending market · Variable rate changes with borrow demand · Phase 2 will deposit collateral into Kamino automatically"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
