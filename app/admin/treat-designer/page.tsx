import { TreatDesignerManager } from "@/components/admin/treat-designer-manager";
import { getTreatDesignerAdminConfig, getTreatDesignerOrders } from "@/lib/data/queries";

export default async function AdminTreatDesignerPage() {
  const [config, orders] = await Promise.all([
    getTreatDesignerAdminConfig(),
    getTreatDesignerOrders()
  ]);

  return <TreatDesignerManager config={config} orders={orders} />;
}
