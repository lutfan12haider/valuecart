"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Review = {
  id: string;
  rating: number;
  body: string;
  approved: boolean;
  createdAt: Date;
  user: { name: string; email: string };
  product: { name: string; slug: string };
};

export default function ReviewModerator({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setBusy(id);
    await fetch(`/api/admin/reviews?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true })
    });
    setBusy(null);
    router.refresh();
  }

  async function reject(id: string) {
    setBusy(id);
    await fetch(`/api/admin/reviews?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false })
    });
    setBusy(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    setBusy(id);
    const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Delete failed."); return; }
    router.refresh();
  }

  if (!reviews.length) {
    return <p className="card p-8 text-center text-slate-500">No reviews found.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {reviews.map((r) => (
        <div key={r.id} className="card p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <p>
                <Link href={`/products/${r.product.slug}`} className="font-semibold text-brand">
                  {r.product.name}
                </Link>
              </p>
              <p className="text-slate-500">
                {r.user.name} · {r.user.email} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
              <p>
                {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}{" "}
                <span className={r.approved ? "text-green-600" : "text-amber-600"}>
                  {r.approved ? "Approved" : "Pending"}
                </span>
              </p>
              <p className="text-slate-700">{r.body}</p>
            </div>
            <div className="flex gap-2">
              {!r.approved && (
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => approve(r.id)}
                  className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700"
                >
                  Approve
                </button>
              )}
              {r.approved && (
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => reject(r.id)}
                  className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
                >
                  Unapprove
                </button>
              )}
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => remove(r.id)}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
