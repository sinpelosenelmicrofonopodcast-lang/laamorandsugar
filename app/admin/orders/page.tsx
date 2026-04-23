import { OrdersManager } from "@/components/admin/orders-manager";
import { getOrders } from "@/lib/data/queries";

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return <OrdersManager orders={orders} />;
}
