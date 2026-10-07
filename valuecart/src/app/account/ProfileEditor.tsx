"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { name: string; phone: string | null };

export default function ProfileEditor({ name, phone }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get("name"), phone: fd.get("phone") || undefined })
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Update failed."); return; }
    setSuccess(true);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="text-sm text-brand">
        Edit profile
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t pt-4">
      <label className="block text-sm">
        <span className="font-medium">Name</span>
        <input name="name" required defaultValue={name} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Phone</span>
        <input name="phone" defaultValue={phone ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile updated.</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn">{loading ? "Saving…" : "Save"}</button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
      </div>
    </form>
  );
}
