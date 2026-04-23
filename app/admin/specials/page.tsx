import { SpecialsManager } from "@/components/admin/specials-manager";
import { getSeasonalSpecials } from "@/lib/data/queries";

export default async function AdminSpecialsPage() {
  const specials = await getSeasonalSpecials();

  return <SpecialsManager specials={specials} />;
}
