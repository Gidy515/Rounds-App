"use client";

import { FC, useState, useEffect } from "react";
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

// ── SVG icon set ──────────────────────────────────────────
const Icon: FC<{ name: string; size?: number; color?: string }> = ({
  name,
  size = 16,
  color = "currentColor",
}) => {
  const s = { width: size, height: size };
  if (name === "circle")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <circle
          cx="12"
          cy="12"
          r="5"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.4"
        />
      </svg>
    );
  if (name === "check")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  if (name === "unlock")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  if (name === "search")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    );
  if (name === "link")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  if (name === "trend")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  if (name === "my")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    );
  return null;
};

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
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = `${color}30`;
      (
        e.currentTarget as HTMLElement
      ).style.background = `rgba(255,255,255,0.028)`;
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor =
        "rgba(255,255,255,0.06)";
      (e.currentTarget as HTMLElement).style.background =
        "rgba(255,255,255,0.018)";
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
      <span style={{ color, opacity: 0.8 }}>
        <Icon name={icon} size={18} color={color} />
      </span>
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
    {sub && (
      <div style={{ fontSize: "12px", color: "#5C5C7A", marginTop: "4px" }}>
        {sub}
      </div>
    )}
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
          padding: "0.875rem 1.1rem",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.012)",
          border: "1px solid rgba(255,255,255,0.05)",
          cursor: "pointer",
          transition: "all 0.2s",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "rgba(124,58,237,0.35)";
          el.style.background = "rgba(124,58,237,0.06)";
          el.style.transform = "translateX(3px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "rgba(255,255,255,0.05)";
          el.style.background = "rgba(255,255,255,0.012)";
          el.style.transform = "translateX(0)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(6,182,212,0.15))",
              border: "1px solid rgba(124,58,237,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img
              src="/rounds-icon.jpg"
              alt=""
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "5px",
                objectFit: "cover",
              }}
            />
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
              <div style={{ fontSize: "12px", color: "#7C3AED" }}>
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

// ── Quick link item ───────────────────────────────────────
const QuickLink: FC<{
  label: string;
  href: string;
  icon: string;
  external?: boolean;
}> = ({ label, href, icon, external }) => {
  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        color: "#6B6B8A",
        fontSize: "13px",
        textDecoration: "none",
        transition: "all 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "rgba(124,58,237,0.07)";
        el.style.borderColor = "rgba(124,58,237,0.2)";
        el.style.color = "#A78BFA";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "rgba(255,255,255,0.02)";
        el.style.borderColor = "rgba(255,255,255,0.04)";
        el.style.color = "#6B6B8A";
      }}
    >
      <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={14} />
      </span>
      <span>{label}</span>
    </div>
  );
  if (external)
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: "none" }}
      >
        {inner}
      </a>
    );
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      {inner}
    </Link>
  );
};

// ── Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const { publicKey } = useWallet();
  const { circles: myCircles, loading: myLoading } = useMyCircles();
  const { circles: allCircles, loading: allLoading } = useAllCircles();

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
            {publicKey
              ? truncateAddress(publicKey.toBase58(), 8)
              : "Connect your wallet"}
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
          <Icon name="plus" size={16} color="#fff" />
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
          icon="my"
        />
        <StatCard
          label="Completed"
          value={myLoading ? "—" : completedCircles.length.toString()}
          sub="finished"
          color="#06B6D4"
          icon="check"
        />
        <StatCard
          label="Open Circles"
          value={allLoading ? "—" : openCircles.length.toString()}
          sub="available to join"
          color="#F59E0B"
          icon="unlock"
        />
        <StatCard
          label="Yield"
          value="Active"
          sub="Kamino · live APY"
          color="#10B981"
          icon="trend"
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
        {/* Left */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* My circles */}
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
                <div style={{ marginBottom: "1rem" }}>
                  <img
                    src="/rounds-icon.jpg"
                    alt=""
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      objectFit: "cover",
                      opacity: 0.35,
                    }}
                  />
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
                .map((c) => (
                  <CircleRow key={c.address.toBase58()} circle={c} isMyCircle />
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
                .map((c) => <CircleRow key={c.address.toBase58()} circle={c} />)
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
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
              <QuickLink
                label="Create a circle"
                href="/app/circles/create"
                icon="plus"
              />
              <QuickLink
                label="Browse all circles"
                href="/app/circles"
                icon="search"
              />
              <QuickLink label="My circles" href="/app/my-circles" icon="my" />
              <QuickLink label="My yield" href="/app/collateral" icon="trend" />
              <QuickLink
                label="View on Explorer"
                href={explorerUrl(process.env.NEXT_PUBLIC_PROGRAM_ID ?? "")}
                icon="link"
                external
              />
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
              Protocol Info
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
                  label: "Contract",
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
