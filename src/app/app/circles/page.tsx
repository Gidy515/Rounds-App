"use client";

import { FC, useState } from "react";
import Link from "next/link";
import { useAllCircles, CircleData } from "@/hooks/useAllCircles";
import { StateBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  formatUsdc,
  formatFrequency,
  truncateAddress,
  explorerUrl,
} from "@/lib/utils";

// ── Filters ───────────────────────────────────────────────
type StateFilter = "all" | "open" | "ready" | "active" | "completed";
type FreqFilter = "all" | "daily" | "weekly" | "biweekly" | "monthly";

// ── Circle card ───────────────────────────────────────────
const CircleCard: FC<{ circle: CircleData }> = ({ circle }) => {
  const fillPct =
    circle.totalMembers > 0
      ? Math.round((circle.currentMembers / circle.totalMembers) * 100)
      : 0;

  const stateKey = Object.keys(circle.state)[0];

  return (
    <Link
      href={`/app/circles/${circle.address.toBase58()}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.018)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px",
          padding: "1.5rem",
          cursor: "pointer",
          transition: "all 0.25s",
          position: "relative",
          overflow: "hidden",
          height: "100%",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "rgba(124,58,237,0.3)";
          el.style.background = "rgba(124,58,237,0.04)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "rgba(255,255,255,0.06)";
          el.style.background = "rgba(255,255,255,0.018)";
          el.style.transform = "translateY(0)";
        }}
      >
        {/* Top gradient line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background:
              stateKey === "active"
                ? "linear-gradient(90deg, #10B981, transparent)"
                : stateKey === "ready"
                ? "linear-gradient(90deg, #F59E0B, transparent)"
                : "linear-gradient(90deg, #7C3AED, transparent)",
          }}
        />

        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.2))",
              border: "1px solid rgba(124,58,237,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            ⭕
          </div>
          <StateBadge state={circle.state} />
        </div>

        {/* Contribution amount */}
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#F0F0FF",
            marginBottom: "2px",
            letterSpacing: "-0.02em",
          }}
        >
          {formatUsdc(circle.contributionAmount)}
          <span
            style={{
              fontSize: "14px",
              color: "#6B6B8A",
              fontWeight: "400",
              marginLeft: "4px",
            }}
          >
            USDC
          </span>
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#6B6B8A",
            marginBottom: "1.25rem",
          }}
        >
          per member · {formatFrequency(circle.frequency)}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          {[
            {
              label: "Members",
              value: `${circle.currentMembers}/${circle.totalMembers}`,
            },
            {
              label: "Cycle",
              value:
                circle.currentCycle > 0
                  ? `${circle.currentCycle}/${circle.activeMembers}`
                  : "—",
            },
            {
              label: "Collateral",
              value: `${formatUsdc(
                (circle.totalMembers - 1) * circle.contributionAmount.toNumber()
              )} max`,
            },
            { label: "Frequency", value: formatFrequency(circle.frequency) },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.025)",
                borderRadius: "8px",
                padding: "0.6rem 0.75rem",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#5C5C7A",
                  marginBottom: "2px",
                  letterSpacing: "0.04em",
                }}
              >
                {s.label.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#A0A0B8",
                  fontWeight: "500",
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Fill progress bar */}
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#5C5C7A" }}>
              Seats filled
            </span>
            <span
              style={{ fontSize: "12px", color: "#A0A0B8", fontWeight: "600" }}
            >
              {fillPct}%
            </span>
          </div>
          <div
            style={{
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${fillPct}%`,
                borderRadius: "2px",
                background:
                  fillPct === 100
                    ? "linear-gradient(90deg, #10B981, #06B6D4)"
                    : "linear-gradient(90deg, #7C3AED, #A78BFA)",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Address */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "#3A3A5C",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {truncateAddress(circle.address.toBase58(), 6)}
          </span>

          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(
                explorerUrl(circle.address.toBase58()),
                "_blank",
                "noreferrer"
              );
            }}
            style={{
              fontSize: "11px",
              color: "#7C3AED",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            {"Explorer"}
          </span>
        </div>
      </div>
    </Link>
  );
};

// ── Filter pill ───────────────────────────────────────────
const FilterPill: FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}> = ({ label, active, onClick, color = "#7C3AED" }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 14px",
      borderRadius: "9999px",
      fontSize: "13px",
      fontWeight: active ? "600" : "400",
      color: active ? color : "#5C5C7A",
      background: active ? `${color}15` : "transparent",
      border: active
        ? `1px solid ${color}30`
        : "1px solid rgba(255,255,255,0.05)",
      cursor: "pointer",
      transition: "all 0.15s",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </button>
);

