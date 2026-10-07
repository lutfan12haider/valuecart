import AdminProductForm from "@/components/AdminProductForm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New product</h1>
      <AdminProductForm categories={categories} />
    </div>
  );
}
