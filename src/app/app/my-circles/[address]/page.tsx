"use client";

import { FC, use, useState } from "react";
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
  explorerUrl,
} from "@/lib/utils";
import {
  deriveMemberPda,
  deriveCollateralRecordPda,
  deriveCollateralVaultPda,
  derivePotVaultPda,
  derivePaymentRecordPda,
  deriveProtocolConfigPda,
} from "@/lib/pdas";
import {
  USDC_MINT,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TREASURY_VAULT,
} from "@/lib/constants";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import BN from "bn.js";

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

// ── Result message ────────────────────────────────────────
const ResultMsg: FC<{ msg: string | null; isError: boolean }> = ({
  msg,
  isError,
}) => {
  if (!msg) return null;
  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        background: isError ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
        border: `1px solid ${
          isError ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"
        }`,
        borderRadius: "10px",
        marginTop: "0.75rem",
      }}
    >
      <p style={{ fontSize: "13px", color: isError ? "#EF4444" : "#10B981" }}>
        {msg}
      </p>
    </div>
  );
};

// ── Action button ─────────────────────────────────────────
const ActionButton: FC<{
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  color?: string;
  sub?: string;
}> = ({ label, onClick, loading, disabled, color = "#7C3AED", sub }) => (
  <div>
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: "100%",
        padding: "13px 20px",
        borderRadius: "12px",
        background:
          loading || disabled
            ? "rgba(255,255,255,0.04)"
            : `linear-gradient(135deg, ${color}, ${color}CC)`,
        color: loading || disabled ? "#5C5C7A" : "#fff",
        fontWeight: "600",
        fontSize: "14px",
        border:
          loading || disabled
            ? "1px solid rgba(255,255,255,0.06)"
            : `1px solid ${color}80`,
        cursor: loading || disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.2s",
        boxShadow: loading || disabled ? "none" : `0 0 20px ${color}30`,
      }}
    >
      {loading ? <Spinner size={16} color="#A0A0B8" /> : null}
      {loading ? "Processing..." : label}
    </button>
    {sub && (
      <p
        style={{
          fontSize: "12px",
          color: "#5C5C7A",
          marginTop: "6px",
          textAlign: "center",
        }}
      >
        {sub}
      </p>
    )}
  </div>
);

// ── Action card ───────────────────────────────────────────
const ActionCard: FC<{
  title: string;
  color: string;
  children: React.ReactNode;
}> = ({ title, color, children }) => (
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
        background: `linear-gradient(90deg, ${color}, transparent)`,
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
      {title}
    </h3>
    {children}
  </div>
);