// ── Main page ─────────────────────────────────────────────
export default function CirclesPage() {
  const { circles, loading, error, refetch } = useAllCircles();

  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [freqFilter, setFreqFilter] = useState<FreqFilter>("all");
  const [search, setSearch] = useState("");

  // Apply filters
  const filtered = circles.filter((c) => {
    const stateKey = Object.keys(c.state)[0];

    if (stateFilter !== "all" && stateKey !== stateFilter) return false;

    if (freqFilter !== "all") {
      const freqKey = Object.keys(c.frequency)[0];
      if (freqKey !== freqFilter) return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const addr = c.address.toBase58().toLowerCase();
      const amt = formatUsdc(c.contributionAmount).toLowerCase();
      if (!addr.includes(q) && !amt.includes(q)) return false;
    }

    return true;
  });

  const counts = {
    all: circles.length,
    open: circles.filter((c) => c.state?.open).length,
    ready: circles.filter((c) => c.state?.ready).length,
    active: circles.filter((c) => c.state?.active).length,
    completed: circles.filter((c) => c.state?.completed).length,
  };

  return (
    <div className="section" style={{ padding: "2.5rem 1rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "2rem",
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
            Savings Circles
          </h1>
          <p style={{ color: "#6B6B8A", fontSize: "14px" }}>
            {loading ? "Loading..." : `${circles.length} circles found`}
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

      {/* Search + filters */}
      <div style={{ marginBottom: "2rem" }}>
        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <circle cx="7" cy="7" r="4.5" stroke="#5C5C7A" strokeWidth="1.5" />
            <path
              d="M10.5 10.5l2.5 2.5"
              stroke="#5C5C7A"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by address or amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "10px 14px 10px 40px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "12px",
              color: "#F0F0FF",
              fontSize: "14px",
              outline: "none",
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>

        {/* State filters */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "0.75rem",
          }}
        >
          {(
            [
              { key: "all", label: `All (${counts.all})` },
              { key: "open", label: `Open (${counts.open})` },
              { key: "ready", label: `Ready (${counts.ready})` },
              { key: "active", label: `Active (${counts.active})` },
              { key: "completed", label: `Completed (${counts.completed})` },
            ] as { key: StateFilter; label: string }[]
          ).map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              active={stateFilter === f.key}
              onClick={() => setStateFilter(f.key)}
            />
          ))}
        </div>

        {/* Frequency filters */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "12px",
              color: "#5C5C7A",
              alignSelf: "center",
              marginRight: "4px",
            }}
          >
            Frequency:
          </span>
          {(
            [
              { key: "all", label: "All" },
              { key: "daily", label: "Daily" },
              { key: "weekly", label: "Weekly" },
              { key: "biweekly", label: "Biweekly" },
              { key: "monthly", label: "Monthly" },
            ] as { key: FreqFilter; label: string }[]
          ).map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              active={freqFilter === f.key}
              onClick={() => setFreqFilter(f.key)}
              color="#06B6D4"
            />
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "5rem",
            gap: "1rem",
          }}
        >
          <Spinner size={32} />
          <p style={{ color: "#6B6B8A", fontSize: "14px" }}>
            Loading circles from devnet...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.1)",
            borderRadius: "16px",
          }}
        >
          <p style={{ color: "#EF4444", marginBottom: "1rem" }}>
            Failed to load circles
          </p>
          <button
            onClick={refetch}
            className="btn-secondary"
            style={{ fontSize: "14px" }}
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "5rem 2rem",
            background: "rgba(255,255,255,0.01)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "20px",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⭕</div>
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#F0F0FF",
              marginBottom: "0.5rem",
            }}
          >
            No circles found
          </h3>
          <p
            style={{
              color: "#6B6B8A",
              fontSize: "14px",
              marginBottom: "1.5rem",
            }}
          >
            {circles.length === 0
              ? "No circles exist yet. Be the first to create one."
              : "Try adjusting your filters."}
          </p>
          <Link
            href="/app/circles/create"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 22px",
              borderRadius: "12px",
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)",
              color: "#A78BFA",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Create First Circle
          </Link>
        </div>
      ) : (
        <>
          <p
            style={{
              fontSize: "13px",
              color: "#5C5C7A",
              marginBottom: "1.25rem",
            }}
          >
            Showing {filtered.length} of {circles.length} circles
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {filtered.map((circle) => (
              <CircleCard key={circle.address.toBase58()} circle={circle} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
