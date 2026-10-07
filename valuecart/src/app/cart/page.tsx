import CartClient from "@/components/CartClient";
import { resolveCart, unitBasePrice } from "@/lib/cart";
import { getDisplayRate, toDisplay } from "@/lib/currency";
import { addMoney, mulMoney, toMoneyNumber } from "@/lib/money";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cart, rate] = await Promise.all([resolveCart(), getDisplayRate()]);
  if (!cart.items.length) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Shopping cart</h1>
        <CartClient items={[]} subtotal={0} />
      </div>
    );
  }

  let subtotal = new Decimal(0);
  const items = cart.items.map((item) => {
    const unit = toMoneyNumber(unitBasePrice(item.product, item.variant));
    const line = toMoneyNumber(mulMoney(unit, item.quantity));
    subtotal = addMoney(subtotal, line);
    return {
      id: item.id,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      quantity: item.quantity,
      unitPrice: toDisplay(unit, rate),
      lineTotal: toDisplay(line, rate),
      maxQuantity: item.product.stock - item.product.reserved
    };
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Shopping cart</h1>
      <CartClient items={items} subtotal={toDisplay(toMoneyNumber(subtotal), rate)} />
    </div>
  );
}
