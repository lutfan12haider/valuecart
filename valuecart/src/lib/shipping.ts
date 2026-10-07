import { Decimal } from "@prisma/client/runtime/library";
import { db } from "./db";
import { moneyFromDecimal } from "./money";

export async function calculateShipping(subtotal: Decimal, country: string): Promise<Decimal> {
  const zones = await db.shippingZone.findMany({ where: { active: true } });
  const zone =
    zones.find((z) => z.countries.includes("*") || z.countries.includes(country)) ??
    zones.find((z) => z.countries.includes("*"));
  if (!zone) return new Decimal(0);
  if (zone.freeAbove && subtotal.gte(moneyFromDecimal(zone.freeAbove))) {
    return new Decimal(0);
  }
  return moneyFromDecimal(zone.charge);
}
