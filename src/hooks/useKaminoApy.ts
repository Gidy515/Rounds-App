"use client";

import { useState, useEffect } from "react";

export interface KaminoApyData {
  supplyApy: number;
  borrowApy: number;
  utilization: number;
  totalDeposits: number;
  loading: boolean;
  error: string | null;
}

const KAMINO_API =
  "https://api.kamino.finance/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/metrics";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export function useKaminoApy(): KaminoApyData {
  const [data, setData] = useState<KaminoApyData>({
    supplyApy: 0.068,
    borrowApy: 0.085,
    utilization: 0.78,
    totalDeposits: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchApy() {
      try {
        const res = await fetch(KAMINO_API, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`Kamino API returned ${res.status}`);

        const reserves = await res.json();
        console.log(
          "All tokens:",
          reserves
            .map((r: any) => `${r.liquidityToken} | ${r.liquidityTokenMint}`)
            .join("\n")
        );

        if (!Array.isArray(reserves)) {
          throw new Error("Unexpected Kamino API response format");
        }

        // API uses liquidityToken as symbol and liquidityTokenMint as mint
        // Find all USDC reserves
        const usdcReserves = reserves.filter(
          (r: any) =>
            r.liquidityToken === "USDC" && r.liquidityTokenMint === USDC_MINT
        );

        // Pick the one with the highest totalSupply — that's the main lending market
        const usdcReserve = usdcReserves.reduce((best: any, current: any) => {
          if (!best) return current;
          return parseFloat(current.totalSupply ?? "0") >
            parseFloat(best.totalSupply ?? "0")
            ? current
            : best;
        }, null);

        if (!usdcReserve) {
          throw new Error(
            `USDC not found. Available: ${reserves
              .map((r: any) => r.liquidityToken)
              .join(", ")}`
          );
        }

        const supplyApy = parseFloat(usdcReserve.supplyApy ?? "0.068");
        const borrowApy = parseFloat(usdcReserve.borrowApy ?? "0.085");
        const totalSupply = parseFloat(usdcReserve.totalSupply ?? "0");
        const totalBorrow = parseFloat(usdcReserve.totalBorrow ?? "0");
        const utilization = totalSupply > 0 ? totalBorrow / totalSupply : 0.78;
        const totalDeposits = parseFloat(usdcReserve.totalSupplyUsd ?? "0");

        setData({
          supplyApy,
          borrowApy,
          utilization,
          totalDeposits,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        console.error("Kamino APY fetch error:", err.message);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err.message,
        }));
      }
    }

    fetchApy();
  }, []);

  return data;
}
