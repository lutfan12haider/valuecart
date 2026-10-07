import { db } from "@/lib/db";
import { formatUsdt } from "@/lib/currency";
import { getDisplayRate, toDisplay } from "@/lib/currency";
import { toMoneyNumber } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [orders, revenue, products, customers, lowStock, rate] = await Promise.all([
    db.order.count(),
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    db.product.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { status: "ACTIVE", stock: { lte: 5 } } }),
    getDisplayRate()
  ]);

  const rev = revenue._sum.total ? toDisplay(toMoneyNumber(revenue._sum.total), rate) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Orders" value={String(orders)} />
        <Stat label="Paid revenue (display)" value={formatUsdt(rev)} />
        <Stat label="Products" value={String(products)} />
        <Stat label="Customers" value={String(customers)} />
      </div>
      {lowStock > 0 && (
        <p className="card p-4 text-sm text-amber-800">
          {lowStock} product(s) at or below low-stock threshold. Check{" "}
          <a href="/admin/inventory?low=1" className="font-medium underline">
            inventory
          </a>
          .
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
