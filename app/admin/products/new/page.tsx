import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/data/queries";

export default async function NewProductPage() {
  const categories = await getCategories();

  return <ProductForm categories={categories} />;
}
