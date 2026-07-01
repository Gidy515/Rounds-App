"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/useProgram";
import { PublicKey } from "@solana/web3.js";
import {
  deriveCirclePda,
  deriveCollateralVaultPda,
  derivePotVaultPda,
  deriveProtocolConfigPda,
  FREQUENCY_TO_NUM,
} from "@/lib/pdas";
import {
  USDC_MINT,
  TOKEN_2022_PROGRAM_ID,
  CONTRIBUTION_PRESETS,
  MEMBER_PRESETS,
  FREQUENCY_OPTIONS,
  MIN_MEMBERS,
  MAX_MEMBERS,
} from "@/lib/constants";
import {
  formatUsdc,
  calculateCollateral,
  calculatePremium,
  explorerUrl,
} from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { SystemProgram } from "@solana/web3.js";
import BN from "bn.js";

// ── Preset button ─────────────────────────────────────────
const PresetBtn: FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}> = ({ label, active, onClick, color = "#7C3AED" }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: active ? "600" : "400",
      color: active ? "#fff" : "#6B6B8A",
      background: active ? color : "rgba(255,255,255,0.025)",
      border: active
        ? `1px solid ${color}`
        : "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer",
      transition: "all 0.15s",
    }}
  >
    {label}
  </button>
);

// ── Step dot ──────────────────────────────────────────────
const StepDot: FC<{ num: number; active: boolean; done: boolean }> = ({
  num,
  active,
  done,
}) => (
  <div
    style={{
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: "13px",
      fontWeight: "600",
      flexShrink: 0,
      background: done
        ? "#7C3AED"
        : active
        ? "rgba(124,58,237,0.15)"
        : "rgba(255,255,255,0.03)",
      border: done
        ? "1px solid #7C3AED"
        : active
        ? "1px solid rgba(124,58,237,0.4)"
        : "1px solid rgba(255,255,255,0.06)",
      color: done ? "#fff" : active ? "#A78BFA" : "#5C5C7A",
      transition: "all 0.3s",
    }}
  >
    {done ? "✓" : num}
  </div>
);

// ── Steps bar ─────────────────────────────────────────────
const StepsBar: FC<{ current: number }> = ({ current }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginBottom: "2.5rem",
    }}
  >
    {[
      { num: 1, label: "Configure" },
      { num: 2, label: "Review" },
      { num: 3, label: "Done" },
    ].map((s, i) => (
      <div
        key={s.num}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <StepDot
          num={s.num}
          active={current === s.num}
          done={current > s.num}
        />
        <span
          style={{
            fontSize: "13px",
            color:
              current === s.num
                ? "#F0F0FF"
                : current > s.num
                ? "#7C3AED"
                : "#5C5C7A",
            fontWeight: current === s.num ? "600" : "400",
          }}
        >
          {s.label}
        </span>
        {i < 2 && (
          <div
            style={{
              width: "40px",
              height: "1px",
              background:
                current > s.num ? "#7C3AED" : "rgba(255,255,255,0.06)",
              margin: "0 0.25rem",
            }}
          />
        )}
      </div>
    ))}
  </div>
);

// ── Page header ───────────────────────────────────────────
const PageHeader: FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div style={{ marginBottom: "2rem" }}>
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
      {title}
    </h1>
    <p style={{ color: "#6B6B8A", fontSize: "14px" }}>{sub}</p>
  </div>
);

// ── Config card ───────────────────────────────────────────
const ConfigCard: FC<{
  title: string;
  subtitle: string;
  color: string;
  children: React.ReactNode;
}> = ({ title, subtitle, color, children }) => (
  <div
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
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }}
    />
    <h3
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "16px",
        fontWeight: "600",
        color: "#F0F0FF",
        marginBottom: "0.25rem",
      }}
    >
      {title}
    </h3>
    <p style={{ fontSize: "13px", color: "#6B6B8A", marginBottom: "1.5rem" }}>
      {subtitle}
    </p>
    {children}
  </div>
);

