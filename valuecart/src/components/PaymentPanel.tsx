"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUsdt } from "@/lib/currency";

export default function PaymentPanel({
  orderId,
  orderNumber,
  total,
  currency
}: {
  orderId: string;
  orderNumber: string;
  total: number;
  currency: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function pay(outcome: "success" | "failed" | "pending") {
    setMessage(null);
    setLoading(outcome);
    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, mockOutcome: outcome })
    });
    const data = await res.json().catch(() => ({}));
    setLoading(null);

    if (res.ok && data.status === "PAID") {
      router.push(`/account/orders/${orderId}?paid=1`);
      return;
    }
    if (res.ok && data.status === "PENDING") {
      setMessage("Payment is pending confirmation. You can check your order status in your account.");
      return;
    }
    setMessage(
      data.error ??
        "Payment could not be completed. Please try again or use another payment method."
    );
  }

  return (
    <div className="card mx-auto max-w-lg space-y-4 p-6">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <strong>Development mock payment.</strong> No real money is charged. A future payment provider will replace this
        flow.
      </p>
      <h1 className="text-xl font-bold">Pay for order {orderNumber}</h1>
      <p className="text-2xl font-extrabold text-brand">
        {formatUsdt(total)} <span className="text-sm font-normal text-slate-500">({currency} display)</span>
      </p>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <div className="grid gap-2">
        <button type="button" disabled={!!loading} onClick={() => pay("success")} className="btn w-full">
          {loading === "success" ? "Processing…" : "Pay (mock success)"}
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => pay("failed")}
          className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
        >
          Simulate payment failure
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => pay("pending")}
          className="w-full rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          Simulate pending payment
        </button>
      </div>
      <Link href={`/account/orders/${orderId}`} className="block text-center text-sm text-brand">
        View order details
      </Link>
    </div>
  );
}
