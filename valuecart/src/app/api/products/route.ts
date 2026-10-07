import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getDisplayRate, toDisplay } from "@/lib/currency";

const query = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  sort: z.enum(["new", "price_asc", "price_desc", "rating", "popular"]).default("new"),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(48).default(24)
});

const orderBy = {
  new: { createdAt: "desc" },
  price_asc: { basePrice: "asc" },
  price_desc: { basePrice: "desc" },
  rating: { ratingAvg: "desc" },
  popular: { sold: "desc" }
} as const;

export async function GET(req: Request) {
  const parsed = query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid filters." }, { status: 400 });
  const { q, category, brand, min, max, sort, page, size } = parsed.data;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(category && { category: { slug: category } }),
    ...(brand && { brand }),
    ...((min !== undefined || max !== undefined) && { basePrice: { gte: min, lte: max } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } }
      ]
    })
  };

  const [items, total, rate] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: orderBy[sort],
      skip: (page - 1) * size,
      take: size,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }
    }),
    db.product.count({ where }),
    getDisplayRate()
  ]);

  return NextResponse.json({
    page,
    size,
    total,
    items: items.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      image: p.images[0]?.url ?? null,
      price: toDisplay(Number(p.salePrice ?? p.basePrice), rate),
      oldPrice: p.salePrice ? toDisplay(Number(p.basePrice), rate) : null,
      currency: p.displayCurrency,
      rating: p.ratingAvg,
      reviews: p.ratingCount,
      inStock: p.stock - p.reserved > 0
    }))
  });
}

const create = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  sku: z.string().min(1).max(60),
  description: z.string().min(1),
  categoryId: z.string(),
  basePrice: z.number().positive(),
  salePrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  brand: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "DISABLED"]).default("DRAFT")
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = create.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
  const product = await db.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
