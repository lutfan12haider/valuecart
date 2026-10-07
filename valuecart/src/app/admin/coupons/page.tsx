import AdminCouponForm from "@/components/AdminCouponForm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Coupons</h1>
      <AdminCouponForm />
      <div className="card divide-y">
        {coupons.map((c) => (
          <div key={c.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm">
            <div>
              <p className="font-bold">{c.code}</p>
              <p className="text-slate-600">
                {c.type} · {c.value.toString()} · Used {c.usedCount}
                {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
              </p>
            </div>
            <span className={c.active ? "text-green-600" : "text-slate-400"}>{c.active ? "Active" : "Inactive"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