// ── Start circle ──────────────────────────────────────────
const StartCircleAction: FC<{
  circle: any;
  circleAddress: string;
  onSuccess: () => void;
}> = ({ circleAddress, onSuccess }) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);

  async function handleStart() {
    if (!publicKey || !program) return;
    setLoading(true);
    setResult(null);
    try {
      const circlePda = new PublicKey(circleAddress);
      const [paymentRecordPda] = derivePaymentRecordPda(circlePda, 1);
      const [configPda] = deriveProtocolConfigPda();
      await program.methods
        .startCircle()
        .accountsPartial({
          caller: publicKey,
          protocolConfig: configPda,
          circleAccount: circlePda,
          paymentRecord: paymentRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setResult({
        msg: "Circle started! Cycle 1 is now active.",
        isError: false,
      });
      onSuccess();
    } catch (err: any) {
      setResult({
        msg: err.message || "Failed to start circle",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionCard title="Start Circle" color="#10B981">
      <p
        style={{
          fontSize: "13px",
          color: "#6B6B8A",
          marginBottom: "1rem",
          lineHeight: "1.6",
        }}
      >
        {
          "All seats are filled. Start the circle to begin cycle 1. Any member can trigger this."
        }
      </p>
      <ActionButton
        label="Start Circle"
        onClick={handleStart}
        loading={loading}
        color="#10B981"
      />
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </ActionCard>
  );
};

// ── Init payment record ───────────────────────────────────
const InitPaymentRecordAction: FC<{
  circle: any;
  circleAddress: string;
  onSuccess: () => void;
}> = ({ circle, circleAddress, onSuccess }) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);

  async function handleInit() {
    if (!publicKey || !program) return;
    setLoading(true);
    setResult(null);
    try {
      const circlePda = new PublicKey(circleAddress);
      const [paymentRecordPda] = derivePaymentRecordPda(
        circlePda,
        circle.currentCycle
      );
      const [configPda] = deriveProtocolConfigPda();
      await program.methods
        .initPaymentRecord(circle.currentCycle)
        .accountsPartial({
          caller: publicKey,
          protocolConfig: configPda,
          circleAccount: circlePda,
          paymentRecord: paymentRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setResult({
        msg: `Payment record for cycle ${circle.currentCycle} initialised`,
        isError: false,
      });
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("already in use")) {
        setResult({
          msg: "Payment record already exists for this cycle.",
          isError: false,
        });
      } else {
        setResult({
          msg: msg || "Failed to initialise payment record",
          isError: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionCard title="Initialise Payment Record" color="#F59E0B">
      <p
        style={{
          fontSize: "13px",
          color: "#6B6B8A",
          marginBottom: "1rem",
          lineHeight: "1.6",
        }}
      >
        {"Before members can pay cycle "}
        {circle.currentCycle}
        {", a payment record must be created onchain. Any member can do this."}
      </p>
      <ActionButton
        label={`Init Cycle ${circle.currentCycle} Record`}
        onClick={handleInit}
        loading={loading}
        color="#F59E0B"
      />
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </ActionCard>
  );
};

// ── Pay contribution ──────────────────────────────────────
const PayContributionAction: FC<{
  circle: any;
  myMember: any;
  circleAddress: string;
  onSuccess: () => void;
}> = ({ circle, myMember, circleAddress, onSuccess }) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);

  async function handlePay() {
    if (!publicKey || !program || !myMember) return;
    setLoading(true);
    setResult(null);
    try {
      const circlePda = new PublicKey(circleAddress);
      const [memberPda] = deriveMemberPda(circlePda, publicKey);
      const [paymentRecordPda] = derivePaymentRecordPda(
        circlePda,
        circle.currentCycle
      );
      const [potVaultPda] = derivePotVaultPda(circlePda);
      const [configPda] = deriveProtocolConfigPda();
      const memberAta = getAssociatedTokenAddressSync(
        USDC_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await program.methods
        .payContribution()
        .accountsPartial({
          member: publicKey,
          protocolConfig: configPda,
          circleAccount: circlePda,
          memberAccount: memberPda,
          paymentRecord: paymentRecordPda,
          memberTokenAccount: memberAta,
          potVault: potVaultPda,
          usdcMint: USDC_MINT,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      setResult({
        msg: `Contribution paid for cycle ${circle.currentCycle}`,
        isError: false,
      });
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("AlreadyPaid") || msg.includes("already in use")) {
        setResult({
          msg: "You have already paid for this cycle.",
          isError: true,
        });
      } else if (msg.includes("insufficient") || msg.includes("0x1")) {
        setResult({
          msg: "Insufficient USDC. Get more from the dashboard faucet.",
          isError: true,
        });
      } else {
        setResult({ msg: msg || "Payment failed", isError: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionCard title="Pay Contribution" color="#7C3AED">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <InfoRow
          label="Amount due"
          value={`${formatUsdc(circle.contributionAmount)} USDC`}
          color="#A78BFA"
        />
        <InfoRow
          label="Current cycle"
          value={`${circle.currentCycle} of ${circle.totalMembers}`}
        />
      </div>
      <ActionButton
        label={`Pay ${formatUsdc(circle.contributionAmount)} USDC`}
        onClick={handlePay}
        loading={loading}
        color="#7C3AED"
      />
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </ActionCard>
  );
};

// ── Disburse pot ──────────────────────────────────────────
const DisbursePotAction: FC<{
  circle: any;
  circleAddress: string;
  members: any[];
  onSuccess: () => void;
}> = ({ circle, circleAddress, members, onSuccess }) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);

  const recipient = members.find((m) => m.position === circle.currentCycle);

  async function handleDisburse() {
    if (!publicKey || !program || !recipient) return;
    setLoading(true);
    setResult(null);
    try {
      const circlePda = new PublicKey(circleAddress);
      const [paymentRecordPda] = derivePaymentRecordPda(
        circlePda,
        circle.currentCycle
      );
      const [potVaultPda] = derivePotVaultPda(circlePda);
      const [configPda] = deriveProtocolConfigPda();
      const recipientPubkey = recipient.member ?? recipient.address;
      const [recipientMemberPda] = deriveMemberPda(circlePda, recipientPubkey);
      const recipientAta = getAssociatedTokenAddressSync(
        USDC_MINT,
        recipientPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await program.methods
        .disbursePot()
        .accountsPartial({
          caller: publicKey,
          protocolConfig: configPda,
          circleAccount: circlePda,
          paymentRecord: paymentRecordPda,
          recipientMemberAccount: recipientMemberPda,
          recipient: recipientPubkey,
          recipientTokenAccount: recipientAta,
          potVault: potVaultPda,
          treasuryVault: TREASURY_VAULT,
          usdcMint: USDC_MINT,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();
      setResult({
        msg: `Pot disbursed to position ${circle.currentCycle}`,
        isError: false,
      });
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("NotAllPaid")) {
        setResult({ msg: "Not all members have paid yet.", isError: true });
      } else {
        setResult({ msg: msg || "Disbursement failed", isError: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionCard title="Disburse Pot" color="#06B6D4">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <InfoRow
          label="Current cycle"
          value={`${circle.currentCycle} of ${circle.totalMembers}`}
        />
        <InfoRow
          label="Recipient"
          value={
            recipient
              ? `Position ${recipient.position} — ${truncateAddress(
                  (recipient.member ?? recipient.address)?.toBase58() ?? "—",
                  6
                )}`
              : "Unknown"
          }
          color="#06B6D4"
        />
        <InfoRow
          label="Pot amount"
          value={`~${formatUsdc(
            circle.contributionAmount.muln(circle.totalMembers)
          )} USDC`}
          color="#10B981"
        />
      </div>
      <p
        style={{
          fontSize: "12px",
          color: "#5C5C7A",
          marginBottom: "1rem",
          lineHeight: "1.5",
        }}
      >
        {
          "Permissionless — any wallet can trigger disbursement once all members have paid."
        }
      </p>
      <ActionButton
        label="Disburse Pot"
        onClick={handleDisburse}
        loading={loading}
        disabled={!recipient}
        color="#06B6D4"
      />
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </ActionCard>
  );
};

// ── Process default ───────────────────────────────────────
const ProcessDefaultAction: FC<{
  circle: any;
  circleAddress: string;
  members: any[];
  onSuccess: () => void;
}> = ({ circle, circleAddress, members, onSuccess }) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);
  const [selectedMember, setSelectedMember] = useState("");

  const eligibleMembers = members.filter(
    (m) => !m.isKicked && !m.hasReceivedPot
  );

  async function handleProcessDefault() {
    if (!publicKey || !program || !selectedMember) return;
    setLoading(true);
    setResult(null);
    try {
      const circlePda = new PublicKey(circleAddress);
      const defaulterPubkey = new PublicKey(selectedMember);
      const [memberPda] = deriveMemberPda(circlePda, defaulterPubkey);
      const [colRecPda] = deriveCollateralRecordPda(circlePda, defaulterPubkey);
      const [collateralVaultPda] = deriveCollateralVaultPda(circlePda);
      const [potVaultPda] = derivePotVaultPda(circlePda);
      const [paymentRecordPda] = derivePaymentRecordPda(
        circlePda,
        circle.currentCycle
      );
      const [configPda] = deriveProtocolConfigPda();
      await program.methods
        .processDefault()
        .accountsPartial({
          caller: publicKey,
          protocolConfig: configPda,
          circleAccount: circlePda,
          defaulterMemberAccount: memberPda,
          defaulterCollateralRecord: colRecPda,
          collateralVault: collateralVaultPda,
          paymentRecord: paymentRecordPda,
          potVault: potVaultPda,
          defaulter: defaulterPubkey,
          usdcMint: USDC_MINT,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      setResult({
        msg: "Default processed. Member kicked and collateral slashed.",
        isError: false,
      });
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("DeadlineNotPassed")) {
        setResult({ msg: "Cycle deadline has not passed yet.", isError: true });
      } else if (msg.includes("MemberAlreadyPaid")) {
        setResult({
          msg: "This member has already paid for the current cycle.",
          isError: true,
        });
      } else if (msg.includes("MemberAlreadyKicked")) {
        setResult({
          msg: "This member has already been kicked.",
          isError: true,
        });
      } else {
        setResult({ msg: msg || "Failed to process default", isError: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionCard title="Process Default" color="#EF4444">
      <p
        style={{
          fontSize: "13px",
          color: "#6B6B8A",
          marginBottom: "1rem",
          lineHeight: "1.6",
        }}
      >
        {
          "If a member has not paid after the cycle deadline, any wallet can process their default. Their collateral will be slashed and they will be kicked."
        }
      </p>
      {eligibleMembers.length === 0 ? (
        <div
          style={{
            padding: "0.75rem",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "13px", color: "#5C5C7A" }}>
            {"No eligible members to default"}
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              fontSize: "12px",
              color: "#6B6B8A",
              display: "block",
              marginBottom: "6px",
            }}
          >
            {"Select defaulting member"}
          </label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              color: selectedMember ? "#F0F0FF" : "#5C5C7A",
              fontSize: "13px",
              outline: "none",
              fontFamily: "'JetBrains Mono', monospace",
              cursor: "pointer",
            }}
          >
            <option value="">{"Select member..."}</option>
            {eligibleMembers.map((m: any) => {
              const addr = (m.member ?? m.address)?.toBase58() ?? "";
              return (
                <option key={addr} value={addr}>
                  {"Position "}
                  {m.position}
                  {" — "}
                  {truncateAddress(addr, 8)}
                </option>
              );
            })}
          </select>
        </div>
      )}
      <ActionButton
        label="Process Default"
        onClick={handleProcessDefault}
        loading={loading}
        disabled={!selectedMember || eligibleMembers.length === 0}
        color="#EF4444"
        sub="Only works after the cycle deadline has passed"
      />
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </ActionCard>
  );
};

// ── Cancel circle ─────────────────────────────────────────
const CancelCircleAction: FC<{
  circle: any;
  circleAddress: string;
  myMember: any;
  onSuccess: () => void;
}> = ({ circleAddress, myMember, onSuccess }) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function handleCancel() {
    if (!publicKey || !program || !myMember) return;
    setLoading(true);
    setResult(null);
    try {
      const circlePda = new PublicKey(circleAddress);
      const [memberPda] = deriveMemberPda(circlePda, publicKey);
      const [colRecPda] = deriveCollateralRecordPda(circlePda, publicKey);
      const [collVaultPda] = deriveCollateralVaultPda(circlePda);
      const [potVaultPda] = derivePotVaultPda(circlePda);
      const [configPda] = deriveProtocolConfigPda();
      const callerAta = getAssociatedTokenAddressSync(
        USDC_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await program.methods
        .cancelCircle()
        .accountsPartial({
          caller: publicKey,
          protocolConfig: configPda,
          circleAccount: circlePda,
          callerMemberAccount: memberPda,
          callerCollateralRecord: colRecPda,
          collateralVault: collVaultPda,
          potVault: potVaultPda,
          callerTokenAccount: callerAta,
          usdcMint: USDC_MINT,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setResult({
        msg: "Circle cancelled. Your collateral and contributions have been returned.",
        isError: false,
      });
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("CancelDeadlineNotPassed")) {
        setResult({
          msg: "Cancel deadline has not passed yet.",
          isError: true,
        });
      } else if (msg.includes("CircleNotOpen")) {
        setResult({
          msg: "Circle can only be cancelled while it is open.",
          isError: true,
        });
      } else {
        setResult({ msg: msg || "Cancel failed", isError: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionCard title="Cancel Circle" color="#EF4444">
      <p
        style={{
          fontSize: "13px",
          color: "#6B6B8A",
          marginBottom: "1rem",
          lineHeight: "1.6",
        }}
      >
        {
          "You are the only member. You can cancel this circle and get your collateral and contribution back."
        }
      </p>
      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          style={{
            width: "100%",
            padding: "13px 20px",
            borderRadius: "12px",
            background: "rgba(239,68,68,0.08)",
            color: "#EF4444",
            fontWeight: "600",
            fontSize: "14px",
            border: "1px solid rgba(239,68,68,0.2)",
            cursor: "pointer",
          }}
        >
          {"Cancel This Circle"}
        </button>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div
            style={{
              padding: "0.75rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "#EF4444",
                fontWeight: "600",
                marginBottom: "4px",
              }}
            >
              {"Are you sure?"}
            </p>
            <p style={{ fontSize: "12px", color: "#6B6B8A" }}>
              {
                "This action cannot be undone. The circle will be permanently cancelled."
              }
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setConfirmed(false)}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                color: "#6B6B8A",
                fontWeight: "500",
                fontSize: "13px",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
            >
              {"Keep Circle"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                background: loading
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(239,68,68,0.8)",
                color: "#fff",
                fontWeight: "600",
                fontSize: "13px",
                border: "1px solid rgba(239,68,68,0.4)",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {loading ? <Spinner size={14} color="#fff" /> : null}
              {loading ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </div>
        </div>
      )}
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </ActionCard>
  );
};

// ── Claim collateral ──────────────────────────────────────
const ClaimCollateralAction: FC<{
  circle: any;
  myMember: any;
  circleAddress: string;
  onSuccess: () => void;
}> = ({ myMember, circleAddress, onSuccess }) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);

  const collateralLocked = myMember?.collateralLocked ?? new BN(0);

  async function handleClaim() {
    if (!publicKey || !program || !myMember) return;
    setLoading(true);
    setResult(null);
    try {
      const circlePda = new PublicKey(circleAddress);
      const [memberPda] = deriveMemberPda(circlePda, publicKey);
      const [colRecPda] = deriveCollateralRecordPda(circlePda, publicKey);
      const [collateralVault] = deriveCollateralVaultPda(circlePda);
      const [configPda] = deriveProtocolConfigPda();
      const memberAta = getAssociatedTokenAddressSync(
        USDC_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await program.methods
        .claimCollateral()
        .accountsPartial({
          member: publicKey,
          protocolConfig: configPda,
          circleAccount: circlePda,
          memberAccount: memberPda,
          collateralRecord: colRecPda,
          collateralVault,
          memberTokenAccount: memberAta,
          usdcMint: USDC_MINT,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setResult({
        msg: `${formatUsdc(
          collateralLocked
        )} USDC collateral claimed successfully`,
        isError: false,
      });
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("AlreadyClaimed")) {
        setResult({ msg: "Collateral already claimed.", isError: true });
      } else if (msg.includes("CircleNotComplete")) {
        setResult({
          msg: "Circle must complete before collateral can be claimed.",
          isError: true,
        });
      } else {
        setResult({ msg: msg || "Claim failed", isError: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionCard title="Claim Collateral" color="#10B981">
      <div style={{ marginBottom: "1rem" }}>
        <InfoRow
          label="Collateral locked"
          value={`${formatUsdc(collateralLocked)} USDC`}
          color="#10B981"
        />
      </div>
      <p
        style={{
          fontSize: "13px",
          color: "#6B6B8A",
          marginBottom: "1rem",
          lineHeight: "1.6",
        }}
      >
        {
          "The circle has completed. Claim your locked collateral back to your wallet."
        }
      </p>
      <ActionButton
        label={`Claim ${formatUsdc(collateralLocked)} USDC`}
        onClick={handleClaim}
        loading={loading}
        color="#10B981"
      />
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </ActionCard>
  );
};

// ── Page ──────────────────────────────────────────────────
export default function MyCircleDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { publicKey } = useWallet();
  const { circle, members, loading, error, refetch } = useCircle(address);

  const stateKey = circle ? Object.keys(circle.state)[0] : "";
  const isOpen = stateKey === "open";
  const isReady = stateKey === "ready";
  const isActive = stateKey === "active";
  const isCompleted = stateKey === "completed";

  const myMember = publicKey
    ? members.find(
        (m) => (m.member ?? m.address)?.toBase58() === publicKey.toBase58()
      )
    : null;

  const canStart = isReady;
  const canInitPayRecord = isActive && circle?.currentCycle > 1;
  const canPay = isActive && !!myMember;
  const canDisburse = isActive;
  const canCancel = isOpen && !!myMember && (circle?.currentMembers ?? 0) === 1;
  const canClaimCollateral = isCompleted && !!myMember;

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
          href="/app/my-circles"
          style={{ color: "#7C3AED", textDecoration: "none", fontSize: "14px" }}
        >
          {"← Back to my circles"}
        </Link>
      </div>
    );
  }

  return (
    <div className="section" style={{ padding: "2.5rem 1rem" }}>
      <Link
        href="/app/my-circles"
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
        {"← Back to my circles"}
      </Link>

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
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              style={{
                fontSize: "12px",
                color: "#5C5C7A",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {truncateAddress(address, 8)}
            </span>
            {myMember && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#A78BFA",
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontWeight: "600",
                }}
              >
                {"Position "}
                {myMember.position}
              </span>
            )}
          </div>
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
            }}
          >
            {"↻ Refresh"}
          </button>
          <span
            onClick={() =>
              window.open(explorerUrl(address), "_blank", "noreferrer")
            }
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.15)",
              color: "#A78BFA",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {"Explorer"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
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
                  : isCompleted
                  ? "linear-gradient(90deg, #06B6D4, transparent)"
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
              {"Circle Overview"}
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
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
                  isActive
                    ? `${circle.currentCycle} of ${circle.totalMembers}`
                    : "—"
                }
              />
              <InfoRow
                label="My position"
                value={myMember ? `#${myMember.position}` : "—"}
                color="#A78BFA"
              />
              <InfoRow
                label="My collateral"
                value={
                  myMember
                    ? `${formatUsdc(myMember.collateralLocked)} USDC`
                    : "—"
                }
                color="#F59E0B"
              />
              <InfoRow
                label="Pot received"
                value={myMember?.hasReceivedPot ? "Yes ✓" : "Not yet"}
                color={myMember?.hasReceivedPot ? "#10B981" : "#6B6B8A"}
              />
            </div>
          </div>

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
              {"Members"}
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {members.map((m: any, i: number) => {
                const isMe =
                  publicKey &&
                  (m.member ?? m.address)?.toBase58() === publicKey.toBase58();
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.875rem 1rem",
                      background: isMe
                        ? "rgba(124,58,237,0.06)"
                        : "rgba(255,255,255,0.02)",
                      borderRadius: "10px",
                      border: isMe
                        ? "1px solid rgba(124,58,237,0.15)"
                        : "1px solid transparent",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        background: m.hasReceivedPot
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(124,58,237,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: m.hasReceivedPot ? "#10B981" : "#A78BFA",
                        flexShrink: 0,
                      }}
                    >
                      {m.position}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: isMe ? "#A78BFA" : "#A0A0B8",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: isMe ? "600" : "400",
                        }}
                      >
                        {truncateAddress(
                          (m.member ?? m.address)?.toBase58() ?? "—",
                          8
                        )}
                        {isMe ? " (you)" : ""}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.4rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {m.hasReceivedPot ? (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#10B981",
                            background: "rgba(16,185,129,0.1)",
                            padding: "2px 7px",
                            borderRadius: "5px",
                            fontWeight: "600",
                          }}
                        >
                          {"Pot received"}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#5C5C7A",
                            background: "rgba(255,255,255,0.03)",
                            padding: "2px 7px",
                            borderRadius: "5px",
                          }}
                        >
                          {"Waiting"}
                        </span>
                      )}
                      {m.isKicked && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#EF4444",
                            background: "rgba(239,68,68,0.1)",
                            padding: "2px 7px",
                            borderRadius: "5px",
                            fontWeight: "600",
                          }}
                        >
                          {"Kicked"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isOpen && circle.currentMembers > 1 && (
            <div
              style={{
                padding: "1.25rem",
                background: "rgba(124,58,237,0.05)",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: "16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#A78BFA",
                  fontWeight: "600",
                  fontSize: "14px",
                  marginBottom: "0.25rem",
                }}
              >
                {"Waiting for members"}
              </p>
              <p style={{ color: "#6B6B8A", fontSize: "13px" }}>
                {circle.totalMembers - circle.currentMembers}
                {" more seat(s) to fill"}
              </p>
            </div>
          )}

          {canCancel && (
            <CancelCircleAction
              circle={circle}
              circleAddress={address}
              myMember={myMember}
              onSuccess={refetch}
            />
          )}
          {canStart && (
            <StartCircleAction
              circle={circle}
              circleAddress={address}
              onSuccess={refetch}
            />
          )}
          {canInitPayRecord && (
            <InitPaymentRecordAction
              circle={circle}
              circleAddress={address}
              onSuccess={refetch}
            />
          )}
          {canPay && (
            <PayContributionAction
              circle={circle}
              myMember={myMember}
              circleAddress={address}
              onSuccess={refetch}
            />
          )}
          {canDisburse && (
            <DisbursePotAction
              circle={circle}
              circleAddress={address}
              members={members}
              onSuccess={refetch}
            />
          )}
          {canDisburse && (
            <ProcessDefaultAction
              circle={circle}
              circleAddress={address}
              members={members}
              onSuccess={refetch}
            />
          )}
          {canClaimCollateral && (
            <ClaimCollateralAction
              circle={circle}
              myMember={myMember}
              circleAddress={address}
              onSuccess={refetch}
            />
          )}

          {isCompleted && !canClaimCollateral && (
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
                }}
              >
                {"Circle Completed"}
              </p>
              <p
                style={{
                  color: "#6B6B8A",
                  fontSize: "13px",
                  marginTop: "0.25rem",
                }}
              >
                {"All cycles disbursed successfully."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
