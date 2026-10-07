import { unstable_cache } from "next/cache";
import { db } from "./db";

// Cached for 5 minutes — avoids a DB hit on every page load
export const getDisplayRate = unstable_cache(
  async (): Promise<number> => {
    const row = await db.siteSetting.findUnique({ where: { key: "USDT_DISPLAY_RATE" } });
    const raw = row?.value ?? process.env.USDT_DISPLAY_RATE ?? "1";
    const rate = Number(raw);
    return Number.isFinite(rate) && rate > 0 ? rate : 1;
  },
  ["display-rate"],
  { revalidate: 300 }
);

export function toDisplay(base: number, rate: number): number {
  return Math.round(base * rate * 100) / 100;
}

export function formatUsdt(amount: number): string {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USDT`;
}
