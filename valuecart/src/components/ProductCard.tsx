import Link from "next/link";
import { formatUsdt, toDisplay } from "@/lib/currency";

type Props = {
  rate: number;
  product: {
    slug: string;
    name: string;
    basePrice: unknown;
    salePrice: unknown;
    stock: number;
    reserved: number;
    ratingAvg: number;
    ratingCount: number;
    images: { url: string; alt: string }[];
  };
};

export default function ProductCard({ product: p, rate }: Props) {
  const base = toDisplay(Number(p.basePrice), rate);
  const sale = p.salePrice ? toDisplay(Number(p.salePrice), rate) : null;
  const price = sale ?? base;
  const off = sale ? Math.round(((base - sale) / base) * 100) : 0;
  const inStock = p.stock - p.reserved > 0;

  return (
    <Link href={`/products/${p.slug}`} className="card relative overflow-hidden">
      {off > 0 && (
        <span className="absolute left-2 top-2 rounded bg-accent px-2 py-0.5 text-xs font-bold">-{off}%</span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.images[0]?.url}
        alt={p.images[0]?.alt || p.name}
        loading="lazy"
        className="aspect-square w-full object-cover"
      />
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
        <p className="font-bold text-brand">{formatUsdt(price)}</p>
        {sale && <p className="text-xs text-slate-400 line-through">{formatUsdt(base)}</p>}
        <p className="text-xs text-slate-500">
          {p.ratingCount > 0 ? `${p.ratingAvg.toFixed(1)} (${p.ratingCount})` : "No reviews yet"}
        </p>
        <p className={`text-xs font-medium ${inStock ? "text-green-600" : "text-red-500"}`}>
          {inStock ? "In stock" : "Out of stock"}
        </p>
      </div>
    </Link>
  );
}
