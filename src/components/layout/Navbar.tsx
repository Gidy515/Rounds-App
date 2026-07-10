"use client";

import { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/wallet/WalletButton";
import { truncateAddress } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/circles", label: "Circles" },
  { href: "/app/my-circles", label: "My Circles" },
  { href: "/app/admin", label: "Admin" },
  { href: "/app/collateral", label: "Yield" },
];

export const Navbar: FC = () => {
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const isLanding = pathname === "/";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        backgroundColor: "rgba(8, 8, 16, 0.85)",
      }}
    >
      <div
        className="section"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              fontWeight: "700",
              color: "white",
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: "0 0 20px rgba(124,58,237,0.4)",
            }}
          >
            R
          </div>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: "700",
              fontSize: "17px",
              color: "#F8F8FF",
              letterSpacing: "-0.01em",
            }}
          >
            Rounds
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "#5C5C7A",
              padding: "2px 7px",
              background: "rgba(124,58,237,0.1)",
              borderRadius: "4px",
              border: "1px solid rgba(124,58,237,0.2)",
              fontWeight: "600",
              letterSpacing: "0.05em",
            }}
          >
            DEVNET
          </span>
        </Link>

        {/* Nav links */}
        {!isLanding && (
          <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/app" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: isActive ? "600" : "400",
                    color: isActive ? "#F8F8FF" : "#5C5C7A",
                    background: isActive
                      ? "rgba(124,58,237,0.12)"
                      : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s",
                    border: isActive
                      ? "1px solid rgba(124,58,237,0.2)"
                      : "1px solid transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {publicKey && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10B981",
                  boxShadow: "0 0 6px #10B981",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: "#A0A0B8",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {truncateAddress(publicKey.toBase58())}
              </span>
            </div>
          )}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
};
