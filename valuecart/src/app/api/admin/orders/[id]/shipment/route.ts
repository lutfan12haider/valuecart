import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  courier: z.string().trim().max(80).nullable().optional(),
  trackingNo: z.string().trim().max(120).nullable().optional(),
  trackingUrl: z.string().url().nullable().optional(),
  shippedAt: z.string().datetime().nullable().optional()
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid shipment data." }, { status: 400 });

  const data = {
    courier: parsed.data.courier ?? null,
    trackingNo: parsed.data.trackingNo ?? null,
    trackingUrl: parsed.data.trackingUrl ?? null,
    shippedAt: parsed.data.shippedAt ? new Date(parsed.data.shippedAt) : null
  };

  const shipment = await db.shipment.upsert({
    where: { orderId: params.id },
    create: { orderId: params.id, ...data },
    update: data
  });

  // Auto-update order status to SHIPPED if tracking number is added
  if (data.trackingNo && (order.status === "CONFIRMED" || order.status === "PROCESSING")) {
    await db.order.update({ where: { id: params.id }, data: { status: "SHIPPED" } });
  }

  return NextResponse.json({ shipment });
}
