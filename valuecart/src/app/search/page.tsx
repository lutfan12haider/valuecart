import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getDisplayRate } from "@/lib/currency";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

const sorts: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  new: { createdAt: "desc" },
  price_asc: { basePrice: "asc" },
  price_desc: { basePrice: "desc" },
  rating: { ratingAvg: "desc" },
  popular: { sold: "desc" }
};

const sortLabels: [string, string][] = [
  ["new", "Newest"],
  ["popular", "Popular"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["rating", "Best rated"]
];

type Params = { q?: string; category?: string; sort?: string; page?: string };

function href(params: Params, changes: Params) {
  const merged = { ...params, ...changes };
  const qs = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  return `/search?${qs.toString()}`;
}

export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const q = searchParams.q?.trim().slice(0, 100);
  const category = searchParams.category;
  const sort = searchParams.sort && sorts[searchParams.sort] ? searchParams.sort : "new";
  const page = Math.max(1, Number(searchParams.page) || 1);

  const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }];
  if (category) {
    and.push({ OR: [{ category: { slug: category } }, { category: { parent: { slug: category } } }] });
  }
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } }
      ]
    });
  }
  const where: Prisma.ProductWhereInput = { AND: and };

  const [products, total, categories, rate, current] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: sorts[sort],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }
    }),
    db.product.count({ where }),
    db.category.findMany({ where: { active: true, parentId: null }, orderBy: { sortOrder: "asc" } }),
    getDisplayRate(),
    category ? db.category.findUnique({ where: { slug: category } }) : null
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const title = current?.name ?? (q ? `Results for "${q}"` : "All products");

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2">
        <h2 className="font-bold">Categories</h2>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          <Link href={href(searchParams, { category: undefined, page: undefined })} className={`rounded-lg border px-3 py-1.5 text-sm ${!category ? "border-brand bg-brand-light" : "bg-white"}`}>
            All
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={href(searchParams, { category: c.slug, page: undefined })} className={`rounded-lg border px-3 py-1.5 text-sm ${category === c.slug ? "border-brand bg-brand-light" : "bg-white"}`}>
              {c.name}
            </Link>
          ))}
        </div>
      </aside>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-slate-500">{total} products</p>
          </div>
          <div className="flex flex-wrap gap-1 text-xs">
            {sortLabels.map(([key, label]) => (
              <Link key={key} href={href(searchParams, { sort: key, page: undefined })} className={`rounded-full border px-3 py-1 ${sort === key ? "border-brand bg-brand-light" : "bg-white"}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <p className="card p-8 text-center text-slate-500">No products found. Try a different search or category.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} rate={rate} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4 text-sm">
            {page > 1 && <Link className="btn" href={href(searchParams, { page: String(page - 1) })}>Previous</Link>}
            <span>Page {page} of {pages}</span>
            {page < pages && <Link className="btn" href={href(searchParams, { page: String(page + 1) })}>Next</Link>}
          </div>
        )}
      </section>
    </div>
  );
}
