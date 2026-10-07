"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductImage = { id: string; url: string; alt: string; sortOrder: number };

export default function ProductImageManager({
  productId,
  images
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), alt: alt.trim(), sortOrder: images.length })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not add image."); return; }
    setUrl("");
    setAlt("");
    router.refresh();
  }

  async function remove(imageId: string) {
    setBusy(imageId);
    const res = await fetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, {
      method: "DELETE"
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Could not delete image."); return; }
    router.refresh();
  }

  return (
    <div className="card space-y-4 p-5">
      <h2 className="text-base font-bold">Product Images</h2>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || "Product image"}
                className="aspect-square w-full rounded-lg border object-cover"
              />
              <button
                type="button"
                disabled={busy === img.id}
                onClick={() => remove(img.id)}
                className="absolute right-1 top-1 hidden rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white group-hover:flex"
              >
                ✕
              </button>
              <p className="mt-1 truncate text-xs text-slate-500">#{img.sortOrder}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="space-y-2">
        <p className="text-sm font-medium">Add image URL</p>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            required
            type="url"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Alt text (optional)"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn text-sm">Add image</button>
      </form>
    </div>
  );
}
