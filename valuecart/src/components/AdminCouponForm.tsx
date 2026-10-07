"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminCouponForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: fd.get("code"),
        type: fd.get("type"),
        value: Number(fd.get("value")),
        minOrder: fd.get("minOrder") ? Number(fd.get("minOrder")) : undefined,
        usageLimit: fd.get("usageLimit") ? Number(fd.get("usageLimit")) : undefined,
        active: true
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed.");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-4 sm:grid-cols-2">
      <input name="code" placeholder="CODE" required className="rounded-lg border px-3 py-2 text-sm uppercase" />
      <select name="type" className="rounded-lg border px-3 py-2 text-sm" defaultValue="PERCENTAGE">
        <option value="PERCENTAGE">Percentage</option>
        <option value="FIXED">Fixed amount</option>
      </select>
      <input name="value" type="number" step="0.01" placeholder="Value" required className="rounded-lg border px-3 py-2 text-sm" />
      <input name="minOrder" type="number" step="0.01" placeholder="Min order (optional)" className="rounded-lg border px-3 py-2 text-sm" />
      <input name="usageLimit" type="number" placeholder="Usage limit (optional)" className="rounded-lg border px-3 py-2 text-sm" />
      <button type="submit" className="btn sm:col-span-2">
        Create coupon
      </button>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </form>
  );
}
