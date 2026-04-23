import { CategoryManager } from "@/components/admin/category-manager";
import { getCategories } from "@/lib/data/queries";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return <CategoryManager categories={categories} />;
}
