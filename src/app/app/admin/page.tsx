"use client";

import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/useProgram";
import { useProtocolConfig } from "@/hooks/useProtocolConfig";
import { Spinner } from "@/components/ui/Spinner";
import { explorerUrl, truncateAddress, formatUsdc } from "@/lib/utils";
import {
  deriveProtocolConfigPda,
  deriveTreasuryVaultAddress,
} from "@/lib/pdas";
import {
  USDC_MINT,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@/lib/constants";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount } from "@solana/spl-token";
import { useConnection } from "@solana/wallet-adapter-react";
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

// ── Action card ───────────────────────────────────────────
const AdminCard: FC<{
  title: string;
  subtitle?: string;
  color: string;
  children: React.ReactNode;
}> = ({ title, subtitle, color, children }) => (
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
        marginBottom: subtitle ? "0.25rem" : "1.25rem",
      }}
    >
      {title}
    </h3>
    {subtitle && (
      <p
        style={{ fontSize: "13px", color: "#6B6B8A", marginBottom: "1.25rem" }}
      >
        {subtitle}
      </p>
    )}
    {children}
  </div>
);

// ── Pause / Unpause ───────────────────────────────────────
const PauseAction: FC<{ isPaused: boolean; onSuccess: () => void }> = ({
  isPaused,
  onSuccess,
}) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);

  async function handleToggle() {
    if (!publicKey || !program) return;
    setLoading(true);
    setResult(null);
    try {
      const [configPda] = deriveProtocolConfigPda();
      if (isPaused) {
        await program.methods
          .unpauseProtocol()
          .accountsPartial({
            admin: publicKey,
            protocolConfig: configPda,
          })
          .rpc();
        setResult({ msg: "Protocol unpaused successfully.", isError: false });
      } else {
        await program.methods
          .pauseProtocol()
          .accountsPartial({
            admin: publicKey,
            protocolConfig: configPda,
          })
          .rpc();
        setResult({ msg: "Protocol paused successfully.", isError: false });
      }
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("Unauthorized")) {
        setResult({
          msg: "Unauthorized. Only the protocol admin can do this.",
          isError: true,
        });
      } else {
        setResult({ msg: msg || "Transaction failed", isError: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminCard
      title={isPaused ? "Unpause Protocol" : "Pause Protocol"}
      subtitle={
        isPaused
          ? "Protocol is currently paused. No new circles or contributions are allowed."
          : "Pausing halts all circle creation and contributions across the protocol."
      }
      color={isPaused ? "#10B981" : "#EF4444"}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            padding: "6px 14px",
            borderRadius: "9999px",
            background: isPaused
              ? "rgba(239,68,68,0.1)"
              : "rgba(16,185,129,0.1)",
            border: isPaused
              ? "1px solid rgba(239,68,68,0.3)"
              : "1px solid rgba(16,185,129,0.3)",
            fontSize: "13px",
            fontWeight: "600",
            color: isPaused ? "#EF4444" : "#10B981",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isPaused ? "#EF4444" : "#10B981",
              display: "inline-block",
            }}
          />
          {isPaused ? "Paused" : "Active"}
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: "12px",
          background: loading
            ? "rgba(255,255,255,0.04)"
            : isPaused
            ? "linear-gradient(135deg, #10B981, #059669)"
            : "linear-gradient(135deg, #EF4444, #DC2626)",
          color: loading ? "#5C5C7A" : "#fff",
          fontWeight: "600",
          fontSize: "14px",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {loading ? <Spinner size={16} color="#A0A0B8" /> : null}
        {loading
          ? "Processing..."
          : isPaused
          ? "Unpause Protocol"
          : "Pause Protocol"}
      </button>
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </AdminCard>
  );
};

