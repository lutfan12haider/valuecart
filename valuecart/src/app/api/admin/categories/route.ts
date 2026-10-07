import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } }
  });
  return NextResponse.json({ categories });
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens only"),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  parentId: z.string().nullable().optional()
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid category data." }, { status: 400 });

  const exists = await db.category.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });

  const category = await db.category.create({ data: parsed.data });
  return NextResponse.json({ category }, { status: 201 });
}
