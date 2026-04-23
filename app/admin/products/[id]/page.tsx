import { notFound } from "next/navigation";

import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories, getProductByIdAdmin } from "@/lib/data/queries";

type AdminProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductDetailPage({
  params
}: AdminProductDetailPageProps) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    getCategories(),
    getProductByIdAdmin(id)
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DeleteProductButton
          productId={product.id}
          productName={product.name}
          variant="outline"
        />
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
