import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const url = new URL(req.url);
  const pending = url.searchParams.get("pending") === "1";

  const reviews = await db.review.findMany({
    where: pending ? { approved: false } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } }
    }
  });

  return NextResponse.json({ reviews });
}

const patchSchema = z.object({
  approved: z.boolean()
});

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const review = await db.review.update({ where: { id }, data: { approved: parsed.data.approved } });

  // Recalculate product rating
  const agg = await db.review.aggregate({
    where: { productId: review.productId, approved: true },
    _avg: { rating: true },
    _count: true
  });
  await db.product.update({
    where: { id: review.productId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count }
  });

  return NextResponse.json({ review });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const review = await db.review.delete({ where: { id } });

  const agg = await db.review.aggregate({
    where: { productId: review.productId, approved: true },
    _avg: { rating: true },
    _count: true
  });
  await db.product.update({
    where: { id: review.productId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count }
  });

  return NextResponse.json({ ok: true });
}
