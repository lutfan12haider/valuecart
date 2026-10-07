import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const addSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(200).default(""),
  sortOrder: z.number().int().min(0).default(0)
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid image data." }, { status: 400 });

  const image = await db.productImage.create({
    data: { productId: params.id, ...parsed.data }
  });
  return NextResponse.json({ image }, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const imageId = new URL(req.url).searchParams.get("imageId");
  if (!imageId) return NextResponse.json({ error: "Missing imageId." }, { status: 400 });

  const image = await db.productImage.findFirst({ where: { id: imageId, productId: params.id } });
  if (!image) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await db.productImage.delete({ where: { id: imageId } });
  return NextResponse.json({ ok: true });
}
