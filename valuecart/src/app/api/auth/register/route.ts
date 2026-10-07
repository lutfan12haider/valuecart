import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8).max(100)
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`register:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again soon." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
  const { name, email, phone, password } = parsed.data;
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }
  const user = await db.user.create({
    data: { name, email, phone, passwordHash: await bcrypt.hash(password, 12) }
  });
  await createSession(user.id, user.role);
  await mergeGuestCartIntoUser(user.id);
  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
