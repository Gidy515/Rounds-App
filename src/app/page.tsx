"use client";

import { FC, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/layout/Navbar";
import { WalletButton } from "@/components/wallet/WalletButton";

// ── Animated number ───────────────────────────────────────
const AnimatedNumber: FC<{
  value: number;
  suffix?: string;
  prefix?: string;
}> = ({ value, suffix = "", prefix = "" }) => {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(Math.floor(eased * value));
      if (t < 1) requestAnimationFrame(tick);
      else setDisplay(value);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </>
  );
};

// ── Glow orb ──────────────────────────────────────────────
const GlowOrb: FC<{
  size: number;
  color: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  opacity?: number;
  blur?: number;
}> = ({ size, color, top, left, right, bottom, opacity = 1, blur = 120 }) => (
  <div
    style={{
      position: "absolute",
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: color,
      top,
      left,
      right,
      bottom,
      filter: `blur(${blur}px)`,
      opacity,
      pointerEvents: "none",
    }}
  />
);

// ── Pill badge ────────────────────────────────────────────
const PillBadge: FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = "#7C3AED",
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 16px",
      borderRadius: "9999px",
      background: `${color}15`,
      border: `1px solid ${color}30`,
      fontSize: "12px",
      fontWeight: "600",
      color: color,
      letterSpacing: "0.04em",
    }}
  >
    {children}
  </div>
);

// ── Section label ─────────────────────────────────────────
const SectionLabel: FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = "#7C3AED",
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      marginBottom: "1.25rem",
    }}
  >
    <div
      style={{
        height: "1px",
        width: "32px",
        background: `linear-gradient(90deg, transparent, ${color})`,
      }}
    />
    <span
      style={{
        fontSize: "11px",
        fontWeight: "700",
        color,
        letterSpacing: "0.15em",
        textTransform: "uppercase" as const,
      }}
    >
      {children}
    </span>
    <div
      style={{
        height: "1px",
        width: "32px",
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }}
    />
  </div>
);

// ── Section heading ───────────────────────────────────────
const SectionHeading: FC<{ children: React.ReactNode; sub?: string }> = ({
  children,
  sub,
}) => (
  <div style={{ textAlign: "center", marginBottom: sub ? "4rem" : "3rem" }}>
    <h2
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
        fontWeight: "700",
        letterSpacing: "-0.025em",
        color: "#F0F0FF",
        lineHeight: "1.15",
        marginBottom: sub ? "1rem" : 0,
      }}
    >
      {children}
    </h2>
    {sub && (
      <p
        style={{
          color: "#6B6B8A",
          fontSize: "15px",
          lineHeight: "1.7",
          maxWidth: "460px",
          margin: "0 auto",
        }}
      >
        {sub}
      </p>
    )}
  </div>
);

// ── Hero ──────────────────────────────────────────────────
const Hero: FC = () => {
  const { connected } = useWallet();

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: "#05050D",
        padding: "8rem 1.5rem 5rem",
      }}
    >
      <GlowOrb
        size={700}
        color="rgba(124,58,237,0.18)"
        top="-15%"
        left="-10%"
      />
      <GlowOrb
        size={500}
        color="rgba(6,182,212,0.12)"
        top="40%"
        right="-8%"
        blur={100}
      />
      <GlowOrb
        size={400}
        color="rgba(245,158,11,0.07)"
        bottom="0%"
        left="35%"
        blur={150}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "880px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "2.5rem" }}>
          <PillBadge color="#10B981">
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 8px #10B981",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }}
            />
            Live on Solana Devnet
          </PillBadge>
        </div>

        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(3rem, 8.5vw, 6rem)",
            fontWeight: "700",
            lineHeight: "1.06",
            letterSpacing: "-0.035em",
            color: "#F0F0FF",
            marginBottom: "2rem",
          }}
        >
          Savings Circles
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, #B78BFA 0%, #7C3AED 35%, #06B6D4 75%, #67E8F9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Without Trust
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "#6B6B8A",
            lineHeight: "1.8",
            maxWidth: "540px",
            margin: "0 auto 3rem",
            fontWeight: "400",
          }}
        >
          Rounds Protocol brings the ancient West African rotating savings
          tradition — Adashe, Ajo, Esusu — onchain. Trustless. Non-custodial.
          Mathematically enforced.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "5rem",
          }}
        >
          {connected ? (
            <Link
              href="/app"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
                color: "#fff",
                fontWeight: "600",
                fontSize: "15px",
                textDecoration: "none",
                boxShadow:
                  "0 0 40px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
                border: "1px solid rgba(124,58,237,0.5)",
              }}
            >
              {"Open App"}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ) : (
            <WalletButton />
          )}
          <Link
            href="/app/circles"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 28px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.03)",
              color: "#A0A0B8",
              fontWeight: "500",
              fontSize: "15px",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(10px)",
            }}
          >
            {"Browse Circles"}
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "20px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
            maxWidth: "680px",
            margin: "0 auto",
          }}
        >
          {[
            {
              value: 100,
              suffix: "%",
              label: "Non-custodial",
              color: "#A78BFA",
            },
            { value: 0, suffix: "%", label: "Default risk", color: "#06B6D4" },
            { value: 14, suffix: "", label: "Instructions", color: "#F59E0B" },
            { value: 20, suffix: "", label: "Max members", color: "#10B981" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "1.75rem 1rem",
                textAlign: "center",
                background: "rgba(8,8,20,0.8)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.75rem",
                  fontWeight: "700",
                  color: s.color,
                  lineHeight: "1",
                  marginBottom: "6px",
                }}
              >
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#5C5C7A",
                  fontWeight: "500",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "2.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          opacity: 0.35,
        }}
      >
        <div
          style={{
            width: "1px",
            height: "48px",
            background: "linear-gradient(#7C3AED, transparent)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: "10px",
            letterSpacing: "0.15em",
            color: "#5C5C7A",
            fontWeight: "600",
          }}
        >
          {"SCROLL"}
        </span>
      </div>
    </section>
  );
};

