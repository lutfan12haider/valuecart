import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatUsdt, getDisplayRate, toDisplay } from "@/lib/currency";
import { toMoneyNumber } from "@/lib/money";
import ReviewForm from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { paid?: string };
}) {
  const user = await getUser();
  if (!user) redirect(`/login?next=/account/orders/${params.id}`);

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true, payments: true, shipment: true }
  });
  if (!order || order.userId !== user.id) notFound();

  const rate = await getDisplayRate();
  const fmt = (v: unknown) => formatUsdt(toDisplay(toMoneyNumber(v as string), rate));

  return (
    <div className="space-y-6">
      {searchParams.paid === "1" && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-green-800">Thank you — your payment was recorded.</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
        {order.paymentStatus !== "PAID" && (
          <Link href={`/checkout/pay/${order.id}`} className="btn">
            Complete payment
          </Link>
        )}
      </div>
      <div className="card grid gap-2 p-5 text-sm sm:grid-cols-2">
        <p>
          <span className="font-medium">Status:</span> {order.status}
        </p>
        <p>
          <span className="font-medium">Payment:</span> {order.paymentStatus}
        </p>
        <p className="sm:col-span-2">
          <span className="font-medium">Ship to:</span> {order.shipFullName}, {order.shipLine1}, {order.shipCity},{" "}
          {order.shipCountry} {order.shipPostalCode}
        </p>
      </div>

      {order.shipment && (order.shipment.trackingNo || order.shipment.courier) && (
        <div className="card space-y-2 p-5 text-sm">
          <p className="font-bold text-brand">Shipment tracking</p>
          {order.shipment.courier && (
            <p><span className="font-medium">Courier:</span> {order.shipment.courier}</p>
          )}
          {order.shipment.trackingNo && (
            <p>
              <span className="font-medium">Tracking number:</span>{" "}
              {order.shipment.trackingUrl ? (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand underline"
                >
                  {order.shipment.trackingNo}
                </a>
              ) : (
                <span className="font-mono">{order.shipment.trackingNo}</span>
              )}
            </p>
          )}
          {order.shipment.shippedAt && (
            <p>
              <span className="font-medium">Shipped:</span>{" "}
              {new Date(order.shipment.shippedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
      <div className="card divide-y">
        {order.items.map((item) => (
          <div key={item.id} className="flex flex-wrap justify-between gap-2 p-4">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-slate-500">
                SKU {item.sku} × {item.quantity}
              </p>
              {order.paymentStatus === "PAID" && item.productId && (
                <ReviewForm productId={item.productId} productName={item.name} />
              )}
            </div>
            <p className="font-semibold">{fmt(item.unitPrice)}</p>
          </div>
        ))}
      </div>
      <div className="card space-y-1 p-5 text-sm">
        <Row label="Subtotal" value={fmt(order.subtotal)} />
        <Row label="Discount" value={`−${fmt(order.discount)}`} />
        <Row label="Shipping" value={fmt(order.shipping)} />
        <Row label="Tax" value={fmt(order.tax)} />
        <div className="flex justify-between border-t pt-2 text-lg font-bold">
          <span>Total</span>
          <span className="text-brand">{fmt(order.total)}</span>
        </div>
      </div>
      <Link href="/account/orders" className="text-sm text-brand">
        ← Back to orders
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
