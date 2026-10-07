import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const [orders, revenue, products, customers, lowStock] = await Promise.all([
    db.order.count(),
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    db.product.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { status: "ACTIVE", stock: { lte: 5 } } })
  ]);
  return NextResponse.json({
    orders,
    revenue: revenue._sum.total?.toString() ?? "0",
    products,
    customers,
    lowStock
  });
}
