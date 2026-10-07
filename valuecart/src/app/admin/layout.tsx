import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login?next=/admin");

  const links = [
    ["Dashboard", "/admin"],
    ["Products", "/admin/products"],
    ["Categories", "/admin/categories"],
    ["Orders", "/admin/orders"],
    ["Inventory", "/admin/inventory"],
    ["Customers", "/admin/customers"],
    ["Coupons", "/admin/coupons"],
    ["Reviews", "/admin/reviews"]
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <aside className="card h-fit space-y-1 p-3 text-sm">
        <p className="px-2 pb-2 font-bold text-brand">Admin</p>
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="block rounded-lg px-2 py-1.5 hover:bg-brand-light">
            {label}
          </Link>
        ))}
        <Link href="/" className="block px-2 pt-3 text-slate-500">
          ← Storefront
        </Link>
      </aside>
      <div>{children}</div>
    </div>
  );
}
