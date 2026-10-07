import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatUsdt } from "@/lib/currency";
import { getDisplayRate, toDisplay } from "@/lib/currency";
import { toMoneyNumber } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/orders");

  const [orders, rate] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: true } }),
    getDisplayRate()
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Order history</h1>
      {!orders.length ? (
        <p className="text-slate-600">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="card block p-4 hover:border-brand">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{o.orderNumber}</span>
                <span className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-600">
                {o.items.length} item(s) · {o.status} · Payment: {o.paymentStatus}
              </p>
              <p className="font-bold text-brand">{formatUsdt(toDisplay(toMoneyNumber(o.total), rate))}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
