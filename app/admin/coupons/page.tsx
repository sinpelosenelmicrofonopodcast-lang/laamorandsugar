import { CouponManager } from "@/components/admin/coupon-manager";
import { getCoupons, getNewsletterSubscribers } from "@/lib/data/queries";

export default async function AdminCouponsPage() {
  const [coupons, newsletterSubscribers] = await Promise.all([
    getCoupons(),
    getNewsletterSubscribers()
  ]);

  return <CouponManager coupons={coupons} newsletterSubscribers={newsletterSubscribers} />;
}
