import { db } from "@/lib/db";
import CategoryManager from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <CategoryManager initial={categories} />
    </div>
  );
}
