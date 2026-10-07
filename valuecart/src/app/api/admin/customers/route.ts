import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const customers = await db.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q && {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } }
        ]
      })
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      disabled: true,
      createdAt: true,
      _count: { select: { orders: true } }
    }
  });
  return NextResponse.json({ customers });
}
