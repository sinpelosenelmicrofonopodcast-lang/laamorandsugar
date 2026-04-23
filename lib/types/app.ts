import type { Database } from "@/lib/types/database";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductVariantRow =
  Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductAddonRow =
  Database["public"]["Tables"]["product_addons"]["Row"];
export type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type TestimonialRow =
  Database["public"]["Tables"]["testimonials"]["Row"];
export type HomepageContentRow =
  Database["public"]["Tables"]["homepage_content"]["Row"];
export type SeasonalSpecialRow =
  Database["public"]["Tables"]["seasonal_specials"]["Row"];
export type SiteSettingsRow =
  Database["public"]["Tables"]["site_settings"]["Row"];
export type MediaAssetRow = Database["public"]["Tables"]["media_assets"]["Row"];
export type CustomOrderRow =
  Database["public"]["Tables"]["custom_orders"]["Row"];

export type ProductWithRelations = ProductRow & {
  categories: CategoryRow | null;
  product_images: ProductImageRow[];
  product_variants: ProductVariantRow[];
  product_addons: ProductAddonRow[];
};

export type OrderWithItems = OrderRow & {
  order_items: OrderItemRow[];
};
