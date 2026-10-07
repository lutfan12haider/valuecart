import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  sku: z.string().min(1).max(60),
  options: z.record(z.string()),
  basePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).default(0)
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid variant data." }, { status: 400 });

  const exists = await db.productVariant.findUnique({ where: { sku: parsed.data.sku } });
  if (exists) return NextResponse.json({ error: "A variant with this SKU already exists." }, { status: 409 });

  const variant = await db.productVariant.create({
    data: { productId: params.id, ...parsed.data }
  });
  return NextResponse.json({ variant }, { status: 201 });
}

const updateSchema = z.object({
  variantId: z.string(),
  basePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional()
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const { variantId, ...data } = parsed.data;
  const variant = await db.productVariant.findFirst({ where: { id: variantId, productId: params.id } });
  if (!variant) return NextResponse.json({ error: "Variant not found." }, { status: 404 });

  const updated = await db.productVariant.update({ where: { id: variantId }, data });
  return NextResponse.json({ variant: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const variantId = new URL(req.url).searchParams.get("variantId");
  if (!variantId) return NextResponse.json({ error: "Missing variantId." }, { status: 400 });

  const variant = await db.productVariant.findFirst({ where: { id: variantId, productId: params.id } });
  if (!variant) return NextResponse.json({ error: "Variant not found." }, { status: 404 });

  await db.productVariant.delete({ where: { id: variantId } });
  return NextResponse.json({ ok: true });
}
