import InventoryEditor from "@/components/InventoryEditor";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({ searchParams }: { searchParams: { low?: string } }) {
  const lowOnly = searchParams.low === "1";
  const products = await db.product.findMany({
    where: lowOnly ? { stock: { lte: 5 }, status: { not: "DISABLED" } } : {},
    orderBy: { stock: "asc" },
    take: 200,
    select: { id: true, name: true, sku: true, stock: true, status: true, lowStockAt: true }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <a href={lowOnly ? "/admin/inventory" : "/admin/inventory?low=1"} className="text-sm text-brand">
          {lowOnly ? "Show all" : "Low stock only"}
        </a>
      </div>
      <InventoryEditor products={products} />
    </div>
  );
}
