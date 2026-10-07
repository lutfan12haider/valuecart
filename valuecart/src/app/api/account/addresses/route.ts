import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(30),
  country: z.string().trim().min(2).max(80),
  state: z.string().trim().max(80).default(""),
  city: z.string().trim().min(1).max(80),
  line1: z.string().trim().min(3).max(200),
  postalCode: z.string().trim().min(2).max(20),
  isDefault: z.boolean().optional()
});

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = addressSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid address." }, { status: 400 });

  if (parsed.data.isDefault) {
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const address = await db.address.create({
    data: { userId: user.id, ...parsed.data, state: parsed.data.state ?? "" }
  });
  return NextResponse.json({ address }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const existing = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await db.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
