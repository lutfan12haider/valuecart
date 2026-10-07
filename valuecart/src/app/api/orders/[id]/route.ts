import { NextResponse } from "next/server";
import { getUser, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true, payments: true, shipment: true }
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const isAdmin = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
  if (order.userId) {
    if (!user || (order.userId !== user.id && !isAdmin)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  } else if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({ order });
}

const statusSchema = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await req.json().catch(() => null);
  const status = body?.status as (typeof statusSchema)[number] | undefined;
  if (!status || !statusSchema.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const order = await db.order.update({ where: { id: params.id }, data: { status } });
  return NextResponse.json({ order });
}
