"use client";

import { FC, use } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCircle } from "@/hooks/useCircle";
import { useProgram } from "@/hooks/useProgram";
import { StateBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  formatUsdc,
  formatFrequency,
  truncateAddress,
  calculateCollateral,
  calculatePremium,
  calculateJoinCost,
  explorerUrl,
} from "@/lib/utils";
import {
  deriveMemberPda,
  deriveCollateralRecordPda,
  deriveCollateralVaultPda,
  derivePotVaultPda,
} from "@/lib/pdas";
import { USDC_MINT, TOKEN_2022_PROGRAM_ID } from "@/lib/constants";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import { useState } from "react";

// ── Info row ──────────────────────────────────────────────
const InfoRow: FC<{
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
}> = ({ label, value, color = "#A0A0B8", mono = false }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 1rem",
      background: "rgba(255,255,255,0.02)",
      borderRadius: "10px",
    }}
  >
    <span style={{ fontSize: "13px", color: "#6B6B8A" }}>{label}</span>
    <span
      style={{
        fontSize: "13px",
        color,
        fontWeight: "600",
        fontFamily: mono
          ? "'JetBrains Mono', monospace"
          : "'Space Grotesk', sans-serif",
      }}
    >
      {value}
    </span>
  </div>
);

// ── Member row ────────────────────────────────────────────
const MemberRow: FC<{ member: any; index: number }> = ({ member, index }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: "0.875rem 1rem",
      background: "rgba(255,255,255,0.02)",
      borderRadius: "10px",
      flexWrap: "wrap",
    }}
  >
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: member.hasReceivedPot
          ? "rgba(16,185,129,0.15)"
          : "rgba(124,58,237,0.15)",
        border: member.hasReceivedPot
          ? "1px solid rgba(16,185,129,0.25)"
          : "1px solid rgba(124,58,237,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "13px",
        fontWeight: "700",
        color: member.hasReceivedPot ? "#10B981" : "#A78BFA",
        flexShrink: 0,
      }}
    >
      {member.position}
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: "12px",
          color: "#A0A0B8",
          fontFamily: "'JetBrains Mono', monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {truncateAddress(
          member.member?.toBase58() ?? member.address?.toBase58() ?? "—",
          8
        )}
      </div>
      <div style={{ fontSize: "11px", color: "#5C5C7A", marginTop: "2px" }}>
        {`Collateral: ${formatUsdc(member.collateralLocked)} USDC`}
      </div>
    </div>

    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {member.hasReceivedPot && (
        <span
          style={{
            fontSize: "11px",
            color: "#10B981",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.2)",
            padding: "2px 8px",
            borderRadius: "6px",
            fontWeight: "600",
          }}
        >
          {"Pot received"}
        </span>
      )}
      {member.isKicked && (
        <span
          style={{
            fontSize: "11px",
            color: "#EF4444",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            padding: "2px 8px",
            borderRadius: "6px",
            fontWeight: "600",
          }}
        >
          {"Kicked"}
        </span>
      )}
      {!member.hasReceivedPot && !member.isKicked && (
        <span
          style={{
            fontSize: "11px",
            color: "#6B6B8A",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "2px 8px",
            borderRadius: "6px",
          }}
        >
          {"Waiting"}
        </span>
      )}
    </div>
  </div>
);

