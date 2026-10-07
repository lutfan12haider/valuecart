import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { availableStock, resolveCart, unitBasePrice } from "./cart";
import { validateCoupon, totalAfterDiscount } from "./coupons";
import { calculateShipping } from "./shipping";
import { addMoney, moneyFromDecimal, mulMoney, percentOf } from "./money";

function orderNumber() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VC-${y}${m}${day}-${rand}`;
}

function taxRate(): number {
  const raw = process.env.TAX_RATE_PERCENT;
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export type CheckoutInput = {
  userId?: string;
  email: string;
  phone: string;
  shipFullName: string;
  shipCountry: string;
  shipState: string;
  shipCity: string;
  shipLine1: string;
  shipPostalCode: string;
  couponCode?: string;
};

export async function createOrderFromCart(input: CheckoutInput) {
  const cart = await resolveCart();
  if (!cart.items.length) {
    return { ok: false as const, message: "Your cart is empty." };
  }

  for (const item of cart.items) {
    if (item.product.status !== "ACTIVE") {
      return { ok: false as const, message: `${item.product.name} is no longer available.` };
    }
    const stock = availableStock(item.product, item.variant);
    if (item.quantity > stock) {
      return { ok: false as const, message: `Not enough stock for ${item.product.name}.` };
    }
  }

  let subtotal = new Decimal(0);
  const lineItems: {
    productId: string;
    variantId: string | null;
    name: string;
    sku: string;
    options: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    unitPrice: Decimal;
    quantity: number;
  }[] = [];

  for (const item of cart.items) {
    const unit = moneyFromDecimal(unitBasePrice(item.product, item.variant));
    subtotal = addMoney(subtotal, mulMoney(unit, item.quantity));
    const opts = item.variant?.options;
    lineItems.push({
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      sku: item.variant?.sku ?? item.product.sku,
      options: opts && typeof opts === "object" ? (opts as Prisma.InputJsonValue) : Prisma.JsonNull,
      unitPrice: unit,
      quantity: item.quantity
    });
  }

  const productIds = cart.items.map((i) => i.productId);
  const categoryIds = [...new Set(cart.items.map((i) => i.product.categoryId))];

  let discount = new Decimal(0);
  let couponId: string | null = null;
  let couponCode: string | null = null;
  if (input.couponCode?.trim()) {
    const coupon = await validateCoupon({
      code: input.couponCode,
      userId: input.userId,
      subtotal,
      productIds,
      categoryIds
    });
    if (!coupon.ok) return { ok: false as const, message: coupon.message };
    discount = coupon.discount;
    couponId = coupon.couponId;
    couponCode = coupon.code;
  }

  const afterDiscount = totalAfterDiscount(subtotal, discount);
  const shipping = await calculateShipping(afterDiscount, input.shipCountry);
  const tax = percentOf(afterDiscount, taxRate());
  const total = addMoney(afterDiscount, shipping, tax);

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        userId: input.userId,
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        currency: "USDT",
        subtotal,
        discount,
        shipping,
        tax,
        total,
        couponCode,
        shipFullName: input.shipFullName.trim(),
        shipCountry: input.shipCountry.trim(),
        shipState: input.shipState.trim(),
        shipCity: input.shipCity.trim(),
        shipLine1: input.shipLine1.trim(),
        shipPostalCode: input.shipPostalCode.trim(),
        items: { create: lineItems }
      }
    });

    await tx.payment.create({
      data: {
        orderId: created.id,
        provider: process.env.PAYMENT_PROVIDER ?? "mock",
        amount: total,
        currency: created.currency,
        status: "PENDING"
      }
    });

    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      await tx.couponUsage.create({
        data: { couponId, userId: input.userId, orderId: created.id }
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  return { ok: true as const, order };
}
