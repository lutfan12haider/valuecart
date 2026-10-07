import Link from "next/link";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

const name = process.env.NEXT_PUBLIC_STORE_NAME ?? "ValueCart";

async function getCartCount() {
  const user = await getUser();

  if (user) {
    const result = await db.cartItem.aggregate({
      where: { cart: { userId: user.id } },
      _sum: { quantity: true }
    });
    return result._sum.quantity ?? 0;
  }

  const token = cookies().get("vc_cart")?.value;
  if (!token) return 0;

  const result = await db.cartItem.aggregate({
    where: { cart: { token } },
    _sum: { quantity: true }
  });
  return result._sum.quantity ?? 0;
}

export default async function SiteHeader() {
  const [user, count] = await Promise.all([getUser(), getCartCount()]);

  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 text-xl font-extrabold text-brand">
          {name}
        </Link>
        <form action="/search" className="hidden flex-1 sm:block">
          <input
            name="q"
            placeholder="Search products, brands, SKU..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </form>
        <nav className="ml-auto flex items-center gap-3 text-sm font-medium sm:gap-4">
          <Link href="/search" className="sm:hidden">
            Search
          </Link>
          <Link href="/cart" className="relative">
            Cart
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-slate-900">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link href="/account" className="hidden sm:block">
                Hi, {user.name.split(" ")[0]}
              </Link>
              {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                <Link href="/admin" className="text-brand">
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link href="/login">Account</Link>
          )}
        </nav>
      </div>
      <div className="border-t bg-slate-50 px-4 py-2 sm:hidden">
        <form action="/search">
          <input
            name="q"
            placeholder="Search..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </form>
      </div>
    </header>
  );
}
