import type { Database, Json } from "@/lib/types/database";

export type { Json } from "@/lib/types/database";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
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
  hasCustomOptions: boolean;
  customOptions: ProductCustomOptions;
};

export type ProductCustomOptions = {
  optionGroups: ProductCustomOptionGroup[];
  cakeFlavors: string[];
  chocolateColors: string[];
};

export type ProductCustomOptionGroup = {
  id: string;
  label: string;
  values: string[];
};

export type TreatDesignerOption = {
  id: string;
  group_id: string;
  name: string;
  price_modifier: number;
  image: string | null;
  color_hex: string | null;
  active: boolean;
  sort_order: number;
};

export type TreatDesignerOptionGroup = {
  id: string;
  product_id: string;
  name: string;
  required: boolean;
  active: boolean;
  sort_order: number;
  options: TreatDesignerOption[];
};

export type TreatDesignerProduct = Pick<
  ProductRow,
  "id" | "name" | "slug" | "base_price" | "active" | "status"
> & {
  min_quantity: number;
  image: string | null;
  treat_designer_enabled: boolean;
  treat_designer_featured: boolean;
  enable_sprinkles: boolean;
  enable_logo_upload: boolean;
  enable_live_preview: boolean;
  logo_upload_fee: number;
  option_groups: TreatDesignerOptionGroup[];
};

export type TreatDesignerAddOn = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  sort_order: number;
};

export type TreatDesignerSprinkleSet = {
  id: string;
  name: string;
  image_url: string | null;
  color_hex: string | null;
  price_modifier: number;
  active: boolean;
  sort_order: number;
};

export type TreatDesignerConfig = {
  products: TreatDesignerProduct[];
  addOns: TreatDesignerAddOn[];
  sprinkleSets: TreatDesignerSprinkleSet[];
  isMock?: boolean;
};

export type TreatDesignerOrder = {
  id: string;
  product_id: string | null;
  selected_options: Json;
  add_ons: Json;
  quantity: number;
  custom_notes: string | null;
  total_price: number;
  config?: Json | null;
  preview_image_url?: string | null;
  created_at: string;
  products?: {
    name: string;
  } | null;
};

export type OrderWithItems = OrderRow & {
  order_items: OrderItemRow[];
  order_messages?: OrderMessageRow[];
  order_status_history?: OrderStatusHistoryRow[];
};

export type CustomerAccountOrder = Pick<
  OrderWithItems,
  | "id"
  | "order_number"
  | "order_access_token"
  | "customer_name"
  | "fulfillment_method"
  | "fulfillment_date"
  | "fulfillment_time_slot"
  | "total"
  | "status"
  | "order_status"
  | "payment_status"
  | "created_at"
  | "estimated_ready_at"
> & {
  order_items: OrderItemRow[];
  order_messages?: OrderMessageRow[];
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

export type HomepageHeroContent = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  urgency: string;
  cta_primary: string;
  cta_secondary: string;
  micro_copy: string;
  badge: string;
  image_badge: string;
  image_title: string;
  chips: string[];
  reserve_card_title: string;
  reserve_card_text: string;
  delivery_card_title: string;
  delivery_card_text: string;
};

export type HomepageBestSellersContent = {
  title: string;
  subtitle: string;
};

export type HomepageFinalCtaContent = {
  title: string;
  text: string;
};

export type HomepageCustomOrderContent = {
  title: string;
  description: string;
};

export type HomepageHomeContent = {
  hero: HomepageHeroContent;
  best_sellers: HomepageBestSellersContent;
  about: string;
  occasions_heading: string;
  occasions: string[];
  delivery: string;
  urgency_section: string;
  final_cta: HomepageFinalCtaContent;
  custom_order: HomepageCustomOrderContent;
};

export type HomepageContentJson = {
  sections_order: HomepageSectionKey[];
  home_content: HomepageHomeContent;
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

export type AboutPageCredentialItem = {
  title: string;
  credential_type: string;
  issuer: string;
  issued_at: string | null;
  description: string | null;
  document_url: string | null;
  button_label: string | null;
  visible: boolean;
};

export type AboutPageContentModel = Omit<
  AboutPageContentRow,
  "gallery_images" | "highlight_cards"
> & {
  gallery_images: AboutPageGalleryImage[];
  highlight_cards: AboutPageHighlightCard[];
  credential_items: AboutPageCredentialItem[];
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
  paypal_live: PaymentMethodSettings;
  paypal: PaymentMethodSettings;
  cash_app: PaymentMethodSettings;
  zelle: PaymentMethodSettings;
  manual_payment_note: string | null;
};

export type FulfillmentOption = {
  id: string;
  type: "pickup" | "delivery";
  label: string;
  fee: number;
};

export type FeatureSettings = {
  treat_designer_enabled: boolean;
  treat_designer_disabled_message: string | null;
};

export type SiteSettingsModel = Omit<SiteSettingsRow, "payment_settings" | "delivery_zones" | "feature_settings"> & {
  payment_settings: PaymentSettings;
  delivery_zones: FulfillmentOption[];
  feature_settings: FeatureSettings;
};

export type SocialPlatform = "instagram" | "facebook";

export type SocialPostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "canceled"
  | "failed";

export type SocialPublicationStatus = "pending" | "published" | "failed";

export type SocialScheduleEntry = {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
  platforms: SocialPlatform[];
};

export type SocialPostSettingsRow = {
  id: string;
  automation_enabled: boolean;
  timezone: string;
  queue_days_ahead: number;
  schedule_entries: Json | null;
  required_lines: Json | null;
  cta_phrases_en: Json | null;
  cta_phrases_es: Json | null;
  default_hashtags: Json | null;
  hashtags_enabled: boolean;
  tone_notes: string | null;
  updated_at: string;
};

export type SocialPostRow = {
  id: string;
  product_id: string | null;
  created_by: string | null;
  source_kind: "automation" | "manual";
  schedule_entry_id: string | null;
  schedule_entry_label: string | null;
  source_date: string | null;
  scheduled_for: string | null;
  status: SocialPostStatus;
  platforms: Json | null;
  product_name: string;
  product_price: number | null;
  product_description: string | null;
  image_url: string;
  caption_en: string;
  caption_es: string;
  cta_en: string | null;
  cta_es: string | null;
  combined_caption: string;
  hashtags: Json | null;
  generation_notes: Json | null;
  last_error: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialPostPublicationRow = {
  id: string;
  social_post_id: string;
  platform: SocialPlatform;
  status: SocialPublicationStatus;
  remote_media_id: string | null;
  remote_permalink: string | null;
  published_at: string | null;
  error_message: string | null;
  metrics: Json | null;
  created_at: string;
  updated_at: string;
};

export type SocialPostSettingsModel = Omit<
  SocialPostSettingsRow,
  "schedule_entries" | "required_lines" | "cta_phrases_en" | "cta_phrases_es" | "default_hashtags"
> & {
  schedule_entries: SocialScheduleEntry[];
  required_lines: string[];
  cta_phrases_en: string[];
  cta_phrases_es: string[];
  default_hashtags: string[];
};

export type SocialPostPublicationModel = Omit<
  SocialPostPublicationRow,
  "metrics"
> & {
  metrics: Record<string, Json> | null;
};

export type SocialPostModel = Omit<
  SocialPostRow,
  "platforms" | "hashtags" | "generation_notes"
> & {
  platforms: SocialPlatform[];
  hashtags: string[];
  generation_notes: Record<string, Json> | null;
  social_post_publications: SocialPostPublicationModel[];
};
