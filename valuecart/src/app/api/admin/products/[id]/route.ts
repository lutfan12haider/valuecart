import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  shortDescription: z.string().max(300).nullable().optional(),
  description: z.string().min(1).optional(),
  shippingInfo: z.string().max(300).nullable().optional(),
  categoryId: z.string().optional(),
  basePrice: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  brand: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "DISABLED"]).optional(),
  featured: z.boolean().optional()
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { images: true, variants: true, category: true }
  });
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  const product = await db.product.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  await db.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
