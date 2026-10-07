import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  parentId: z.string().nullable().optional()
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  const category = await db.category.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ category });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const count = await db.product.count({ where: { categoryId: params.id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} product(s) are in this category.` },
      { status: 409 }
    );
  }
  await db.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
