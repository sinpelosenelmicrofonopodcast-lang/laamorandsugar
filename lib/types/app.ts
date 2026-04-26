import type { Database, Json } from "@/lib/types/database";

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
export type OrderMessageRow =
  Database["public"]["Tables"]["order_messages"]["Row"];
export type OrderStatusHistoryRow =
  Database["public"]["Tables"]["order_status_history"]["Row"];
export type OrderNotificationRow =
  Database["public"]["Tables"]["order_notifications"]["Row"];
export type TestimonialRow =
  Database["public"]["Tables"]["testimonials"]["Row"];
export type AboutPageContentRow =
  Database["public"]["Tables"]["about_page_content"]["Row"];
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
  order_messages?: OrderMessageRow[];
  order_status_history?: OrderStatusHistoryRow[];
};

export type HomepageIconName =
  | "calendar"
  | "gift"
  | "heart"
  | "package"
  | "palette"
  | "shield"
  | "shopping_bag"
  | "sparkles"
  | "star"
  | "truck";

export type HomepageSectionKey =
  | "featured"
  | "custom_orders"
  | "how_it_works"
  | "seasonal"
  | "trust"
  | "testimonials"
  | "gallery"
  | "final_cta";

export type HomepageImageAsset = {
  image_url: string;
  alt_text: string;
  title?: string | null;
  caption?: string | null;
  description?: string | null;
  asset_id?: string | null;
};

export type HomepageHowItWorksStep = {
  title: string;
  text: string;
  icon: HomepageIconName;
};

export type HomepagePromiseCard = {
  title: string;
  text: string;
  icon: HomepageIconName;
};

export type HomepageContentJson = {
  sections_order: HomepageSectionKey[];
  featured: {
    is_enabled: boolean;
    product_ids: string[];
  };
  custom_orders: {
    is_enabled: boolean;
    title: string;
    description: string;
    image_url: string | null;
    image_alt: string;
    bullets: string[];
    button_text: string;
    button_link: string;
  };
  how_it_works: {
    is_enabled: boolean;
    title: string;
    steps: HomepageHowItWorksStep[];
  };
  seasonal: {
    is_enabled: boolean;
    title: string;
    subtitle: string;
    image_url: string | null;
    image_alt: string;
    button_text: string;
    button_link: string;
    product_ids: string[];
    special_ids: string[];
  };
  trust: {
    is_enabled: boolean;
    title: string;
    description: string;
    cards: HomepagePromiseCard[];
  };
  testimonials: {
    is_enabled: boolean;
    selected_ids: string[];
  };
  gallery: {
    is_enabled: boolean;
    title: string;
    images: HomepageImageAsset[];
  };
  final_cta: {
    is_enabled: boolean;
    title: string;
    text: string;
    button_text: string;
    button_link: string;
    background_image_url: string | null;
    background_image_alt: string;
  };
};

export type HomepageContentModel = Omit<HomepageContentRow, "content_json"> & {
  content_json: HomepageContentJson;
};

export type HomepageContentJsonValue = Json;

export type AboutPageGalleryImage = {
  image_url: string;
  alt_text: string;
};

export type AboutPageHighlightCard = {
  title: string;
  text: string;
};

export type AboutPageContentModel = Omit<
  AboutPageContentRow,
  "gallery_images" | "highlight_cards"
> & {
  gallery_images: AboutPageGalleryImage[];
  highlight_cards: AboutPageHighlightCard[];
};

export type PaymentMethodCode =
  | "stripe"
  | "paypal_live"
  | "paypal"
  | "cash_app"
  | "zelle";

export type PaymentMethodSettings = {
  enabled: boolean;
  label: string;
  account: string | null;
  payment_url: string | null;
  instructions: string | null;
};

export type PaymentSettings = {
  stripe: PaymentMethodSettings;
  paypal: PaymentMethodSettings;
  cash_app: PaymentMethodSettings;
  zelle: PaymentMethodSettings;
  manual_payment_note: string | null;
};

export type SiteSettingsModel = Omit<SiteSettingsRow, "payment_settings"> & {
  payment_settings: PaymentSettings;
};
