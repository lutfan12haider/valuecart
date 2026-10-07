import { notFound } from "next/navigation";
import AdminProductForm from "@/components/AdminProductForm";
import ProductImageManager from "@/components/ProductImageManager";
import ProductVariantManager from "@/components/ProductVariantManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { id: "asc" } }
      }
    }),
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit product</h1>
      <AdminProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          shortDescription: product.shortDescription,
          description: product.description,
          shippingInfo: product.shippingInfo,
          categoryId: product.categoryId,
          basePrice: Number(product.basePrice),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          stock: product.stock,
          brand: product.brand,
          status: product.status,
          featured: product.featured
        }}
      />
      <ProductImageManager productId={product.id} images={product.images} />
      <ProductVariantManager
        productId={product.id}
        productSku={product.sku}
        variants={product.variants}
      />
    </div>
  );
}
