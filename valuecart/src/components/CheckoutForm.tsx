"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUsdt } from "@/lib/currency";

type Summary = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
};

type Defaults = {
  email?: string;
  phone?: string;
  shipFullName?: string;
  shipCountry?: string;
  shipState?: string;
  shipCity?: string;
  shipLine1?: string;
  shipPostalCode?: string;
};

export default function CheckoutForm({
  summary,
  defaults
}: {
  summary: Summary;
  defaults?: Defaults;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries()) as Record<string, string>;
    if (coupon) body.couponCode = coupon;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Checkout failed.");
      return;
    }
    router.push(`/checkout/pay/${data.orderId}`);
  }

  async function validateCoupon() {
    setCouponMsg(null);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon })
    });
    const data = await res.json().catch(() => ({}));
    setCouponMsg(res.ok ? `Coupon applied: −${formatUsdt(data.discount)}` : data.error);
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Shipping details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" name="shipFullName" required defaultValue={defaults?.shipFullName} className="sm:col-span-2" />
          <Field label="Email" name="email" type="email" required defaultValue={defaults?.email} />
          <Field label="Phone" name="phone" required defaultValue={defaults?.phone} />
          <Field label="Country" name="shipCountry" required defaultValue={defaults?.shipCountry ?? "United States"} />
          <Field label="State / region" name="shipState" defaultValue={defaults?.shipState} />
          <Field label="City" name="shipCity" required defaultValue={defaults?.shipCity} />
          <Field label="Address" name="shipLine1" required defaultValue={defaults?.shipLine1} className="sm:col-span-2" />
          <Field label="Postal code" name="shipPostalCode" required defaultValue={defaults?.shipPostalCode} />
        </div>
        <div className="flex gap-2 pt-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Coupon code"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button type="button" onClick={validateCoupon} className="rounded-lg border px-3 py-2 text-sm font-medium">
            Apply
          </button>
        </div>
        {couponMsg && <p className="text-sm text-slate-600">{couponMsg}</p>}
      </div>

      <aside className="card h-fit space-y-2 p-5">
        <h2 className="text-lg font-bold">Order summary</h2>
        <Row label="Subtotal" value={formatUsdt(summary.subtotal)} />
        <Row label="Discount" value={`−${formatUsdt(summary.discount)}`} />
        <Row label="Shipping" value={formatUsdt(summary.shipping)} />
        <Row label="Tax" value={formatUsdt(summary.tax)} />
        <div className="flex justify-between border-t pt-2 text-lg font-bold">
          <span>Total</span>
          <span className="text-brand">{formatUsdt(summary.total)}</span>
        </div>
        <p className="text-xs text-slate-500">Prices shown in USDT for display. Payment currency is handled separately.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn w-full">
          {loading ? "Creating order…" : "Continue to payment"}
        </button>
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  className
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border px-3 py-2"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
