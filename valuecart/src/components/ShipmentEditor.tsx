"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Shipment = {
  courier: string | null;
  trackingNo: string | null;
  trackingUrl: string | null;
  shippedAt: Date | null;
} | null;

export default function ShipmentEditor({
  orderId,
  shipment
}: {
  orderId: string;
  shipment: Shipment;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courier: fd.get("courier") || null,
        trackingNo: fd.get("trackingNo") || null,
        trackingUrl: fd.get("trackingUrl") || null,
        shippedAt: fd.get("shippedAt") ? new Date(fd.get("shippedAt") as string).toISOString() : null
      })
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Shipment saved." : data.error ?? "Save failed.");
    if (res.ok) router.refresh();
  }

  const fmt = (d: Date | null) =>
    d ? new Date(d).toISOString().slice(0, 16) : "";

  return (
    <div className="card space-y-3 p-4">
      <h2 className="font-bold">Shipment &amp; Tracking</h2>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Courier</span>
          <input name="courier" defaultValue={shipment?.courier ?? ""} placeholder="e.g. DHL, FedEx" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Tracking number</span>
          <input name="trackingNo" defaultValue={shipment?.trackingNo ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Tracking URL</span>
          <input name="trackingUrl" type="url" defaultValue={shipment?.trackingUrl ?? ""} placeholder="https://..." className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Shipped at</span>
          <input name="shippedAt" type="datetime-local" defaultValue={fmt(shipment?.shippedAt ?? null)} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={loading} className="btn">
            {loading ? "Saving…" : "Save shipment"}
          </button>
        </div>
        {msg && (
          <p className={`sm:col-span-2 text-sm ${msg === "Shipment saved." ? "text-green-600" : "text-red-600"}`}>
            {msg}
          </p>
        )}
      </form>
    </div>
  );
}
