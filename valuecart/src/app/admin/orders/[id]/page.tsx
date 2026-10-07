import Link from "next/link";
import { notFound } from "next/navigation";
import AdminOrderActions from "@/components/AdminOrderActions";
import ShipmentEditor from "@/components/ShipmentEditor";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      payments: true,
      shipment: true,
      user: { select: { name: true, email: true } }
    }
  });
  if (!order) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/orders" className="text-sm text-brand">← Orders</Link>
      <h1 className="text-2xl font-bold">{order.orderNumber}</h1>

      <AdminOrderActions orderId={order.id} current={order.status} />

      <div className="card space-y-1 p-4 text-sm">
        <p>Customer: {order.user?.name ?? order.shipFullName} ({order.email})</p>
        <p>Payment: {order.paymentStatus} · Total: {order.total.toString()} {order.currency}</p>
        <p>Ship to: {order.shipLine1}, {order.shipCity}, {order.shipState} {order.shipPostalCode}, {order.shipCountry}</p>
      </div>

      <div className="card divide-y">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between p-3 text-sm">
            <span>{item.name} × {item.quantity}</span>
            <span>{item.unitPrice.toString()} {order.currency}</span>
          </div>
        ))}
      </div>

      <ShipmentEditor orderId={order.id} shipment={order.shipment} />
    </div>
  );
}
