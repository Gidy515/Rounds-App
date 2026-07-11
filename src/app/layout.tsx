import type { Metadata } from "next";
import { SolanaWalletProvider } from "@/components/wallet/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rounds Protocol",
  description: "Trustless rotating savings circles on Solana",
  icons: {
    icon: "/favicon.ico",
    apple: "/rounds-icon-192.png",
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
