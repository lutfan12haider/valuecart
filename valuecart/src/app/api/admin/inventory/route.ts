import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const lowOnly = new URL(req.url).searchParams.get("low") === "1";
  const products = await db.product.findMany({
    where: lowOnly ? { stock: { lte: 5 }, status: { not: "DISABLED" } } : {},
    orderBy: { stock: "asc" },
    take: 200,
    select: { id: true, name: true, sku: true, stock: true, status: true, lowStockAt: true }
  });
  return NextResponse.json({ products });
}

const patchSchema = z.object({
  productId: z.string(),
  stock: z.number().int().min(0),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "DISABLED"]).optional()
});

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  const status =
    parsed.data.status ??
    (parsed.data.stock <= 0 ? "OUT_OF_STOCK" : "ACTIVE");
  const product = await db.product.update({
    where: { id: parsed.data.productId },
    data: { stock: parsed.data.stock, status }
  });
  return NextResponse.json({ product });
}
