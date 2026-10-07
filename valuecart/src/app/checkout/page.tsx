import { redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { getUser } from "@/lib/auth";
import { resolveCart } from "@/lib/cart";
import { getCheckoutSummary } from "@/lib/checkout-summary";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await resolveCart();
  if (!cart.items.length) redirect("/cart");

  const user = await getUser();
  const summary = await getCheckoutSummary(undefined, "United States");

  let defaults = {};
  if (user) {
    const profile = await db.user.findUnique({ where: { id: user.id } });
    const address = await db.address.findFirst({ where: { userId: user.id, isDefault: true } });
    defaults = {
      email: profile?.email,
      phone: profile?.phone ?? address?.phone,
      shipFullName: address?.fullName ?? profile?.name,
      shipCountry: address?.country,
      shipState: address?.state,
      shipCity: address?.city,
      shipLine1: address?.line1,
      shipPostalCode: address?.postalCode
    };
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <CheckoutForm summary={summary} defaults={defaults} />
    </div>
  );
}
