"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { id: string; name: string; sku: string; stock: number; status: string; lowStockAt: number };

export default function InventoryEditor({ products }: { products: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function save(id: string, stock: number) {
    setBusy(id);
    await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, stock })
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Product</th>
            <th className="p-3">SKU</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Status</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <InventoryRow key={p.id} product={p} busy={busy === p.id} onSave={save} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryRow({
  product,
  busy,
  onSave
}: {
  product: Row;
  busy: boolean;
  onSave: (id: string, stock: number) => void;
}) {
  const [stock, setStock] = useState(product.stock);
  const low = stock <= product.lowStockAt;
  return (
    <tr className={`border-b ${low ? "bg-amber-50" : ""}`}>
      <td className="p-3 font-medium">{product.name}</td>
      <td className="p-3">{product.sku}</td>
      <td className="p-3">
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="w-24 rounded border px-2 py-1"
        />
      </td>
      <td className="p-3">{product.status}</td>
      <td className="p-3">
        <button type="button" disabled={busy} onClick={() => onSave(product.id, stock)} className="text-sm text-brand">
          {busy ? "…" : "Save"}
        </button>
      </td>
    </tr>
  );
}