// ── Join panel ────────────────────────────────────────────
const JoinPanel: FC<{
  circle: any;
  circleAddress: string;
  onSuccess: () => void;
}> = ({ circle, circleAddress, onSuccess }) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nextPosition = (circle.currentMembers ?? 0) + 1;
  const contributionBN = circle.contributionAmount;
  const totalMembers = circle.totalMembers;
  const joinCost = calculateJoinCost(
    nextPosition,
    totalMembers,
    contributionBN
  );
  const collateral = calculateCollateral(
    nextPosition,
    totalMembers,
    contributionBN
  );
  const premium =
    nextPosition > 1 ? calculatePremium(contributionBN) : new BN(0);

  async function handleJoin() {
    if (!publicKey || !program) return;
    setLoading(true);
    setError(null);

    try {
      const circlePda = new PublicKey(circleAddress);
      const [memberPda] = deriveMemberPda(circlePda, publicKey);
      const [colRecPda] = deriveCollateralRecordPda(circlePda, publicKey);
      const [collateralVault] = deriveCollateralVaultPda(circlePda);
      const [potVault] = derivePotVaultPda(circlePda);

      const memberAta = (
        await import("@solana/spl-token")
      ).getAssociatedTokenAddressSync(
        USDC_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        (await import("@solana/spl-token")).ASSOCIATED_TOKEN_PROGRAM_ID
      );

      await program.methods
        .joinCircle()
        .accountsPartial({
          member: publicKey,
          circleAccount: circlePda,
          memberAccount: memberPda,
          collateralRecord: colRecPda,
          memberTokenAccount: memberAta,
          collateralVault,
          potVault,
          usdcMint: USDC_MINT,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      setSuccess(true);
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("already in use")) {
        setError("You have already joined this circle.");
      } else if (msg.includes("insufficient") || msg.includes("0x1")) {
        setError(
          "Insufficient USDC. Use the faucet on the dashboard to get test USDC."
        );
      } else if (msg.includes("CircleNotOpen")) {
        setError("This circle is no longer open for new members.");
      } else {
        setError(msg || "Join failed — please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          padding: "1.5rem",
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{"🎉"}</div>
        <p style={{ color: "#10B981", fontWeight: "600", fontSize: "15px" }}>
          {"Successfully joined!"}
        </p>
        <p style={{ color: "#6B6B8A", fontSize: "13px", marginTop: "0.25rem" }}>
          {"You are position "}
          {nextPosition}
          {" in this circle."}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(124,58,237,0.05)",
        border: "1px solid rgba(124,58,237,0.2)",
        borderRadius: "20px",
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
          background: "linear-gradient(90deg, #7C3AED, transparent)",
        }}
      />

      <h3
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "15px",
          fontWeight: "600",
          color: "#F0F0FF",
          marginBottom: "1.25rem",
        }}
      >
        {"Join as Position "}
        {nextPosition}
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <span style={{ color: "#6B6B8A" }}>{"Collateral to lock"}</span>
          <span style={{ color: "#A78BFA", fontWeight: "600" }}>
            {formatUsdc(collateral)}
            {" USDC"}
          </span>
        </div>
        {nextPosition > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#6B6B8A" }}>{"Premium (10%)"}</span>
            <span style={{ color: "#F59E0B", fontWeight: "600" }}>
              {formatUsdc(premium)}
              {" USDC"}
            </span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <span style={{ color: "#6B6B8A" }}>{"Cycle 1 contribution"}</span>
          <span style={{ color: "#A0A0B8", fontWeight: "600" }}>
            {formatUsdc(circle.contributionAmount)}
            {" USDC"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            padding: "0.75rem 0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            marginTop: "0.25rem",
          }}
        >
          <span style={{ color: "#F0F0FF", fontWeight: "600" }}>
            {"Total required"}
          </span>
          <span
            style={{
              color: "#10B981",
              fontWeight: "700",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {formatUsdc(joinCost)}
            {" USDC"}
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "0.75rem",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px",
            marginBottom: "1rem",
          }}
        >
          <p style={{ fontSize: "13px", color: "#EF4444" }}>{error}</p>
        </div>
      )}

      {!publicKey ? (
        <div
          style={{
            padding: "0.75rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            textAlign: "center",
            fontSize: "13px",
            color: "#6B6B8A",
          }}
        >
          {"Connect your wallet to join"}
        </div>
      ) : (
        <button
          onClick={handleJoin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "12px",
            background: loading
              ? "rgba(124,58,237,0.3)"
              : "linear-gradient(135deg, #7C3AED, #5B21B6)",
            color: "#fff",
            fontWeight: "600",
            fontSize: "15px",
            border: "1px solid rgba(124,58,237,0.5)",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: loading ? "none" : "0 0 30px rgba(124,58,237,0.3)",
          }}
        >
          {loading ? <Spinner size={18} color="#fff" /> : null}
          {loading ? "Joining..." : `Join for ${formatUsdc(joinCost)} USDC`}
        </button>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────
export default function CircleDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { circle, members, loading, error, refetch } = useCircle(address);
  const { publicKey } = useWallet();

  const stateKey = circle ? Object.keys(circle.state)[0] : "";
  const isOpen = stateKey === "open";
  const isReady = stateKey === "ready";
  const isActive = stateKey === "active";
  const isCompleted = stateKey === "completed";
  const isCancelled = stateKey === "cancelled";
  const canJoin = (isOpen || isReady) && circle;

  const alreadyJoined =
    publicKey &&
    members.some(
      (m) => (m.member ?? m.address)?.toBase58() === publicKey.toBase58()
    );

  const fillPct = circle
    ? Math.round((circle.currentMembers / circle.totalMembers) * 100)
    : 0;

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
          {"Loading circle..."}
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
          style={{
            color: "#7C3AED",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          {"← Back to circles"}
        </Link>
      </div>
    );
  }

  return (
    <div className="section" style={{ padding: "2.5rem 1rem" }}>
      {/* Back link */}
      <Link
        href="/app/circles"
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
        {"← Back to circles"}
      </Link>

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
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
              {formatUsdc(circle.contributionAmount)}
              {" USDC · "}
              {formatFrequency(circle.frequency)}
            </h1>
            <StateBadge state={circle.state} />
          </div>
          <span
            style={{
              fontSize: "12px",
              color: "#5C5C7A",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {truncateAddress(address, 8)}
            {" · "}
            <span
              onClick={() =>
                window.open(explorerUrl(address), "_blank", "noreferrer")
              }
              style={{ color: "#7C3AED", cursor: "pointer" }}
            >
              {"View on Explorer"}
            </span>
          </span>
        </div>
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
        {/* Left column */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Circle info */}
          <div
            style={{
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
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
                background: isActive
                  ? "linear-gradient(90deg, #10B981, transparent)"
                  : isReady
                  ? "linear-gradient(90deg, #F59E0B, transparent)"
                  : "linear-gradient(90deg, #7C3AED, transparent)",
              }}
            />

            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "15px",
                fontWeight: "600",
                color: "#F0F0FF",
                marginBottom: "1.25rem",
              }}
            >
              {"Circle Info"}
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <InfoRow
                label="Contribution"
                value={`${formatUsdc(circle.contributionAmount)} USDC`}
                color="#A78BFA"
              />
              <InfoRow
                label="Frequency"
                value={formatFrequency(circle.frequency)}
              />
              <InfoRow
                label="Members"
                value={`${circle.currentMembers} / ${circle.totalMembers}`}
              />
              <InfoRow
                label="Current cycle"
                value={
                  circle.currentCycle > 0
                    ? `${circle.currentCycle} of ${circle.totalMembers}`
                    : "Not started"
                }
              />
              <InfoRow
                label="Status"
                value={stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}
              />
            </div>

            {/* Fill bar */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#5C5C7A" }}>
                  {"Seats filled"}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#A0A0B8",
                    fontWeight: "600",
                  }}
                >
                  {fillPct}
                  {"%"}
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  borderRadius: "3px",
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${fillPct}%`,
                    borderRadius: "3px",
                    background:
                      fillPct === 100
                        ? "linear-gradient(90deg, #10B981, #06B6D4)"
                        : "linear-gradient(90deg, #7C3AED, #A78BFA)",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Members list */}
          <div
            style={{
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "15px",
                fontWeight: "600",
                color: "#F0F0FF",
                marginBottom: "1.25rem",
              }}
            >
              {"Members"}{" "}
              <span
                style={{
                  color: "#5C5C7A",
                  fontWeight: "400",
                  fontSize: "13px",
                }}
              >
                {"("}
                {members.length}
                {" joined)"}
              </span>
            </h2>

            {members.length === 0 ? (
              <p
                style={{
                  color: "#6B6B8A",
                  fontSize: "14px",
                  textAlign: "center",
                  padding: "1.5rem",
                }}
              >
                {"No members yet — be the first to join"}
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {members.map((m: any, i: number) => (
                  <MemberRow key={i} member={m} index={i} />
                ))}

                {/* Empty slots */}
                {Array.from({
                  length: circle.totalMembers - members.length,
                }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.875rem 1rem",
                      background: "rgba(255,255,255,0.01)",
                      borderRadius: "10px",
                      border: "1px dashed rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.03)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        color: "#3A3A5C",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: "700",
                      }}
                    >
                      {members.length + i + 1}
                    </div>
                    <span style={{ fontSize: "13px", color: "#3A3A5C" }}>
                      {"Open seat"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Join panel or status */}
          {canJoin && !alreadyJoined && (
            <JoinPanel
              circle={circle}
              circleAddress={address}
              onSuccess={refetch}
            />
          )}

          {alreadyJoined && (
            <div
              style={{
                padding: "1.25rem",
                background: "rgba(16,185,129,0.05)",
                border: "1px solid rgba(16,185,129,0.15)",
                borderRadius: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                {"✓"}
              </div>
              <p
                style={{
                  color: "#10B981",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {"You are a member"}
              </p>
              <Link
                href={`/app/my-circles/${address}`}
                style={{
                  display: "inline-block",
                  marginTop: "0.75rem",
                  fontSize: "13px",
                  color: "#7C3AED",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                {"Manage this circle →"}
              </Link>
            </div>
          )}

          {isActive && !alreadyJoined && (
            <div
              style={{
                padding: "1.25rem",
                background: "rgba(245,158,11,0.05)",
                border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: "16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#F59E0B",
                  fontWeight: "600",
                  fontSize: "14px",
                  marginBottom: "0.25rem",
                }}
              >
                {"Circle is Active"}
              </p>
              <p style={{ color: "#6B6B8A", fontSize: "13px" }}>
                {
                  "This circle has started and is no longer accepting new members."
                }
              </p>
            </div>
          )}

          {isCompleted && (
            <div
              style={{
                padding: "1.25rem",
                background: "rgba(6,182,212,0.05)",
                border: "1px solid rgba(6,182,212,0.15)",
                borderRadius: "16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#06B6D4",
                  fontWeight: "600",
                  fontSize: "14px",
                  marginBottom: "0.25rem",
                }}
              >
                {"Circle Completed"}
              </p>
              <p style={{ color: "#6B6B8A", fontSize: "13px" }}>
                {"All cycles have been disbursed successfully."}
              </p>
            </div>
          )}

          {isCancelled && (
            <div
              style={{
                padding: "1.25rem",
                background: "rgba(239,68,68,0.05)",
                border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: "16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#EF4444",
                  fontWeight: "600",
                  fontSize: "14px",
                  marginBottom: "0.25rem",
                }}
              >
                {"Circle Cancelled"}
              </p>
              <p style={{ color: "#6B6B8A", fontSize: "13px" }}>
                {"This circle was cancelled and funds have been returned."}
              </p>
            </div>
          )}

          {/* Economics card */}
          <div
            style={{
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "1.25rem",
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
              {"Economics"}
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
                  label: "Pot per cycle",
                  value: `${formatUsdc(
                    circle.contributionAmount.muln(circle.totalMembers)
                  )} USDC`,
                  color: "#10B981",
                },
                {
                  label: "Premium (10%)",
                  value: `${formatUsdc(
                    calculatePremium(circle.contributionAmount)
                  )} USDC`,
                  color: "#F59E0B",
                },
                {
                  label: "Pos 1 collateral",
                  value: `${formatUsdc(
                    calculateCollateral(
                      1,
                      circle.totalMembers,
                      circle.contributionAmount
                    )
                  )} USDC`,
                  color: "#7C3AED",
                },
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
                      color: item.color,
                      fontWeight: "600",
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
