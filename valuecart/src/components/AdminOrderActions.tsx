"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

export default function AdminOrderActions({ orderId, current }: { orderId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setMsg(res.ok ? "Order updated." : "Update failed.");
    router.refresh();
  }

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <label className="text-sm">
        <span className="font-medium">Order status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block rounded-lg border px-3 py-2">
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={save} className="btn">
        Update status
      </button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
