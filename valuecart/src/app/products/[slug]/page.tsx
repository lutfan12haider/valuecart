import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatUsdt, getDisplayRate, toDisplay } from "@/lib/currency";
import ProductCard from "@/components/ProductCard";
import ProductActions from "@/components/ProductActions";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: true, variants: true }
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.seoTitle ?? p.name,
    description: p.seoDesc ?? p.shortDescription ?? undefined,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.seoTitle ?? p.name, images: p.images[0] ? [p.images[0].url] : [] }
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();

  const [rate, related] = await Promise.all([
    getDisplayRate(),
    db.product.findMany({
      where: { status: "ACTIVE", categoryId: p.categoryId, id: { not: p.id } },
      take: 6,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }
    })
  ]);

  const base = toDisplay(Number(p.basePrice), rate);
  const sale = p.salePrice ? toDisplay(Number(p.salePrice), rate) : null;
  const off = sale ? Math.round(((base - sale) / base) * 100) : 0;
  const available = p.stock - p.reserved;
  const specs =
    p.specifications && typeof p.specifications === "object" && !Array.isArray(p.specifications)
      ? Object.entries(p.specifications as Record<string, unknown>)
      : [];

  return (
    <div className="space-y-10">
      <nav className="text-sm text-slate-500">
        <Link href="/">Home</Link> / <Link href={`/search?category=${p.category.slug}`}>{p.category.name}</Link> / {p.name}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.images[0]?.url} alt={p.images[0]?.alt || p.name} className="aspect-square w-full rounded-xl border object-cover" />
          {p.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {p.images.slice(1, 6).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt={img.alt} loading="lazy" className="aspect-square rounded-lg border object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <p className="text-sm text-slate-500">
            {p.brand && <>Brand: {p.brand} | </>}SKU: {p.sku}
          </p>
          <p className="text-sm text-slate-500">
            {p.ratingCount > 0 ? `${p.ratingAvg.toFixed(1)} / 5 (${p.ratingCount} reviews)` : "No reviews yet"}
          </p>
          {sale && (
            <div className="flex items-baseline gap-3">
              <span className="text-slate-400 line-through text-base">{formatUsdt(base)}</span>
              <span className="rounded bg-accent px-2 py-0.5 text-xs font-bold">-{off}%</span>
            </div>
          )}
          <p className={`font-medium ${available > 0 ? "text-green-600" : "text-red-500"}`}>
            {available > 0 ? (available <= p.lowStockAt ? `Only ${available} left` : "In stock") : "Out of stock"}
          </p>
          {p.shortDescription && <p className="text-slate-700">{p.shortDescription}</p>}
          <p className="text-sm text-slate-500">{p.shippingInfo ?? "Worldwide shipping. Delivery in 7 to 21 days."}</p>
          <ProductActions
            productId={p.id}
            basePrice={base}
            salePrice={sale}
            productStock={p.stock}
            productReserved={p.reserved}
            variants={p.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              options: v.options,
              basePrice: v.basePrice ? toDisplay(Number(v.basePrice), rate) : null,
              stock: v.stock,
              reserved: v.reserved
            }))}
          />
        </div>
      </div>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Description</h2>
        <p className="whitespace-pre-line text-slate-700">{p.description}</p>
        {specs.length > 0 && (
          <>
            <h2 className="pt-3 text-lg font-bold">Specifications</h2>
            <dl className="grid gap-1 text-sm sm:grid-cols-2">
              {specs.map(([k, v]) => (
                <div key={k} className="flex gap-2 border-b py-1">
                  <dt className="font-medium">{k}:</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Related Products</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} rate={rate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
