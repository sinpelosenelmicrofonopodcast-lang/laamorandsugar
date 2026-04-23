import { CustomOrdersManager } from "@/components/admin/custom-orders-manager";
import { getCustomOrders } from "@/lib/data/queries";

export default async function AdminCustomOrdersPage() {
  const orders = await getCustomOrders();

  return <CustomOrdersManager orders={orders} />;
}
