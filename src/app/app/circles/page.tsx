"use client";

import { FC, useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAllCircles, CircleData } from "@/hooks/useAllCircles";
import { StateBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  formatUsdc,
  formatFrequency,
  truncateAddress,
  explorerUrl,
} from "@/lib/utils";

type StateFilter = "all" | "open" | "ready" | "active" | "completed";
type FreqFilter = "all" | "daily" | "weekly" | "biweekly" | "monthly";

function getDismissedKey(wallet: string) {
  return `rounds_dismissed_circles_${wallet}`;
}
function loadDismissed(wallet: string): string[] {
  try {
    const s = localStorage.getItem(getDismissedKey(wallet));
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}
function saveDismissed(wallet: string, list: string[]) {
  try {
    localStorage.setItem(getDismissedKey(wallet), JSON.stringify(list));
  } catch {}
}

// ── Circle card ───────────────────────────────────────────
const CircleCard: FC<{
  circle: CircleData;
  onDismiss?: (addr: string) => void;
}> = ({ circle, onDismiss }) => {
  const fillPct =
    circle.totalMembers > 0
      ? Math.round((circle.currentMembers / circle.totalMembers) * 100)
      : 0;
  const stateKey = Object.keys(circle.state)[0];
  const isDismissable = stateKey === "completed" || stateKey === "cancelled";

  const accentColor =
    stateKey === "active"
      ? "#10B981"
      : stateKey === "ready"
      ? "#F59E0B"
      : stateKey === "completed"
      ? "#06B6D4"
      : stateKey === "cancelled"
      ? "#EF4444"
      : "#7C3AED";

  return (
    <div style={{ position: "relative" }}>
      {/* Dismiss X button */}
      {isDismissable && onDismiss && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss(circle.address.toBase58());
          }}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#EF4444",
            fontSize: "15px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(239,68,68,0.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(239,68,68,0.12)";
          }}
          title="Hide from view"
        >
          ×
        </button>
      )}

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
            opacity: isDismissable ? 0.85 : 1,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = `${accentColor}35`;
            el.style.background = `${accentColor}08`;
            el.style.transform = "translateY(-3px)";
            el.style.boxShadow = `0 8px 30px ${accentColor}15`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "rgba(255,255,255,0.06)";
            el.style.background = "rgba(255,255,255,0.018)";
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "none";
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
              background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            }}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              gap: "0.75rem",
              paddingRight: isDismissable ? "24px" : "0",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${accentColor}20, rgba(6,182,212,0.1))`,
                border: `1px solid ${accentColor}20`,
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
                  width: "26px",
                  height: "26px",
                  borderRadius: "6px",
                  objectFit: "cover",
                }}
              />
            </div>
            <StateBadge state={circle.state} />
          </div>

          {/* Amount */}
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

          {/* Stats grid */}
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
                label: "Max Lock",
                value: `${formatUsdc(
                  (circle.totalMembers - 1) *
                    circle.contributionAmount.toNumber()
                )} USDC`,
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

          {/* Progress bar */}
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
                style={{
                  fontSize: "12px",
                  color: "#A0A0B8",
                  fontWeight: "600",
                }}
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
                      : `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>

          {/* Footer */}
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
            <div
              style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
            >
              <Link
                href={`/app/collateral/${circle.address.toBase58()}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: "11px",
                  color: "#10B981",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Yield →
              </Link>
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
                  cursor: "pointer",
                }}
              >
                Explorer
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
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
      whiteSpace: "nowrap" as const,
    }}
  >
    {label}
  </button>
);

// ── Page ──────────────────────────────────────────────────
export default function CirclesPage() {
  const { publicKey } = useWallet();
  const { circles, loading, error, refetch } = useAllCircles();
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [freqFilter, setFreqFilter] = useState<FreqFilter>("all");
  const [search, setSearch] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (!publicKey) return;
    setDismissed(loadDismissed(publicKey.toBase58()));
  }, [publicKey]);

  function handleDismiss(addr: string) {
    if (!publicKey) return;
    const updated = [...dismissed, addr];
    setDismissed(updated);
    saveDismissed(publicKey.toBase58(), updated);
  }

  const visible = circles.filter(
    (c) => !dismissed.includes(c.address.toBase58())
  );

  const filtered = visible.filter((c) => {
    const stateKey = Object.keys(c.state)[0];
    if (stateFilter !== "all" && stateKey !== stateFilter) return false;
    if (freqFilter !== "all") {
      const fk = Object.keys(c.frequency)[0];
      if (fk !== freqFilter) return false;
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
    all: visible.length,
    open: visible.filter((c) => c.state?.open).length,
    ready: visible.filter((c) => c.state?.ready).length,
    active: visible.filter((c) => c.state?.active).length,
    completed: visible.filter((c) => c.state?.completed).length,
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
            {loading ? "Loading..." : `${visible.length} circles`}
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
            Loading circles...
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
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#A0A0B8",
              fontSize: "14px",
              cursor: "pointer",
            }}
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
          <div style={{ marginBottom: "1.25rem" }}>
            <img
              src="/rounds-icon.jpg"
              alt=""
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                objectFit: "cover",
                opacity: 0.35,
              }}
            />
          </div>
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
            Showing {filtered.length} of {visible.length} circles
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {filtered.map((c) => (
              <CircleCard
                key={c.address.toBase58()}
                circle={c}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
