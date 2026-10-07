import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const q = searchParams.q?.trim();
  const status = searchParams.status;

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
    take: 100
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search order # or email" className="rounded-lg border px-3 py-2 text-sm" />
        <select name="status" defaultValue={status} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn">
          Filter
        </button>
      </form>
      <div className="card divide-y">
        {orders.map((o) => (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="block p-4 hover:bg-slate-50">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-semibold">{o.orderNumber}</span>
              <span className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm">
              {o.email} · {o.status} · Payment: {o.paymentStatus} · Total: {o.total.toString()} {o.currency}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