// ── Update fee ────────────────────────────────────────────
const UpdateFeeAction: FC<{ currentFee: number; onSuccess: () => void }> = ({
  currentFee,
  onSuccess,
}) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);
  const [newFee, setNewFee] = useState(currentFee.toString());

  const feeBps = parseInt(newFee) || 0;
  const feePct = (feeBps / 100).toFixed(2);
  const isValid = feeBps >= 0 && feeBps <= 1000;

  async function handleUpdate() {
    if (!publicKey || !program || !isValid) return;
    setLoading(true);
    setResult(null);
    try {
      const [configPda] = deriveProtocolConfigPda();
      await program.methods
        .updateConfig(feeBps)
        .accountsPartial({
          admin: publicKey,
          protocolConfig: configPda,
        })
        .rpc();
      setResult({
        msg: `Fee updated to ${feeBps} bps (${feePct}%)`,
        isError: false,
      });
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("Unauthorized")) {
        setResult({
          msg: "Unauthorized. Only the protocol admin can do this.",
          isError: true,
        });
      } else if (msg.includes("FeeTooHigh")) {
        setResult({ msg: "Fee cannot exceed 1000 bps (10%).", isError: true });
      } else {
        setResult({ msg: msg || "Update failed", isError: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminCard
      title="Update Protocol Fee"
      subtitle="Fee is taken from each pot disbursement and sent to the treasury vault."
      color="#F59E0B"
    >
      <div style={{ marginBottom: "1.25rem" }}>
        <InfoRow
          label="Current fee"
          value={`${currentFee} bps (${(currentFee / 100).toFixed(2)}%)`}
          color="#F59E0B"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            fontSize: "12px",
            color: "#6B6B8A",
            display: "block",
            marginBottom: "6px",
          }}
        >
          {"New fee in basis points (0–1000)"}
        </label>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="number"
            min={0}
            max={1000}
            value={newFee}
            onChange={(e) => setNewFee(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${
                isValid ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.3)"
              }`,
              borderRadius: "10px",
              color: "#F0F0FF",
              fontSize: "14px",
              outline: "none",
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <span
            style={{
              fontSize: "13px",
              color: "#F59E0B",
              fontWeight: "600",
              minWidth: "60px",
            }}
          >
            {feePct}
            {"%"}
          </span>
        </div>
        {!isValid && (
          <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "6px" }}>
            {"Fee must be between 0 and 1000 bps"}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        {[0, 25, 50, 100, 200].map((preset) => (
          <button
            key={preset}
            onClick={() => setNewFee(preset.toString())}
            style={{
              padding: "5px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              background:
                parseInt(newFee) === preset
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(255,255,255,0.03)",
              border:
                parseInt(newFee) === preset
                  ? "1px solid rgba(245,158,11,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
              color: parseInt(newFee) === preset ? "#F59E0B" : "#6B6B8A",
              cursor: "pointer",
            }}
          >
            {preset === 0 ? "0%" : `${(preset / 100).toFixed(2)}%`}
          </button>
        ))}
      </div>

      <button
        onClick={handleUpdate}
        disabled={loading || !isValid || feeBps === currentFee}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: "12px",
          background:
            loading || !isValid || feeBps === currentFee
              ? "rgba(255,255,255,0.04)"
              : "linear-gradient(135deg, #F59E0B, #D97706)",
          color:
            loading || !isValid || feeBps === currentFee ? "#5C5C7A" : "#fff",
          fontWeight: "600",
          fontSize: "14px",
          border: "none",
          cursor:
            loading || !isValid || feeBps === currentFee
              ? "not-allowed"
              : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginTop: "0.75rem",
        }}
      >
        {loading ? <Spinner size={16} color="#A0A0B8" /> : null}
        {loading
          ? "Updating..."
          : feeBps === currentFee
          ? "No change"
          : `Update to ${feePct}%`}
      </button>
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </AdminCard>
  );
};

// ── Withdraw treasury ─────────────────────────────────────
const WithdrawTreasuryAction: FC<{ onSuccess: () => void }> = ({
  onSuccess,
}) => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);
  const [treasuryBalance, setTreasuryBalance] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const treasuryVault = deriveTreasuryVaultAddress();

  useEffect(() => {
    async function fetchBalance() {
      try {
        setBalanceLoading(true);
        const acc = await getAccount(
          connection,
          treasuryVault,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        setTreasuryBalance(acc.amount);
      } catch {
        setTreasuryBalance(BigInt(0));
      } finally {
        setBalanceLoading(false);
      }
    }
    fetchBalance();
  }, [connection]);

  async function handleWithdraw() {
    if (
      !publicKey ||
      !program ||
      !treasuryBalance ||
      treasuryBalance === BigInt(0)
    )
      return;
    setLoading(true);
    setResult(null);
    try {
      const [configPda] = deriveProtocolConfigPda();

      const adminAta = getAssociatedTokenAddressSync(
        USDC_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      await program.methods
        .withdrawTreasury(new BN(treasuryBalance.toString()))
        .accountsPartial({
          admin: publicKey,
          protocolConfig: configPda,
          treasuryVault,
          destination: adminAta,
          usdcMint: USDC_MINT,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      setResult({
        msg: `${formatUsdc(
          new BN(treasuryBalance.toString())
        )} USDC withdrawn to admin wallet.`,
        isError: false,
      });
      setTreasuryBalance(BigInt(0));
      onSuccess();
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("Unauthorized")) {
        setResult({
          msg: "Unauthorized. Only the protocol admin can withdraw.",
          isError: true,
        });
      } else {
        setResult({ msg: msg || "Withdrawal failed", isError: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminCard
      title="Withdraw Treasury Fees"
      subtitle="Accumulated protocol fees collected from pot disbursements."
      color="#06B6D4"
    >
      <div style={{ marginBottom: "1.25rem" }}>
        {balanceLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <Spinner size={20} color="#06B6D4" />
          </div>
        ) : (
          <div
            style={{
              padding: "1.25rem",
              background: "rgba(6,182,212,0.06)",
              border: "1px solid rgba(6,182,212,0.15)",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#5C5C7A",
                marginBottom: "4px",
                letterSpacing: "0.05em",
              }}
            >
              {"TREASURY BALANCE"}
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#06B6D4",
              }}
            >
              {treasuryBalance !== null
                ? formatUsdc(new BN(treasuryBalance.toString()))
                : "0.00"}
              <span
                style={{
                  fontSize: "14px",
                  color: "#5C5C7A",
                  fontWeight: "400",
                  marginLeft: "6px",
                }}
              >
                {"USDC"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <InfoRow
          label="Treasury vault"
          value={truncateAddress(treasuryVault.toBase58(), 6)}
          mono
        />
      </div>

      <button
        onClick={handleWithdraw}
        disabled={loading || !treasuryBalance || treasuryBalance === BigInt(0)}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: "12px",
          background:
            loading || !treasuryBalance || treasuryBalance === BigInt(0)
              ? "rgba(255,255,255,0.04)"
              : "linear-gradient(135deg, #06B6D4, #0891B2)",
          color:
            loading || !treasuryBalance || treasuryBalance === BigInt(0)
              ? "#5C5C7A"
              : "#fff",
          fontWeight: "600",
          fontSize: "14px",
          border: "none",
          cursor:
            loading || !treasuryBalance || treasuryBalance === BigInt(0)
              ? "not-allowed"
              : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {loading ? <Spinner size={16} color="#A0A0B8" /> : null}
        {loading
          ? "Withdrawing..."
          : treasuryBalance === BigInt(0)
          ? "Treasury is empty"
          : `Withdraw ${
              treasuryBalance !== null
                ? formatUsdc(new BN(treasuryBalance.toString()))
                : "0"
            } USDC`}
      </button>
      <ResultMsg msg={result?.msg ?? null} isError={result?.isError ?? false} />
    </AdminCard>
  );
};

// ── Page ──────────────────────────────────────────────────
export default function AdminPage() {
  const { publicKey } = useWallet();
  const { config, loading, error } = useProtocolConfig();
  const { program } = useProgram();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  const isAdmin =
    publicKey && config
      ? config.admin?.toBase58() === publicKey.toBase58()
      : false;

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
          {"Loading protocol config..."}
        </p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div
        className="section"
        style={{ padding: "2.5rem 1rem", textAlign: "center" }}
      >
        <p style={{ color: "#EF4444" }}>{"Failed to load protocol config"}</p>
      </div>
    );
  }

  return (
    <div
      className="section"
      style={{ padding: "2.5rem 1rem", maxWidth: "860px", margin: "0 auto" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
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
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: "700",
              color: "#F0F0FF",
              letterSpacing: "-0.02em",
            }}
          >
            {"Admin Panel"}
          </h1>
          {isAdmin ? (
            <span
              style={{
                fontSize: "11px",
                color: "#10B981",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                padding: "3px 10px",
                borderRadius: "6px",
                fontWeight: "600",
              }}
            >
              {"Admin"}
            </span>
          ) : (
            <span
              style={{
                fontSize: "11px",
                color: "#EF4444",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                padding: "3px 10px",
                borderRadius: "6px",
                fontWeight: "600",
              }}
            >
              {"Read Only"}
            </span>
          )}
        </div>
        <p style={{ color: "#6B6B8A", fontSize: "14px" }}>
          {"Protocol configuration and admin operations"}
        </p>
      </div>

      {!isAdmin && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: "12px",
            marginBottom: "2rem",
          }}
        >
          <p style={{ fontSize: "13px", color: "#F59E0B", lineHeight: "1.6" }}>
            {
              "Your connected wallet is not the protocol admin. You can view the config but cannot execute admin instructions."
            }
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Protocol config overview */}
        <AdminCard title="Protocol Config" color="#7C3AED">
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <InfoRow
              label="Admin"
              value={truncateAddress(config.admin?.toBase58() ?? "—", 6)}
              mono
            />
            <InfoRow
              label="Fee"
              value={`${config.protocolFeeBps} bps (${(
                config.protocolFeeBps / 100
              ).toFixed(2)}%)`}
              color="#F59E0B"
            />
            <InfoRow
              label="Status"
              value={config.isPaused ? "Paused" : "Active"}
              color={config.isPaused ? "#EF4444" : "#10B981"}
            />
            <InfoRow
              label="Program ID"
              value={truncateAddress(
                process.env.NEXT_PUBLIC_PROGRAM_ID ?? "—",
                6
              )}
              mono
            />
            <InfoRow label="Network" value="Devnet" color="#06B6D4" />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <span
              onClick={() =>
                window.open(
                  explorerUrl(process.env.NEXT_PUBLIC_PROGRAM_ID ?? ""),
                  "_blank",
                  "noreferrer"
                )
              }
              style={{
                fontSize: "12px",
                color: "#7C3AED",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              {"View program on Explorer →"}
            </span>
          </div>
        </AdminCard>

        {/* Pause / Unpause */}
        {isAdmin ? (
          <PauseAction isPaused={config.isPaused} onSuccess={refresh} />
        ) : (
          <AdminCard title="Pause / Unpause" color="#EF4444">
            <p
              style={{ fontSize: "13px", color: "#5C5C7A", lineHeight: "1.6" }}
            >
              {"Connect the admin wallet to pause or unpause the protocol."}
            </p>
          </AdminCard>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* Update fee */}
        {isAdmin ? (
          <UpdateFeeAction
            currentFee={config.protocolFeeBps}
            onSuccess={refresh}
          />
        ) : (
          <AdminCard title="Update Protocol Fee" color="#F59E0B">
            <div style={{ marginBottom: "1rem" }}>
              <InfoRow
                label="Current fee"
                value={`${config.protocolFeeBps} bps (${(
                  config.protocolFeeBps / 100
                ).toFixed(2)}%)`}
                color="#F59E0B"
              />
            </div>
            <p
              style={{ fontSize: "13px", color: "#5C5C7A", lineHeight: "1.6" }}
            >
              {"Connect the admin wallet to update the fee."}
            </p>
          </AdminCard>
        )}

        {/* Withdraw treasury */}
        {isAdmin ? (
          <WithdrawTreasuryAction onSuccess={refresh} />
        ) : (
          <AdminCard title="Withdraw Treasury Fees" color="#06B6D4">
            <p
              style={{ fontSize: "13px", color: "#5C5C7A", lineHeight: "1.6" }}
            >
              {"Connect the admin wallet to withdraw accumulated fees."}
            </p>
          </AdminCard>
        )}
      </div>
    </div>
  );
}
