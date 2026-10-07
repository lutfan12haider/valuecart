"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  parentId: string | null;
  _count: { products: number };
};

export default function CategoryManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        slug: fd.get("slug"),
        sortOrder: Number(fd.get("sortOrder") || 0),
        active: fd.get("active") === "on"
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Failed to create category."); return; }
    e.currentTarget.reset();
    router.refresh();
  }

  async function toggle(id: string, active: boolean) {
    setBusy(id);
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active })
    });
    setBusy(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    setBusy(id);
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Could not delete."); return; }
    router.refresh();
  }

  const slugify = (s: string) =>
    s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form onSubmit={create} className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="col-span-full text-base font-bold">Add category</h2>
        <label className="block text-sm">
          <span className="font-medium">Name</span>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            onChange={(e) => {
              const slugField = e.currentTarget.form?.querySelector<HTMLInputElement>('[name="slug"]');
              if (slugField && !slugField.dataset.edited) slugField.value = slugify(e.target.value);
            }}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Slug</span>
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
            onInput={(e) => { (e.currentTarget.dataset.edited = "1"); }}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Sort order</span>
          <input name="sortOrder" type="number" min={0} defaultValue={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" name="active" defaultChecked /> Active
        </label>
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn col-span-full sm:col-span-1">Add category</button>
      </form>

      {/* List */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Products</th>
              <th className="p-3">Order</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {initial.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs text-slate-500">{c.slug}</td>
                <td className="p-3">{c._count.products}</td>
                <td className="p-3">{c.sortOrder}</td>
                <td className="p-3">
                  <button
                    type="button"
                    disabled={busy === c.id}
                    onClick={() => toggle(c.id, !c.active)}
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    disabled={busy === c.id || c._count.products > 0}
                    onClick={() => remove(c.id)}
                    className="text-xs text-red-600 disabled:opacity-40"
                    title={c._count.products > 0 ? "Has products — cannot delete" : "Delete"}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
