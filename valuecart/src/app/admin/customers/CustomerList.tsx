"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  disabled: boolean;
  createdAt: Date;
  _count: { orders: number };
};

export default function CustomerList({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(id: string, disabled: boolean) {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled })
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Action failed."); return; }
    router.refresh();
  }

  if (!customers.length) {
    return <p className="card p-8 text-center text-slate-500">No customers found.</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="card divide-y">
        {customers.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div>
              <p className={`font-medium ${c.disabled ? "text-slate-400 line-through" : ""}`}>{c.name}</p>
              <p className="text-slate-600">{c.email}</p>
              <p className="text-slate-500">
                {c._count.orders} order(s) · Joined {new Date(c.createdAt).toLocaleDateString()}
                {c.phone && ` · ${c.phone}`}
              </p>
            </div>
            <button
              type="button"
              disabled={busy === c.id}
              onClick={() => toggle(c.id, !c.disabled)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                c.disabled
                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              {busy === c.id ? "…" : c.disabled ? "Enable account" : "Disable account"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
