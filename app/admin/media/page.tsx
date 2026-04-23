import { MediaLibrary } from "@/components/admin/media-library";
import { getMediaAssets } from "@/lib/data/queries";

export default async function AdminMediaPage() {
  const assets = await getMediaAssets();

  return <MediaLibrary assets={assets} />;
}
