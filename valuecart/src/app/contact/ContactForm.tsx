"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate a short delay — a real integration would POST to an email API here
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card p-6 text-center text-sm text-green-700">
        <p className="text-lg font-bold">Message received</p>
        <p className="mt-2 text-slate-600">
          Thank you for reaching out. We will get back to you within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <label className="block text-sm">
        <span className="font-medium">Your name</span>
        <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Email address</span>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Order number (optional)</span>
        <input
          name="order"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="e.g. VC-20261007-ABC123"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          minLength={10}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>
      <button type="submit" disabled={loading} className="btn w-full">
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
