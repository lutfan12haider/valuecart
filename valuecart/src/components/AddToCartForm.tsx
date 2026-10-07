"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  productId: string;
  variantId?: string;
  maxQuantity: number;
  disabled?: boolean;
};

export default function AddToCartForm({ productId, variantId, maxQuantity, disabled }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(buyNow: boolean) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity: qty })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not add to cart.");
        return;
      }
      router.refresh();
      if (buyNow) router.push("/checkout");
    } finally {
      setLoading(false);
    }
  }

  if (disabled || maxQuantity < 1) {
    return <p className="text-sm font-medium text-red-500">Out of stock — purchasing disabled.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium" htmlFor="qty">
          Quantity
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          max={maxQuantity}
          value={qty}
          onChange={(e) => setQty(Math.min(maxQuantity, Math.max(1, Number(e.target.value) || 1)))}
          className="w-20 rounded-lg border px-2 py-1.5 text-sm"
        />
        <span className="text-xs text-slate-500">{maxQuantity} available</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={loading} onClick={() => add(false)} className="btn flex-1">
          {loading ? "Adding…" : "Add to cart"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => add(true)}
          className="inline-flex flex-1 items-center justify-center rounded-lg border-2 border-brand bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light"
        >
          Buy now
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
