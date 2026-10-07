import { Decimal } from "@prisma/client/runtime/library";
import { resolveCart, unitBasePrice } from "./cart";
import { validateCoupon, totalAfterDiscount } from "./coupons";
import { calculateShipping } from "./shipping";
import { addMoney, mulMoney, percentOf, toMoneyNumber } from "./money";
import { getDisplayRate, toDisplay } from "./currency";

function taxRate(): number {
  const raw = process.env.TAX_RATE_PERCENT;
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function getCheckoutSummary(couponCode?: string, country = "United States") {
  const cart = await resolveCart();
  let subtotal = new Decimal(0);
  for (const item of cart.items) {
    subtotal = addMoney(subtotal, mulMoney(unitBasePrice(item.product, item.variant), item.quantity));
  }

  let discount = new Decimal(0);
  if (couponCode?.trim()) {
    const c = await validateCoupon({
      code: couponCode,
      subtotal,
      productIds: cart.items.map((i) => i.productId),
      categoryIds: [...new Set(cart.items.map((i) => i.product.categoryId))]
    });
    if (c.ok) discount = c.discount;
  }

  const afterDiscount = totalAfterDiscount(subtotal, discount);
  const shipping = await calculateShipping(afterDiscount, country);
  const tax = percentOf(afterDiscount, taxRate());
  const total = addMoney(afterDiscount, shipping, tax);
  const rate = await getDisplayRate();

  return {
    itemCount: cart.items.reduce((n, i) => n + i.quantity, 0),
    subtotal: toDisplay(toMoneyNumber(subtotal), rate),
    discount: toDisplay(toMoneyNumber(discount), rate),
    shipping: toDisplay(toMoneyNumber(shipping), rate),
    tax: toDisplay(toMoneyNumber(tax), rate),
    total: toDisplay(toMoneyNumber(total), rate)
  };
}
