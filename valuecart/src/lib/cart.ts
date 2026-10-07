import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "./db";
import { getUser } from "./auth";

const CART_COOKIE = "vc_cart";

const cartInclude = {
  items: {
    include: {
      product: {
        include: { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } }
      },
      variant: true
    }
  }
} as const;

export type CartWithItems = Awaited<ReturnType<typeof resolveCart>>;

// Used in page renders — reads cookie but never sets it (Next.js 14 restriction)
export async function resolveCart() {
  const user = await getUser();
  if (user) {
    let cart = await db.cart.findUnique({ where: { userId: user.id }, include: cartInclude });
    if (!cart) {
      cart = await db.cart.create({ data: { userId: user.id }, include: cartInclude });
    }
    return cart;
  }

  const token = cookies().get(CART_COOKIE)?.value;
  if (!token) {
    // No cart yet — return empty placeholder (cookie set on first mutation via resolveOrCreateCart)
    return { id: "", token: null as string | null, userId: null as string | null, updatedAt: new Date(), items: [] as [] };
  }

  let cart = await db.cart.findUnique({ where: { token }, include: cartInclude });
  if (!cart) {
    cart = await db.cart.create({ data: { token }, include: cartInclude });
  }
  return cart;
}

// Used in Route Handlers — allowed to set cookies
export async function resolveOrCreateCart() {
  const user = await getUser();
  if (user) {
    let cart = await db.cart.findUnique({ where: { userId: user.id }, include: cartInclude });
    if (!cart) {
      cart = await db.cart.create({ data: { userId: user.id }, include: cartInclude });
    }
    return cart;
  }

  const jar = cookies();
  let token = jar.get(CART_COOKIE)?.value;
  if (!token) {
    token = randomBytes(24).toString("hex");
    jar.set(CART_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  let cart = await db.cart.findUnique({ where: { token }, include: cartInclude });
  if (!cart) {
    cart = await db.cart.create({ data: { token }, include: cartInclude });
  }
  return cart;
}

export async function mergeGuestCartIntoUser(userId: string) {
  const token = cookies().get(CART_COOKIE)?.value;
  if (!token) return;

  const [guest, userCart] = await Promise.all([
    db.cart.findUnique({ where: { token }, include: { items: true } }),
    db.cart.findUnique({ where: { userId }, include: { items: true } })
  ]);
  if (!guest?.items.length) {
    cookies().delete(CART_COOKIE);
    return;
  }

  const target =
    userCart ??
    (await db.cart.create({ data: { userId }, include: { items: true } }));

  for (const item of guest.items) {
    const existing = target.items.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity }
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: target.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        }
      });
    }
  }

  await db.cart.delete({ where: { id: guest.id } });
  cookies().delete(CART_COOKIE);
}

export function availableStock(product: { stock: number; reserved: number }, variant?: { stock: number; reserved: number } | null) {
  if (variant) return variant.stock - variant.reserved;
  return product.stock - product.reserved;
}

export function unitBasePrice(
  product: { basePrice: unknown; salePrice: unknown },
  variant?: { basePrice: unknown } | null
) {
  const variantPrice = variant?.basePrice != null ? Number(variant.basePrice) : null;
  const sale = product.salePrice != null ? Number(product.salePrice) : null;
  const base = Number(product.basePrice);
  if (variantPrice != null && variantPrice > 0) return variantPrice;
  if (sale != null && sale > 0) return sale;
  return base;
}
