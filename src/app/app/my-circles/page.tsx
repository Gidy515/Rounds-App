"use client";

import { FC, useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMyCircles, MyCircleData } from "@/hooks/useMyCircles";
import { StateBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatUsdc, formatFrequency, truncateAddress } from "@/lib/utils";

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
const MyCircleCard: FC<{
  circle: MyCircleData;
  onDismiss?: (addr: string) => void;
}> = ({ circle, onDismiss }) => {
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

  const needsAction = stateKey === "active" && !circle.hasReceivedPot;

  return (
    <div style={{ position: "relative" }}>
      {/* X dismiss button */}
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
        href={`/app/my-circles/${circle.address.toBase58()}`}
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
          {/* Top accent */}
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

          {/* Pulse for action needed */}
          {needsAction && (
            <div
              style={{
                position: "absolute",
                top: "1rem",
                right: isDismissable ? "2.5rem" : "1rem",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#F59E0B",
                boxShadow: "0 0 8px #F59E0B",
                animation: "pulse 2s infinite",
              }}
            />
          )}

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              marginBottom: "1.25rem",
              paddingRight: isDismissable ? "24px" : "0",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "16px",
                fontWeight: "700",
                color: accentColor,
                flexShrink: 0,
              }}
            >
              {circle.position}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "#F0F0FF",
                  marginBottom: "2px",
                  letterSpacing: "-0.01em",
                }}
              >
                {formatUsdc(circle.contributionAmount)} USDC
              </div>
              <div style={{ fontSize: "13px", color: "#6B6B8A" }}>
                {formatFrequency(circle.frequency)} · {circle.totalMembers}{" "}
                members
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            {[
              {
                label: "Position",
                value: `#${circle.position} of ${circle.totalMembers}`,
                color: accentColor,
              },
              {
                label: "Cycle",
                value:
                  circle.currentCycle > 0
                    ? `${circle.currentCycle}/${circle.totalMembers}`
                    : "Not started",
                color: "#A0A0B8",
              },
              {
                label: "Locked",
                value: `${formatUsdc(circle.collateralLocked)} USDC`,
                color: "#A0A0B8",
              },
              {
                label: "Payout",
                value: circle.hasReceivedPot ? "Received" : "Pending",
                color: circle.hasReceivedPot ? "#10B981" : "#6B6B8A",
              },
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
                    color: s.color,
                    fontWeight: "500",
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <StateBadge state={circle.state} />
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
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
                style={{
                  fontSize: "11px",
                  color: "#3A3A5C",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {truncateAddress(circle.address.toBase58(), 6)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────
const EmptyState: FC = () => (
  <div
    style={{
      textAlign: "center",
      padding: "5rem 2rem",
      background: "rgba(255,255,255,0.01)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: "20px",
    }}
  >
    <div style={{ marginBottom: "1rem" }}>
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
      No circles yet
    </h3>
    <p
      style={{
        color: "#6B6B8A",
        fontSize: "14px",
        marginBottom: "1.5rem",
        lineHeight: "1.6",
      }}
    >
      You have not joined any savings circles. Browse open circles or create
      your own.
    </p>
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
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
        Browse Circles
      </Link>
      <Link
        href="/app/circles/create"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 20px",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#A0A0B8",
          fontSize: "14px",
          fontWeight: "500",
          textDecoration: "none",
        }}
      >
        Create Circle
      </Link>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────
export default function MyCirclesPage() {
  const { publicKey } = useWallet();
  const { circles, loading, error, refetch } = useMyCircles();
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
  const active = visible.filter((c) => c.state?.active);
  const open = visible.filter((c) => c.state?.open || c.state?.ready);
  const completed = visible.filter((c) => c.state?.completed);
  const cancelled = visible.filter((c) => c.state?.cancelled);

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
            My Circles
          </h1>
          <p style={{ color: "#6B6B8A", fontSize: "14px" }}>
            {loading
              ? "Loading..."
              : `${visible.length} circle${visible.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={refetch}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#6B6B8A",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ↻ Refresh
          </button>
          <Link
            href="/app/circles"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 18px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
              color: "#fff",
              fontWeight: "600",
              fontSize: "13px",
              textDecoration: "none",
              border: "1px solid rgba(124,58,237,0.5)",
            }}
          >
            Browse More
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      {visible.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.75rem",
            marginBottom: "2rem",
          }}
        >
          {[
            { label: "Active", value: active.length, color: "#10B981" },
            { label: "Open", value: open.length, color: "#7C3AED" },
            { label: "Completed", value: completed.length, color: "#06B6D4" },
            { label: "Cancelled", value: cancelled.length, color: "#EF4444" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "1rem",
                textAlign: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (
                  e.currentTarget as HTMLElement
                ).style.borderColor = `${s.color}30`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.06)";
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: s.color,
                  lineHeight: "1",
                  marginBottom: "4px",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#5C5C7A",
                  fontWeight: "500",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

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
            Loading your circles...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
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
      ) : visible.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {active.length > 0 && (
            <div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#10B981",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10B981",
                    boxShadow: "0 0 6px #10B981",
                    display: "inline-block",
                  }}
                />
                Active Circles
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1rem",
                }}
              >
                {active.map((c) => (
                  <MyCircleCard
                    key={c.address.toBase58()}
                    circle={c}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            </div>
          )}

          {open.length > 0 && (
            <div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#A78BFA",
                  marginBottom: "1rem",
                }}
              >
                Waiting to Start
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1rem",
                }}
              >
                {open.map((c) => (
                  <MyCircleCard
                    key={c.address.toBase58()}
                    circle={c}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#06B6D4",
                  marginBottom: "1rem",
                }}
              >
                Completed
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1rem",
                }}
              >
                {completed.map((c) => (
                  <MyCircleCard
                    key={c.address.toBase58()}
                    circle={c}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            </div>
          )}

          {cancelled.length > 0 && (
            <div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#EF4444",
                  marginBottom: "1rem",
                }}
              >
                Cancelled
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1rem",
                }}
              >
                {cancelled.map((c) => (
                  <MyCircleCard
                    key={c.address.toBase58()}
                    circle={c}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
