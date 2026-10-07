import { NextResponse } from "next/server";
import { resolveOrCreateCart } from "@/lib/cart";
import { getDisplayRate, toDisplay } from "@/lib/currency";
import { unitBasePrice } from "@/lib/cart";
import { mulMoney, toMoneyNumber } from "@/lib/money";

export async function GET() {
  const [cart, rate] = await Promise.all([resolveOrCreateCart(), getDisplayRate()]);
  let subtotal = 0;
  const items = cart.items.map((item) => {
    const unit = toMoneyNumber(unitBasePrice(item.product, item.variant));
    const line = toMoneyNumber(mulMoney(unit, item.quantity));
    subtotal += line;
    const displayUnit = toDisplay(unit, rate);
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      unitPrice: displayUnit,
      lineTotal: toDisplay(line, rate),
      maxQuantity: item.product.stock - item.product.reserved
    };
  });

  return NextResponse.json({
    id: cart.id,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: toDisplay(subtotal, rate),
    items
  });
}