// ── Review row ────────────────────────────────────────────
const ReviewRow: FC<{
  label: string;
  value: string;
  color?: string;
  note?: string;
}> = ({ label, value, color = "#F0F0FF", note }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 1rem",
      background: "rgba(255,255,255,0.025)",
      borderRadius: "10px",
    }}
  >
    <div>
      <div style={{ fontSize: "13px", color: "#6B6B8A" }}>{label}</div>
      {note && (
        <div style={{ fontSize: "11px", color: "#5C5C7A", marginTop: "2px" }}>
          {note}
        </div>
      )}
    </div>
    <span
      style={{
        fontSize: "13px",
        color,
        fontWeight: "600",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {value}
    </span>
  </div>
);

// ── Main page ─────────────────────────────────────────────
export default function CreateCirclePage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useProgram();

  // Form state
  const [contributionAmount, setContributionAmount] = useState(100_000_000);
  const [customAmount, setCustomAmount] = useState("");
  const [totalMembers, setTotalMembers] = useState(5);
  const [frequency, setFrequency] = useState("weekly");

  // UI state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [circlePdaStr, setCirclePdaStr] = useState("");

  async function handleCreate() {
    if (!publicKey || !program) return;
    setLoading(true);
    setError(null);

    try {
      const amountBN = new BN(contributionAmount);
      const freqNum = FREQUENCY_TO_NUM[frequency] ?? 1;
      const freqOption = FREQUENCY_OPTIONS.find(
        (f) => Object.keys(f.value)[0] === frequency
      );
      const freqArg = freqOption?.value ?? { weekly: {} };

      // ── Find the right nonce ──────────────────────────────
      let nonce = 0;
      let circlePda = PublicKey.default;
      let foundSlot = false;

      while (nonce < 255) {
        const [pda] = deriveCirclePda(amountBN, totalMembers, freqNum, nonce);

        try {
          const existing = await program.account.circleAccount.fetch(pda);
          const stateKey = Object.keys(existing.state)[0];

          if (stateKey === "open") {
            setError(
              "An open circle with these parameters already exists. Redirecting you to join it..."
            );
            setTimeout(
              () => router.push(`/app/circles/${pda.toBase58()}`),
              1500
            );
            return;
          }
          // Circle is full/active/completed/cancelled — try next nonce
          nonce++;
        } catch {
          // No circle at this nonce — safe to create here
          circlePda = pda;
          foundSlot = true;
          break;
        }
      }

      if (!foundSlot) {
        setError(
          "All slots for these parameters are occupied. Try different parameters."
        );
        return;
      }

      const [configPda] = deriveProtocolConfigPda();
      const [collateralVaultPda] = deriveCollateralVaultPda(circlePda);
      const [potVaultPda] = derivePotVaultPda(circlePda);

      const sig = await program.methods
        .createCircle(amountBN, totalMembers, freqArg as any, nonce)
        .accountsPartial({
          creator: publicKey,
          protocolConfig: configPda,
          circleAccount: circlePda,
          collateralVault: collateralVaultPda,
          potVault: potVaultPda,
          usdcMint: USDC_MINT,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      setTxSig(sig);
      setCirclePdaStr(circlePda.toBase58());
      setStep(3);
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("insufficient funds") || msg.includes("0x1")) {
        setError("Insufficient SOL. Use the faucet on the dashboard.");
      } else {
        setError(msg || "Transaction failed — please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Success ──────────────────────────────────────
  if (step === 3 && txSig) {
    return (
      <div
        className="section"
        style={{ padding: "2.5rem 1rem", maxWidth: "600px", margin: "0 auto" }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "3rem 2rem",
            background: "rgba(16,185,129,0.05)",
            border: "1px solid rgba(16,185,129,0.15)",
            borderRadius: "24px",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{"🎉"}</div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#F0F0FF",
              marginBottom: "0.5rem",
            }}
          >
            {"Circle Created!"}
          </h2>
          <p
            style={{
              color: "#6B6B8A",
              fontSize: "14px",
              marginBottom: "2rem",
              lineHeight: "1.6",
            }}
          >
            {
              "Your savings circle is live on devnet. Share the link so others can join."
            }
          </p>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              padding: "1rem",
              marginBottom: "1.5rem",
              textAlign: "left",
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
              {"CIRCLE ADDRESS"}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#A0A0B8",
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: "break-all",
              }}
            >
              {circlePdaStr}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => router.push(`/app/circles/${circlePdaStr}`)}
                style={{
                  padding: "12px 24px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                View Circle
              </button>

              <a
                href={explorerUrl(txSig, "tx")}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "12px 24px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)",
                  color: "#A0A0B8",
                  fontWeight: "500",
                  fontSize: "14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                View Transaction
              </a>
            </div>{" "}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Configure ────────────────────────────────────
  if (step === 1) {
    return (
      <div
        className="section"
        style={{ padding: "2.5rem 1rem", maxWidth: "760px", margin: "0 auto" }}
      >
        <PageHeader
          title="Create a Circle"
          sub="Set your parameters and deploy a savings circle onchain"
        />
        <StepsBar current={1} />

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Contribution amount */}
          <ConfigCard
            title="Contribution Amount"
            subtitle="How much each member pays per cycle"
            color="#7C3AED"
          >
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              {CONTRIBUTION_PRESETS.map((p) => (
                <PresetBtn
                  key={p.label}
                  label={p.label}
                  active={contributionAmount === p.value && !customAmount}
                  onClick={() => {
                    setContributionAmount(p.value);
                    setCustomAmount("");
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 1) {
                    setContributionAmount(Math.floor(val * 1_000_000));
                  }
                }}
                style={{
                  width: "160px",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "10px",
                  color: "#F0F0FF",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <span style={{ fontSize: "13px", color: "#6B6B8A" }}>
                {"USDC"}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "#A78BFA",
                  fontWeight: "600",
                  marginLeft: "auto",
                }}
              >
                {"Selected: "}
                {formatUsdc(new BN(contributionAmount))}
                {" USDC"}
              </span>
            </div>
          </ConfigCard>

          {/* Member count */}
          <ConfigCard
            title="Number of Members"
            subtitle="How many wallets will join this circle"
            color="#06B6D4"
          >
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              {MEMBER_PRESETS.map((m) => (
                <PresetBtn
                  key={m}
                  label={m.toString()}
                  active={totalMembers === m}
                  onClick={() => setTotalMembers(m)}
                  color="#06B6D4"
                />
              ))}
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <input
                type="number"
                min={MIN_MEMBERS}
                max={MAX_MEMBERS}
                value={totalMembers}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v))
                    setTotalMembers(
                      Math.min(MAX_MEMBERS, Math.max(MIN_MEMBERS, v))
                    );
                }}
                style={{
                  width: "100px",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "10px",
                  color: "#F0F0FF",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <span style={{ fontSize: "13px", color: "#6B6B8A" }}>
                {"members (2–20)"}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "#06B6D4",
                  fontWeight: "600",
                  marginLeft: "auto",
                }}
              >
                {"Selected: "}
                {totalMembers}
              </span>
            </div>
          </ConfigCard>

          {/* Frequency */}
          <ConfigCard
            title="Payout Frequency"
            subtitle="How often members pay and the pot is disbursed"
            color="#F59E0B"
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {FREQUENCY_OPTIONS.map((f) => {
                const key = Object.keys(f.value)[0];
                const active = frequency === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFrequency(key)}
                    style={{
                      padding: "1rem",
                      borderRadius: "12px",
                      background: active
                        ? "rgba(245,158,11,0.1)"
                        : "rgba(255,255,255,0.025)",
                      border: active
                        ? "1px solid rgba(245,158,11,0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: active ? "#F59E0B" : "#A0A0B8",
                        marginBottom: "4px",
                      }}
                    >
                      {f.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "#5C5C7A" }}>
                      {"~"}
                      {Math.round(f.slots / 216_000)}
                      {"d cycle"}
                    </div>
                  </button>
                );
              })}
            </div>
          </ConfigCard>

          <button
            onClick={() => setStep(2)}
            style={{
              padding: "14px 32px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
              color: "#fff",
              fontWeight: "600",
              fontSize: "15px",
              border: "1px solid rgba(124,58,237,0.5)",
              cursor: "pointer",
              boxShadow: "0 0 30px rgba(124,58,237,0.3)",
            }}
          >
            {"Review Circle →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Review ───────────────────────────────────────
  const amountBN = new BN(contributionAmount);
  const collateralPos1 = calculateCollateral(1, totalMembers, amountBN);
  const premiumPerMember = calculatePremium(amountBN);
  const totalPremium = premiumPerMember.muln(totalMembers - 1);
  const cycle1Pot = amountBN.muln(totalMembers).add(totalPremium);
  const freqOption = FREQUENCY_OPTIONS.find(
    (f) => Object.keys(f.value)[0] === frequency
  );

  return (
    <div
      className="section"
      style={{ padding: "2.5rem 1rem", maxWidth: "760px", margin: "0 auto" }}
    >
      <PageHeader
        title="Review Circle"
        sub="Confirm your parameters before deploying onchain"
      />
      <StepsBar current={2} />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Summary */}
        <ConfigCard title="Circle Summary" subtitle="" color="#7C3AED">
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <ReviewRow
              label="Contribution per cycle"
              value={`${formatUsdc(amountBN)} USDC`}
            />
            <ReviewRow label="Total members" value={totalMembers.toString()} />
            <ReviewRow
              label="Payout frequency"
              value={freqOption?.label ?? frequency}
            />
            <ReviewRow label="Total cycles" value={totalMembers.toString()} />
          </div>
        </ConfigCard>

        {/* Economics */}
        <ConfigCard
          title="Circle Economics"
          subtitle="What each position pays and receives"
          color="#06B6D4"
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <ReviewRow
              label="Position 1 collateral"
              value={`${formatUsdc(collateralPos1)} USDC`}
              color="#7C3AED"
            />
            <ReviewRow
              label="Cycle 1 pot (pos 1 gets)"
              value={`${formatUsdc(cycle1Pot)} USDC`}
              color="#10B981"
              note="includes premiums"
            />
            <ReviewRow
              label="Premium per joining member"
              value={`${formatUsdc(premiumPerMember)} USDC`}
              color="#F59E0B"
            />
            <ReviewRow
              label="Standard pot (cycles 2+)"
              value={`${formatUsdc(amountBN.muln(totalMembers))} USDC`}
              color="#06B6D4"
            />
            <ReviewRow
              label="Position N collateral"
              value="0 USDC"
              color="#6B6B8A"
              note="final position"
            />
          </div>
        </ConfigCard>

        {/* Info box */}
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.15)",
            borderRadius: "12px",
          }}
        >
          <p style={{ fontSize: "13px", color: "#A78BFA", lineHeight: "1.6" }}>
            {
              "Creating this circle deploys a CircleAccount PDA, CollateralVault, and PotVault onchain. After creation you need to join separately as position 1."
            }
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "1rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px",
            }}
          >
            <p style={{ fontSize: "13px", color: "#EF4444" }}>{error}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => {
              setStep(1);
              setError(null);
            }}
            style={{
              padding: "14px 24px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.04)",
              color: "#A0A0B8",
              fontWeight: "500",
              fontSize: "14px",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
            }}
          >
            {"← Back"}
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !publicKey || !program}
            style={{
              flex: 1,
              padding: "14px 32px",
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
              opacity: !publicKey || !program ? 0.5 : 1,
            }}
          >
            {loading ? <Spinner size={18} color="#fff" /> : null}
            {loading ? "Creating..." : "Create Circle"}
          </button>
        </div>
      </div>
    </div>
  );
}
