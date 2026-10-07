import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { resolveCart, unitBasePrice } from "@/lib/cart";
import { validateCoupon } from "@/lib/coupons";
import { addMoney, mulMoney, toMoneyNumber } from "@/lib/money";
import { Decimal } from "@prisma/client/runtime/library";

const schema = z.object({ code: z.string().trim().min(1).max(40) });

export async function POST(req: Request) {
  const user = await getUser();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid coupon." }, { status: 400 });

  const cart = await resolveCart();
  let subtotal = new Decimal(0);
  for (const item of cart.items) {
    subtotal = addMoney(subtotal, mulMoney(unitBasePrice(item.product, item.variant), item.quantity));
  }

  const result = await validateCoupon({
    code: parsed.data.code,
    userId: user?.id,
    subtotal,
    productIds: cart.items.map((i) => i.productId),
    categoryIds: [...new Set(cart.items.map((i) => i.product.categoryId))]
  });

  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ code: result.code, discount: toMoneyNumber(result.discount) });
}
