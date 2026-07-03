"use client";

import { FC } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMyCircles } from "@/hooks/useMyCircles";
import { useAllCircles } from "@/hooks/useAllCircles";
import { Faucet } from "@/components/ui/Faucet";
import { Spinner } from "@/components/ui/Spinner";
import { StateBadge } from "@/components/ui/Badge";
import {
  formatUsdc,
  formatFrequency,
  truncateAddress,
  explorerUrl,
} from "@/lib/utils";

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

// ── Circle row ────────────────────────────────────────────
const CircleRow: FC<{ circle: any; isMyCircle?: boolean }> = ({
  circle,
  isMyCircle,
}) => {
  const href = isMyCircle
    ? `/app/my-circles/${circle.address.toBase58()}`
    : `/app/circles/${circle.address.toBase58()}`;

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.05)",
          cursor: "pointer",
          transition: "all 0.2s",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(124,58,237,0.25)";
          (e.currentTarget as HTMLElement).style.background =
            "rgba(124,58,237,0.04)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(255,255,255,0.05)";
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255,255,255,0.015)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.2))",
              border: "1px solid rgba(124,58,237,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            ⭕
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "14px",
                fontWeight: "600",
                color: "#F0F0FF",
                marginBottom: "2px",
              }}
            >
              {formatUsdc(circle.contributionAmount)} USDC ·{" "}
              {formatFrequency(circle.frequency)}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#5C5C7A",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {truncateAddress(circle.address.toBase58(), 6)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#A0A0B8",
                marginBottom: "2px",
              }}
            >
              {circle.currentMembers}/{circle.totalMembers} members
            </div>
            {isMyCircle && (
              <div style={{ fontSize: "12px", color: "#6B6B8A" }}>
                Position {circle.position}
              </div>
            )}
          </div>
          <StateBadge state={circle.state} />
        </div>
      </div>
    </Link>
  );
};

// ── Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const { publicKey } = useWallet();
  const { circles: myCircles, loading: myLoading } = useMyCircles();
  const { circles: allCircles, loading: allLoading } = useAllCircles();

  //const activeCircles = myCircles.filter((c) => c.state?.active);
  const completedCircles = myCircles.filter((c) => c.state?.completed);
  const openCircles = allCircles.filter((c) => c.state?.open || c.state?.ready);

  return (
    <div className="section" style={{ padding: "2.5rem 1rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "2.5rem",
          flexWrap: "wrap",
          gap: "1rem",
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
            Dashboard
          </h1>
          <p
            style={{
              color: "#6B6B8A",
              fontSize: "14px",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {publicKey ? truncateAddress(publicKey.toBase58(), 8) : ""}
          </p>
        </div>

        <Link
          href="/app/circles/create"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 22px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
            color: "#fff",
            fontWeight: "600",
            fontSize: "14px",
            textDecoration: "none",
            boxShadow: "0 0 30px rgba(124,58,237,0.3)",
            border: "1px solid rgba(124,58,237,0.5)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2v12M2 8h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Create Circle
        </Link>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        <StatCard
          label="My Circles"
          value={myLoading ? "—" : myCircles.length.toString()}
          sub="total joined"
          color="#7C3AED"
          icon="⭕"
        />
        <StatCard
          label="Completed"
          value={myLoading ? "—" : completedCircles.length.toString()}
          sub="finished"
          color="#06B6D4"
          icon="✓"
        />
        <StatCard
          label="Open Circles"
          value={allLoading ? "—" : openCircles.length.toString()}
          sub="available to join"
          color="#F59E0B"
          icon="🔓"
        />
      </div>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left — circles */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* My active circles */}
          <div
            style={{
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#F0F0FF",
                }}
              >
                My Circles
              </h2>
              <Link
                href="/app/my-circles"
                style={{
                  fontSize: "13px",
                  color: "#7C3AED",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                View all
              </Link>
            </div>

            {myLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "2rem",
                }}
              >
                <Spinner size={24} />
              </div>
            ) : myCircles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
                  ⭕
                </div>
                <p
                  style={{
                    color: "#6B6B8A",
                    fontSize: "14px",
                    marginBottom: "1rem",
                  }}
                >
                  You have not joined any circles yet
                </p>
                <Link
                  href="/app/circles"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    background: "rgba(124,58,237,0.1)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    color: "#A78BFA",
                    fontSize: "13px",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  Browse Circles
                </Link>
              </div>
            ) : (
              myCircles
                .slice(0, 5)
                .map((circle) => (
                  <CircleRow
                    key={circle.address.toBase58()}
                    circle={circle}
                    isMyCircle
                  />
                ))
            )}
          </div>

          {/* Open circles */}
          <div
            style={{
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#F0F0FF",
                }}
              >
                Open Circles
              </h2>
              <Link
                href="/app/circles"
                style={{
                  fontSize: "13px",
                  color: "#7C3AED",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                View all
              </Link>
            </div>

            {allLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "2rem",
                }}
              >
                <Spinner size={24} />
              </div>
            ) : openCircles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <p
                  style={{
                    color: "#6B6B8A",
                    fontSize: "14px",
                    marginBottom: "1rem",
                  }}
                >
                  No open circles right now
                </p>
                <Link
                  href="/app/circles/create"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    background: "rgba(124,58,237,0.1)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    color: "#A78BFA",
                    fontSize: "13px",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  Create First Circle
                </Link>
              </div>
            ) : (
              openCircles
                .slice(0, 5)
                .map((circle) => (
                  <CircleRow key={circle.address.toBase58()} circle={circle} />
                ))
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Faucet */}
          <Faucet />

          {/* Quick links */}
          <div
            style={{
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "1.5rem",
            }}
          >
            <h3
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "14px",
                fontWeight: "600",
                color: "#F0F0FF",
                marginBottom: "1rem",
              }}
            >
              Quick Links
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {[
                {
                  label: "Create a circle",
                  href: "/app/circles/create",
                  icon: "➕",
                },
                {
                  label: "Browse all circles",
                  href: "/app/circles",
                  icon: "🔍",
                },
                { label: "My circles", href: "/app/my-circles", icon: "⭕" },
                {
                  label: "View on Explorer",
                  href: explorerUrl(process.env.NEXT_PUBLIC_PROGRAM_ID ?? ""),
                  icon: "🔗",
                  external: true,
                },
              ].map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      borderRadius: "9px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      color: "#6B6B8A",
                      fontSize: "13px",
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      borderRadius: "9px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      color: "#6B6B8A",
                      fontSize: "13px",
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Protocol info */}
          <div
            style={{
              background: "rgba(124,58,237,0.05)",
              border: "1px solid rgba(124,58,237,0.15)",
              borderRadius: "16px",
              padding: "1.25rem",
            }}
          >
            <h3
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "13px",
                fontWeight: "600",
                color: "#A78BFA",
                marginBottom: "0.75rem",
              }}
            >
              Program Info
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {[
                {
                  label: "Program ID",
                  value: truncateAddress(
                    process.env.NEXT_PUBLIC_PROGRAM_ID ?? "",
                    6
                  ),
                },
                { label: "Network", value: "Devnet" },
                { label: "Standard", value: "Token 2022" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#5C5C7A" }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#A0A0B8",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
