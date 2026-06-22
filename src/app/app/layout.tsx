"use client";

import { FC, ReactNode, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Spinner } from "@/components/ui/Spinner";
import { WalletButton } from "@/components/wallet/WalletButton";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { connected, connecting } = useWallet();
  const router = useRouter();

  // Show connect screen if not connected
  if (connecting) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05050D",
        }}
      >
        <Spinner size={32} />
      </div>
    );
  }

  if (!connected) {
    return (
      <>
        <Navbar />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#05050D",
            gap: "1.5rem",
            paddingTop: "64px",
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: "700",
              color: "white",
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: "0 0 40px rgba(124,58,237,0.4)",
            }}
          >
            R
          </div>

          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#F0F0FF",
                marginBottom: "0.5rem",
                letterSpacing: "-0.02em",
              }}
            >
              Connect Your Wallet
            </h1>
            <p
              style={{ color: "#6B6B8A", fontSize: "15px", lineHeight: "1.6" }}
            >
              Connect a Solana wallet to access Rounds Protocol
            </p>
          </div>

          <WalletButton />

          <p style={{ fontSize: "12px", color: "#3A3A5C" }}>
            Phantom · Solflare · and more
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main
        style={{
          paddingTop: "64px",
          minHeight: "100vh",
          background: "#05050D",
        }}
      >
        {children}
      </main>
    </>
  );
}
