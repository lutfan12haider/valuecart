import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required." }, { status: 400 });
  const reviews = await db.review.findMany({
    where: { productId, approved: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
    take: 50
  });
  return NextResponse.json({ reviews });
}

const createSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(2000)
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review." }, { status: 400 });

  const purchased = await db.orderItem.findFirst({
    where: {
      productId: parsed.data.productId,
      order: { userId: user.id, paymentStatus: "PAID" }
    }
  });
  if (!purchased) {
    return NextResponse.json({ error: "You can only review products you have purchased." }, { status: 403 });
  }

  const review = await db.review.upsert({
    where: { productId_userId: { productId: parsed.data.productId, userId: user.id } },
    create: {
      productId: parsed.data.productId,
      userId: user.id,
      rating: parsed.data.rating,
      body: parsed.data.body,
      verified: true,
      approved: true
    },
    update: { rating: parsed.data.rating, body: parsed.data.body, approved: true }
  });

  const agg = await db.review.aggregate({
    where: { productId: parsed.data.productId, approved: true },
    _avg: { rating: true },
    _count: true
  });
  await db.product.update({
    where: { id: parsed.data.productId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count }
  });

  return NextResponse.json({ review }, { status: 201 });
}
