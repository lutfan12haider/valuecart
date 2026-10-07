"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  line1: string;
  postalCode: string;
  isDefault: boolean;
};

export default function AddressManager({ initial }: { initial: Address[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries()) as Record<string, string>;
    body.isDefault = fd.get("isDefault") === "on" ? "true" : "false";
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        isDefault: body.isDefault === "true"
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save address.");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {initial.map((a) => (
        <div key={a.id} className="card p-4 text-sm">
          <p className="font-medium">{a.fullName}</p>
          <p>{a.line1}</p>
          <p>
            {a.city}, {a.state} {a.postalCode}
          </p>
          <p>{a.country}</p>
          <p className="text-slate-500">{a.phone}</p>
          <button type="button" onClick={() => remove(a.id)} className="mt-2 text-xs text-red-600">
            Delete
          </button>
        </div>
      ))}
      <form onSubmit={add} className="card space-y-3 p-4">
        <h2 className="font-bold">Add address</h2>
        <Input name="fullName" label="Full name" required />
        <Input name="phone" label="Phone" required />
        <Input name="line1" label="Address" required />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input name="city" label="City" required />
          <Input name="state" label="State" />
          <Input name="postalCode" label="Postal code" required />
          <Input name="country" label="Country" required defaultValue="United States" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isDefault" /> Default address
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn">
          Save address
        </button>
      </form>
    </div>
  );
}

function Input({
  name,
  label,
  required,
  defaultValue
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} required={required} defaultValue={defaultValue} className="mt-1 w-full rounded-lg border px-3 py-2" />
    </label>
  );
}
