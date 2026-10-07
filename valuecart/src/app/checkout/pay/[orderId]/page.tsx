import { notFound } from "next/navigation";
import PaymentPanel from "@/components/PaymentPanel";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDisplayRate, toDisplay } from "@/lib/currency";
import { toMoneyNumber } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: { orderId: string } }) {
  const user = await getUser();
  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order) notFound();
  if (order.userId) {
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    if (user?.id !== order.userId && !isAdmin) notFound();
  }

  const rate = await getDisplayRate();
  const total = toDisplay(toMoneyNumber(order.total), rate);

  if (order.paymentStatus === "PAID") {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="text-xl font-bold">Already paid</h1>
        <p className="mt-2 text-slate-600">Order {order.orderNumber} is paid.</p>
      </div>
    );
  }

  return (
    <PaymentPanel orderId={order.id} orderNumber={order.orderNumber} total={total} currency={order.currency} />
  );
}
