import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 py-4">
      <h1 className="text-2xl font-bold">Contact Us</h1>
      <p className="text-sm text-slate-600">
        Have a question about your order or a product? Fill out the form below and we will get back
        to you as soon as possible.
      </p>
      <ContactForm />
    </div>
  );
}
