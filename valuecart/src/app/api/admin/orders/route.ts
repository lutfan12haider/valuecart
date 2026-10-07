import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status") ?? undefined;

  const orders = await db.order.findMany({
    where: {
      ...(status && { status: status as never }),
      ...(q && {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } }
        ]
      })
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: { take: 2 } }
  });
  return NextResponse.json({ orders });
}
