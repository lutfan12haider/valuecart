"use client";

import { useState } from "react";

export default function ReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" className="mt-2 text-xs text-brand" onClick={() => setOpen(true)}>
        Write a review
      </button>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        rating: Number(fd.get("rating")),
        body: fd.get("body")
      })
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Review submitted. Thank you!" : data.error ?? "Could not submit review.");
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg border bg-slate-50 p-3">
      <p className="text-xs font-medium">Review {productName}</p>
      <select name="rating" className="rounded border px-2 py-1 text-sm" defaultValue={5}>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} stars
          </option>
        ))}
      </select>
      <textarea name="body" required minLength={10} rows={3} className="w-full rounded border px-2 py-1 text-sm" placeholder="Your experience..." />
      <button type="submit" className="rounded bg-brand px-3 py-1 text-xs font-semibold text-white">
        Submit
      </button>
      {msg && <p className="text-xs text-slate-600">{msg}</p>}
    </form>
  );
}
