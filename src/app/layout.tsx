import type { Metadata } from "next";
import { SolanaWalletProvider } from "@/components/wallet/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rounds Protocol — Trustless Savings Circles on Solana",
  description:
    "Decentralised rotating savings circles inspired by Adashe, Ajo, and Esusu. Non-custodial. Mathematically enforced. Built on Solana.",
  keywords: ["Solana", "DeFi", "ROSCA", "savings", "Adashe", "Ajo", "Esusu"],
  openGraph: {
    title: "Rounds Protocol",
    description: "Trustless rotating savings on Solana",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
