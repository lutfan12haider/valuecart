import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { availableStock, resolveOrCreateCart } from "@/lib/cart";

const addSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(9999)
});

const updateSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(0).max(9999)
});

const removeSchema = z.object({ itemId: z.string() });

export async function POST(req: Request) {
  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const product = await db.product.findFirst({
    where: { id: parsed.data.productId, status: "ACTIVE" },
    include: { variants: true }
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  let variant = null;
  if (parsed.data.variantId) {
    variant = product.variants.find((v) => v.id === parsed.data.variantId) ?? null;
    if (!variant) return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  }

  const stock = availableStock(product, variant);
  if (stock < 1) return NextResponse.json({ error: "This product is out of stock." }, { status: 400 });

  const cart = await resolveOrCreateCart();
  const existing = cart.items.find(
    (i) => i.productId === parsed.data.productId && i.variantId === (parsed.data.variantId ?? null)
  );
  const newQty = (existing?.quantity ?? 0) + parsed.data.quantity;
  if (newQty > stock) {
    return NextResponse.json({ error: `Only ${stock} units available.` }, { status: 400 });
  }

  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: parsed.data.productId,
        variantId: parsed.data.variantId,
        quantity: parsed.data.quantity
      }
    });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const cart = await resolveOrCreateCart();
  const item = cart.items.find((i) => i.id === parsed.data.itemId);
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  if (parsed.data.quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    return NextResponse.json({ ok: true });
  }

  const stock = availableStock(item.product, item.variant);
  if (parsed.data.quantity > stock) {
    return NextResponse.json({ error: `Only ${stock} units available.` }, { status: 400 });
  }

  await db.cartItem.update({ where: { id: item.id }, data: { quantity: parsed.data.quantity } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const parsed = removeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const cart = await resolveOrCreateCart();
  const item = cart.items.find((i) => i.id === parsed.data.itemId);
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  await db.cartItem.delete({ where: { id: item.id } });
  return NextResponse.json({ ok: true });
}
