import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const coupons = await db.coupon.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ coupons });
}

const createSchema = z.object({
  code: z.string().trim().min(3).max(30),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minOrder: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  usageLimit: z.number().int().positive().optional(),
  active: z.boolean().default(true)
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid coupon." }, { status: 400 });
  const coupon = await db.coupon.create({
    data: {
      code: parsed.data.code.toUpperCase(),
      type: parsed.data.type,
      value: parsed.data.value,
      minOrder: parsed.data.minOrder,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      usageLimit: parsed.data.usageLimit,
      active: parsed.data.active
    }
  });
  return NextResponse.json({ coupon }, { status: 201 });
}
