import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional()
});

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const full = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true }
  });
  return NextResponse.json({ user: full });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
  const updated = await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone }
  });
  return NextResponse.json({ user: { id: updated.id, name: updated.name, phone: updated.phone } });
}
