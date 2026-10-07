"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Category = { id: string; name: string };

export default function AdminProductForm({
  categories,
  product
}: {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    shortDescription: string | null;
    description: string;
    shippingInfo: string | null;
    categoryId: string;
    basePrice: number;
    salePrice: number | null;
    stock: number;
    brand: string | null;
    status: string;
    featured: boolean;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"),
      slug: fd.get("slug"),
      sku: fd.get("sku"),
      shortDescription: fd.get("shortDescription") || null,
      description: fd.get("description"),
      shippingInfo: fd.get("shippingInfo") || null,
      categoryId: fd.get("categoryId"),
      basePrice: Number(fd.get("basePrice")),
      salePrice: fd.get("salePrice") ? Number(fd.get("salePrice")) : null,
      stock: Number(fd.get("stock")),
      brand: fd.get("brand") || null,
      status: fd.get("status"),
      featured: fd.get("featured") === "on"
    };
    const url = product ? `/api/admin/products/${product.id}` : "/api/products";
    const method = product ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Save failed.");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Name" defaultValue={product?.name} required className="sm:col-span-2" />
        <Field name="slug" label="Slug" defaultValue={product?.slug} required disabled={!!product} />
        <Field name="sku" label="SKU" defaultValue={product?.sku} required disabled={!!product} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Category</span>
          <select name="categoryId" defaultValue={product?.categoryId} className="mt-1 w-full rounded-lg border px-3 py-2" required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <Field name="brand" label="Brand" defaultValue={product?.brand ?? ""} />
        <Field name="stock" label="Stock" type="number" defaultValue={product?.stock ?? 0} required />
        <Field name="basePrice" label="Base price (USDT)" type="number" defaultValue={product?.basePrice} required />
        <Field name="salePrice" label="Sale price (USDT)" type="number" defaultValue={product?.salePrice ?? ""} />
        <label className="block text-sm">
          <span className="font-medium">Status</span>
          <select name="status" defaultValue={product?.status ?? "DRAFT"} className="mt-1 w-full rounded-lg border px-3 py-2">
            {["DRAFT", "ACTIVE", "OUT_OF_STOCK", "DISABLED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" name="featured" defaultChecked={product?.featured} /> Featured product
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium">Short description</span>
        <span className="ml-1 text-xs text-slate-400">(shown under product title)</span>
        <input name="shortDescription" defaultValue={product?.shortDescription ?? ""} maxLength={300} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Full description</span>
        <textarea name="description" required defaultValue={product?.description} rows={6} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Shipping info</span>
        <span className="ml-1 text-xs text-slate-400">(overrides default shipping message on product page)</span>
        <input name="shippingInfo" defaultValue={product?.shippingInfo ?? ""} placeholder="e.g. Ships in 3–5 days." className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn">
        {loading ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}

function Field({ name, label, type = "text", defaultValue, required, disabled, className }: {
  name: string; label: string; type?: string; defaultValue?: string | number | null;
  required?: boolean; disabled?: boolean; className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="font-medium">{label}</span>
      <input name={name} type={type} required={required} disabled={disabled}
        defaultValue={defaultValue ?? undefined}
        className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100" />
    </label>
  );
}
