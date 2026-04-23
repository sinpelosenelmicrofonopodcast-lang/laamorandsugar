import { CouponManager } from "@/components/admin/coupon-manager";
import { getCoupons } from "@/lib/data/queries";

export default async function AdminCouponsPage() {
  const coupons = await getCoupons();

  return <CouponManager coupons={coupons} />;
}