// ── Protocol flow ─────────────────────────────────────────
const ProtocolFlow: FC = () => {
  const steps = [
    {
      num: "01",
      color: "#7C3AED",
      tag: "Creation",
      title: "Create or Join a Circle",
      body: "Set contribution amount, member count, and payout frequency. Lock sliding-scale collateral that makes defaulting always irrational. First round contributions fund the pot immediately.",
      detail:
        "Position 1 receives a 10% premium embedded in the cycle 1 pot as compensation for earliest risk.",
    },
    {
      num: "02",
      color: "#06B6D4",
      tag: "Activation",
      title: "Circle Starts",
      body: "Any wallet calls start_circle once all seats fill. Cycle 1 is already funded. Disbursement can happen immediately. The clock starts for all subsequent cycles.",
      detail:
        "A u64 bitmask PaymentRecord tracks who has paid each cycle. One account read confirms readiness.",
    },
    {
      num: "03",
      color: "#F59E0B",
      tag: "Cycle Loop",
      title: "Cycles Run Automatically",
      body: "Members pay each cycle. Permissionless keepers disburse pots and process defaults. Defaulters lose collateral. Kicked members never block the circle.",
      detail:
        "process_default works exactly like Aave/Kamino liquidations — any wallet triggers it after deadline.",
    },
    {
      num: "04",
      color: "#10B981",
      tag: "Completion",
      title: "Claim Collateral",
      body: "After the final disbursement the circle is Completed. Every member claims their collateral independently. Never defaulted? Full refund. Each slash was exactly one contribution amount.",
      detail:
        "CollateralRecord PDA: total_locked = total_released + total_slashed. Immutable. Permanent.",
    },
  ];

  return (
    <section
      style={{
        padding: "7rem 1.5rem",
        background: "#07070F",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <GlowOrb
        size={600}
        color="rgba(124,58,237,0.06)"
        top="30%"
        left="50%"
        blur={200}
      />
      <div className="section">
        <SectionLabel color="#7C3AED">{"How it works"}</SectionLabel>
        <SectionHeading sub="Four phases. Fully automated. Zero human intermediaries.">
          {"A Circle Runs Itself"}
        </SectionHeading>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {steps.map((step) => (
            <div
              key={step.num}
              style={{
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
                padding: "2rem",
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
                  background: `linear-gradient(90deg, ${step.color}, transparent)`,
                }}
              />
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "3.5rem",
                  fontWeight: "700",
                  color: step.color,
                  opacity: 0.15,
                  lineHeight: "1",
                  marginBottom: "1.25rem",
                  letterSpacing: "-0.04em",
                }}
              >
                {step.num}
              </div>
              <div
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  background: `${step.color}15`,
                  border: `1px solid ${step.color}25`,
                  fontSize: "11px",
                  fontWeight: "600",
                  color: step.color,
                  letterSpacing: "0.05em",
                  marginBottom: "0.75rem",
                }}
              >
                {step.tag}
              </div>
              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.05rem",
                  fontWeight: "600",
                  color: "#F0F0FF",
                  marginBottom: "0.75rem",
                  lineHeight: "1.3",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  color: "#6B6B8A",
                  fontSize: "13.5px",
                  lineHeight: "1.75",
                  marginBottom: "1rem",
                }}
              >
                {step.body}
              </p>
              <p
                style={{
                  color: step.color,
                  fontSize: "12px",
                  lineHeight: "1.6",
                  padding: "0.75rem",
                  background: `${step.color}08`,
                  borderRadius: "8px",
                  border: `1px solid ${step.color}15`,
                }}
              >
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Features ──────────────────────────────────────────────
const Features: FC = () => {
  const features = [
    {
      icon: "🔐",
      title: "Collateral Invariant",
      color: "#7C3AED",
      body: "collateral_locked >= remaining_cycles x contribution_amount enforced at every state transition. Defaulting is provably irrational.",
    },
    {
      icon: "⚡",
      title: "Permissionless Keepers",
      color: "#06B6D4",
      body: "Any wallet triggers disbursements and defaults after deadlines. Same model as Aave liquidation bots. Zero liveness risk.",
    },
    {
      icon: "🌍",
      title: "Cultural Foundation",
      color: "#F59E0B",
      body: "Adashe, Ajo, Esusu. Practiced for centuries across West Africa. Now trustless and global.",
    },
    {
      icon: "🏛️",
      title: "Non-Custodial",
      color: "#10B981",
      body: "All funds in program-derived PDAs. No admin key touches vaults. The program ID is the sole authority.",
    },
    {
      icon: "📋",
      title: "Immutable Audit Trail",
      color: "#EF4444",
      body: "CollateralRecord: total_locked = total_released + total_slashed. Permanently onchain. Verifiable by anyone.",
    },
    {
      icon: "🔄",
      title: "Token Interface Native",
      color: "#A78BFA",
      body: "Supports SPL Token and Token 2022. Mainnet USDC compatible. Zero program changes at launch.",
    },
  ];

  return (
    <section
      style={{
        padding: "7rem 1.5rem",
        background: "#05050D",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <GlowOrb
        size={500}
        color="rgba(6,182,212,0.07)"
        top="20%"
        right="-5%"
        blur={160}
      />
      <div className="section">
        <SectionLabel color="#06B6D4">{"Protocol Design"}</SectionLabel>
        <SectionHeading sub="Every decision in the protocol exists for a specific reason.">
          {"Built for the Long Game"}
        </SectionHeading>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
                padding: "1.75rem",
                position: "relative",
                overflow: "hidden",
                cursor: "default",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                (
                  e.currentTarget as HTMLElement
                ).style.borderColor = `${f.color}30`;
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.025)";
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
                  height: "1px",
                  background: `linear-gradient(90deg, transparent, ${f.color}50, transparent)`,
                }}
              />
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `${f.color}15`,
                  border: `1px solid ${f.color}25`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  marginBottom: "1.25rem",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#F0F0FF",
                  marginBottom: "0.5rem",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  color: "#6B6B8A",
                  fontSize: "13.5px",
                  lineHeight: "1.7",
                }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Comparison ────────────────────────────────────────────
const Comparison: FC = () => {
  const rows = [
    { f: "Non-custodial funds", r: true, t: false, o: true },
    { f: "No trust required", r: true, t: false, o: false },
    { f: "Default protection", r: true, t: false, o: false },
    { f: "Rotating pot structure", r: true, t: true, o: false },
    { f: "Immutable audit trail", r: true, t: false, o: true },
    { f: "Permissionless keepers", r: true, t: false, o: true },
    { f: "Cultural familiarity", r: true, t: true, o: false },
  ];

  return (
    <section style={{ padding: "7rem 1.5rem", background: "#07070F" }}>
      <div className="section">
        <SectionLabel color="#F59E0B">{"Why Rounds"}</SectionLabel>
        <SectionHeading sub="No other protocol combines cooperative savings with trustless enforcement.">
          {"Nothing Else Does This"}
        </SectionHeading>
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            borderRadius: "24px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "#0D0D1A",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              padding: "1.25rem 2rem",
              background: "rgba(255,255,255,0.025)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {["Feature", "Rounds", "Traditional", "Other DeFi"].map((h, i) => (
              <span
                key={h}
                style={{
                  textAlign: i === 0 ? "left" : "center",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: i === 1 ? "#A78BFA" : "#5C5C7A",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            ))}
          </div>
          {rows.map((row, i) => (
            <div
              key={row.f}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                padding: "1rem 2rem",
                borderBottom:
                  i < rows.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                alignItems: "center",
                background:
                  i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)",
              }}
            >
              <span style={{ fontSize: "14px", color: "#9090AA" }}>
                {row.f}
              </span>
              {[row.r, row.t, row.o].map((v, j) => (
                <div key={j} style={{ textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      background: v
                        ? j === 0
                          ? "rgba(167,139,250,0.15)"
                          : "rgba(16,185,129,0.1)"
                        : "rgba(239,68,68,0.08)",
                      fontSize: "13px",
                      color: v
                        ? j === 0
                          ? "#A78BFA"
                          : "#10B981"
                        : "#EF444460",
                    }}
                  >
                    {v ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── CTA ───────────────────────────────────────────────────
const CTA: FC = () => {
  const { connected } = useWallet();
  const explorerUrl = `https://explorer.solana.com/address/${process.env.NEXT_PUBLIC_PROGRAM_ID}?cluster=devnet`;

  return (
    <section
      style={{
        padding: "7rem 1.5rem",
        background: "#05050D",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <GlowOrb
        size={800}
        color="rgba(124,58,237,0.07)"
        top="50%"
        left="50%"
        blur={200}
      />
      <div
        className="section"
        style={{ position: "relative", textAlign: "center" }}
      >
        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            padding: "4rem 3rem",
            borderRadius: "28px",
            background: "rgba(255,255,255,0.018)",
            border: "1px solid rgba(124,58,237,0.2)",
            backdropFilter: "blur(20px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-40%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: "700",
                letterSpacing: "-0.025em",
                color: "#F0F0FF",
                marginBottom: "1rem",
                lineHeight: "1.15",
              }}
            >
              {"Start Your First "}
              <span
                style={{
                  background: "linear-gradient(135deg, #A78BFA, #06B6D4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {"Circle"}
              </span>
            </h2>
            <p
              style={{
                color: "#6B6B8A",
                fontSize: "15px",
                lineHeight: "1.7",
                maxWidth: "380px",
                margin: "0 auto 2.5rem",
              }}
            >
              {
                "Connect your wallet. Get devnet USDC from our faucet. Create or join a circle in under 2 minutes."
              }
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: "2.5rem",
              }}
            >
              {connected ? (
                <Link
                  href="/app"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "15px 32px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "15px",
                    textDecoration: "none",
                    boxShadow:
                      "0 0 40px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
                    border: "1px solid rgba(124,58,237,0.5)",
                  }}
                >
                  {"Open Dashboard"}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ) : (
                <WalletButton />
              )}
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "15px 32px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)",
                  color: "#6B6B8A",
                  fontWeight: "500",
                  fontSize: "15px",
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {"View on Explorer"}
              </a>
            </div>
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {["Open source", "Non-custodial", "Devnet live"].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#5C5C7A",
                  }}
                >
                  <span style={{ color: "#10B981", fontSize: "14px" }}>
                    {"✓"}
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Footer ────────────────────────────────────────────────
const Footer: FC = () => {
  const explorerUrl = `https://explorer.solana.com/address/${process.env.NEXT_PUBLIC_PROGRAM_ID}?cluster=devnet`;

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "2.5rem 1.5rem",
        background: "#05050D",
      }}
    >
      <div className="section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "7px",
                background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "12px",
                color: "white",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {"R"}
            </div>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: "600",
                fontSize: "14px",
                color: "#F0F0FF",
                letterSpacing: "-0.01em",
              }}
            >
              {"Rounds Protocol"}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#5C5C7A",
                padding: "2px 7px",
                background: "rgba(124,58,237,0.08)",
                borderRadius: "4px",
                border: "1px solid rgba(124,58,237,0.15)",
                fontWeight: "600",
              }}
            >
              {"DEVNET"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "2rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              href="/app"
              style={{
                fontSize: "13px",
                color: "#5C5C7A",
                textDecoration: "none",
              }}
            >
              {"Dashboard"}
            </Link>
            <Link
              href="/app/circles"
              style={{
                fontSize: "13px",
                color: "#5C5C7A",
                textDecoration: "none",
              }}
            >
              {"Circles"}
            </Link>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: "13px",
                color: "#5C5C7A",
                textDecoration: "none",
              }}
            >
              {"Program"}
            </a>
          </div>
          <span style={{ fontSize: "12px", color: "#3A3A5C" }}>
            {"Devnet only · Not financial advice"}
          </span>
        </div>
      </div>
    </footer>
  );
};

// ── Export ────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "64px" }}>
        <Hero />
        <ProtocolFlow />
        <Features />
        <Comparison />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
