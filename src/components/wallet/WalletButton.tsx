"use client";

import { FC, useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const WalletButton: FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <button
        style={{
          height: "44px",
          padding: "0 20px",
          borderRadius: "12px",
          background: "#7C3AED",
          color: "white",
          fontWeight: "600",
          fontSize: "14px",
          border: "none",
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Connect Wallet
      </button>
    );

  return <WalletMultiButton />;
};
