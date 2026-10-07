import { Decimal } from "@prisma/client/runtime/library";

/** Parse user/API numeric input into a fixed 2-decimal string (no float drift). */
export function moneyFromNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error("Invalid amount");
  return new Decimal(value).toFixed(2);
}

export function moneyFromDecimal(value: Decimal | string | number): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function addMoney(...values: (Decimal | string | number)[]): Decimal {
  return values.reduce<Decimal>((sum, v) => sum.add(moneyFromDecimal(v)), new Decimal(0));
}

export function subMoney(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return moneyFromDecimal(a).sub(moneyFromDecimal(b));
}

export function mulMoney(amount: Decimal | string | number, qty: number): Decimal {
  return moneyFromDecimal(amount).mul(qty);
}

export function percentOf(amount: Decimal | string | number, percent: number): Decimal {
  return moneyFromDecimal(amount).mul(percent).div(100);
}

export function toMoneyNumber(value: Decimal | string | number): number {
  return moneyFromDecimal(value).toNumber();
}
