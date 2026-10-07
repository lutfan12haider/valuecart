import { notFound } from "next/navigation";
import type { Metadata } from "next";

const pages: Record<string, { title: string; body: string }> = {
  "shipping-policy": {
    title: "Shipping Policy",
    body: `We ship worldwide. Standard delivery takes 7–21 business days depending on your location.

Orders are processed within 1–3 business days after payment is confirmed. You will receive a tracking number once your order has shipped.

Shipping charges are calculated at checkout based on your destination and order total. Orders above a certain threshold qualify for free shipping.

We are not responsible for customs duties or import taxes that may apply in your country. These fees are the buyer's responsibility.

If your package is delayed or lost in transit, please contact us and we will work with the courier to resolve the issue.`
  },
  "return-refund-policy": {
    title: "Return and Refund Policy",
    body: `We want you to be completely satisfied with your purchase.

If you receive a damaged, defective, or incorrect item, please contact us within 7 days of delivery with photos of the issue. We will arrange a replacement or full refund.

For change-of-mind returns, items must be unused, in original packaging, and returned within 14 days. Return shipping costs are the buyer's responsibility unless the item was faulty.

Refunds are processed within 5–10 business days after we receive and inspect the returned item. The refund will be issued to your original payment method.

Digital products and perishable goods are not eligible for returns.

To initiate a return, please contact us through our contact page with your order number.`
  },
  "privacy-policy": {
    title: "Privacy Policy",
    body: `Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.

Information we collect: name, email address, phone number, shipping address, and order history. We collect this information when you create an account or place an order.

How we use your information: to process and fulfil your orders, send order confirmations and updates, provide customer support, and improve our services.

We do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers who assist us in operating our website and fulfilling orders.

We use secure connections (HTTPS) to protect data in transit. Passwords are stored as irreversible hashes and never in plain text.

We do not store payment card numbers, CVVs, or bank credentials. All payment processing is handled by our payment provider.

You may request deletion of your account and personal data by contacting us.`
  },
  "about-us": {
    title: "About Us",
    body: `Welcome to ValueCart — your destination for quality products at honest prices.

We are a multi-category marketplace offering genuine physical products across bikes, electronics, home accessories, clothing, tools, kitchen goods, automotive accessories, sports equipment, and more.

Our mission is simple: bring you real products at fair prices with straightforward shipping and genuine customer support.

We believe shopping should be transparent. Prices are clearly displayed, policies are easy to find, and we stand behind everything we sell.

If you have any questions about our products or services, do not hesitate to reach out through our contact page.`
  },
  faq: {
    title: "Frequently Asked Questions",
    body: `How long does shipping take?
Standard worldwide shipping takes 7–21 business days. Processing takes 1–3 business days after payment confirmation.

What currency are prices shown in?
Prices are displayed in USDT for consistency. Your payment will be handled by our payment provider at checkout.

Can I track my order?
Yes. Once your order ships you will receive a tracking number via email.

What if my item arrives damaged?
Contact us within 7 days with photos. We will arrange a replacement or refund promptly.

Can I cancel my order?
Orders can be cancelled before they are shipped. Contact us as soon as possible if you need to cancel.

Do you accept returns?
Yes, for most items within 14 days of delivery if unused and in original packaging. See our Return and Refund Policy for details.

How do I create an account?
Click "Account" in the header and choose "Create an account". An account lets you track orders, save addresses, and leave reviews.

I forgot my password. What do I do?
Contact us through the contact page with your registered email and we will assist you.`
  }
};

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = pages[params.slug];
  if (!page) return { title: "Page not found" };
  return { title: page.title };
}

export default function StaticPage({ params }: Props) {
  const page = pages[params.slug];
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <h1 className="text-2xl font-bold">{page.title}</h1>
      <div className="card p-6 text-sm leading-relaxed text-slate-700">
        {page.body.split("\n\n").map((para, i) => (
          <p key={i} className="mb-4 last:mb-0 whitespace-pre-line">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
