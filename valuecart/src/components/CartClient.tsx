"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUsdt } from "@/lib/currency";

type Item = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  maxQuantity: number;
};

export default function CartClient({
  items,
  subtotal
}: {
  items: Item[];
  subtotal: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function updateQty(itemId: string, quantity: number) {
    setBusy(itemId);
    await fetch("/api/cart/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity })
    });
    setBusy(null);
    router.refresh();
  }

  if (!items.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-600">Your cart is empty.</p>
        <Link href="/search" className="btn mt-4 inline-flex">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card flex gap-4 p-4">
            {item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="h-24 w-24 rounded-lg object-cover" />
            )}
            <div className="flex flex-1 flex-col gap-2">
              <Link href={`/products/${item.slug}`} className="font-medium hover:text-brand">
                {item.name}
              </Link>
              <p className="text-sm text-brand">{formatUsdt(item.unitPrice)}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy === item.id}
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => updateQty(item.id, Math.max(0, item.quantity - 1))}
                >
                  −
                </button>
                <span className="text-sm">{item.quantity}</span>
                <button
                  type="button"
                  disabled={busy === item.id || item.quantity >= item.maxQuantity}
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="ml-auto text-xs text-red-600"
                  onClick={() => updateQty(item.id, 0)}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="font-bold">{formatUsdt(item.lineTotal)}</p>
          </div>
        ))}
      </div>
      <aside className="card h-fit space-y-3 p-5">
        <h2 className="text-lg font-bold">Order summary</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-semibold">{formatUsdt(subtotal)}</span>
        </div>
        <p className="text-xs text-slate-500">Shipping and discounts calculated at checkout.</p>
        <Link href="/checkout" className="btn block w-full text-center">
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
