import { Decimal } from "@prisma/client/runtime/library";
import { db } from "./db";
import { moneyFromDecimal, subMoney } from "./money";

export type CouponResult =
  | { ok: true; couponId: string; code: string; discount: Decimal }
  | { ok: false; message: string };

export async function validateCoupon(input: {
  code: string;
  userId?: string;
  subtotal: Decimal;
  productIds: string[];
  categoryIds: string[];
}): Promise<CouponResult> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, message: "Enter a coupon code." };

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) return { ok: false, message: "This coupon is not valid." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { ok: false, message: "This coupon has expired." };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: "This coupon has reached its usage limit." };
  }
  if (coupon.minOrder && input.subtotal.lt(moneyFromDecimal(coupon.minOrder))) {
    return { ok: false, message: "Order total does not meet the minimum for this coupon." };
  }
  if (coupon.productId && !input.productIds.includes(coupon.productId)) {
    return { ok: false, message: "This coupon does not apply to items in your cart." };
  }
  if (coupon.categoryId && !input.categoryIds.includes(coupon.categoryId)) {
    return { ok: false, message: "This coupon does not apply to items in your cart." };
  }

  let discount: Decimal;
  if (coupon.type === "PERCENTAGE") {
    discount = input.subtotal.mul(moneyFromDecimal(coupon.value)).div(100);
  } else {
    discount = moneyFromDecimal(coupon.value);
  }
  if (discount.gt(input.subtotal)) discount = input.subtotal;

  return { ok: true, couponId: coupon.id, code: coupon.code, discount };
}

export function totalAfterDiscount(subtotal: Decimal, discount: Decimal): Decimal {
  const t = subMoney(subtotal, discount);
  return t.lt(0) ? new Decimal(0) : t;
}
