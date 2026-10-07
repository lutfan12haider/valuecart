import Link from "next/link";
import { db } from "@/lib/db";
import { getDisplayRate, toDisplay, formatUsdt } from "@/lib/currency";

export const revalidate = 60;

export default async function Home() {
  const [categories, products, rate] = await Promise.all([
    db.category.findMany({ where: { active: true, parentId: null }, orderBy: { sortOrder: "asc" }, take: 12 }),
    db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sold: "desc" },
      take: 12,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }
    }),
    getDisplayRate()
  ]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-brand to-teal-500 p-8 text-white sm:p-14">
        <h1 className="max-w-xl text-3xl font-extrabold sm:text-5xl">Great products. Small prices.</h1>
        <p className="mt-3 max-w-lg text-teal-50">Thousands of everyday essentials shipped to your door.</p>
        <Link href="/search" className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 font-bold text-slate-900">
          Shop Now
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Popular Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} href={`/search?category=${c.slug}`} className="card p-4 text-center text-sm font-medium hover:border-brand">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Best Sellers</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {products.map((p) => {
            const price = toDisplay(Number(p.salePrice ?? p.basePrice), rate);
            const old = p.salePrice ? toDisplay(Number(p.basePrice), rate) : null;
            return (
              <Link key={p.id} href={`/products/${p.slug}`} className="card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0]?.url} alt={p.name} loading="lazy" className="aspect-square w-full object-cover" />
                <div className="space-y-1 p-3">
                  <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                  <p className="font-bold text-brand">{formatUsdt(price)}</p>
                  {old && <p className="text-xs text-slate-400 line-through">{formatUsdt(old)}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
