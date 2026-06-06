import { SocialPostManager } from "@/components/admin/social-post-manager";
import { getSocialPostManagerData } from "@/lib/data/queries";

export default async function AdminSocialPostsPage() {
  const data = await getSocialPostManagerData();

  return <SocialPostManager {...data} />;
}
