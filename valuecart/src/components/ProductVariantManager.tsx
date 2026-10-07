"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Variant = {
  id: string;
  sku: string;
  options: unknown;
  basePrice: unknown;
  stock: number;
};

export default function ProductVariantManager({
  productId,
  productSku,
  variants
}: {
  productId: string;
  productSku: string;
  variants: Variant[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [optionRows, setOptionRows] = useState([{ key: "", value: "" }]);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const options: Record<string, string> = {};
    optionRows.forEach((_, i) => {
      const k = fd.get(`optKey_${i}`) as string;
      const v = fd.get(`optVal_${i}`) as string;
      if (k && v) options[k] = v;
    });
    if (Object.keys(options).length === 0) {
      setError("Add at least one option (e.g. Color: Red).");
      return;
    }
    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: fd.get("sku"),
        options,
        basePrice: fd.get("basePrice") ? Number(fd.get("basePrice")) : null,
        stock: Number(fd.get("stock") || 0)
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Failed to create variant."); return; }
    setOptionRows([{ key: "", value: "" }]);
    router.refresh();
  }

  async function remove(variantId: string) {
    if (!confirm("Delete this variant?")) return;
    setBusy(variantId);
    const res = await fetch(`/api/admin/products/${productId}/variants?variantId=${variantId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Could not delete."); return; }
    router.refresh();
  }

  const optStr = (opts: unknown) => {
    if (!opts || typeof opts !== "object") return "—";
    return Object.entries(opts as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(", ");
  };

  return (
    <div className="card space-y-4 p-5">
      <h2 className="text-base font-bold">Variants</h2>

      {variants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-2">Options</th>
                <th className="p-2">SKU</th>
                <th className="p-2">Price</th>
                <th className="p-2">Stock</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b">
                  <td className="p-2 font-medium">{optStr(v.options)}</td>
                  <td className="p-2 font-mono text-xs">{v.sku}</td>
                  <td className="p-2">{v.basePrice ? `${Number(v.basePrice)} USDT` : "—"}</td>
                  <td className="p-2">{v.stock}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      disabled={busy === v.id}
                      onClick={() => remove(v.id)}
                      className="text-xs text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={create} className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">Add variant</p>

        <div className="space-y-2">
          {optionRows.map((_, i) => (
            <div key={i} className="flex gap-2">
              <input
                name={`optKey_${i}`}
                placeholder="Option (e.g. Color)"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              <input
                name={`optVal_${i}`}
                placeholder="Value (e.g. Red)"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOptionRows((r) => [...r, { key: "", value: "" }])}
            className="text-xs text-brand"
          >
            + Add another option
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="block text-sm">
            <span className="font-medium">SKU</span>
            <input
              name="sku"
              required
              defaultValue={`${productSku}-V${variants.length + 1}`}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Price override</span>
            <input name="basePrice" type="number" step="0.01" min="0" placeholder="Optional" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Stock</span>
            <input name="stock" type="number" min="0" defaultValue={0} required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn text-sm">Add variant</button>
      </form>
    </div>
  );
}
