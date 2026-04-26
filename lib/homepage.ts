import type {
  HomepageContentJson,
  HomepageContentModel,
  HomepageContentRow,
  HomepageHowItWorksStep,
  HomepageIconName,
  HomepageImageAsset,
  HomepagePromiseCard,
  HomepageSectionKey
} from "@/lib/types/app";

export const HOMEPAGE_ICON_OPTIONS: HomepageIconName[] = [
  "sparkles",
  "gift",
  "truck",
  "calendar",
  "heart",
  "package",
  "palette",
  "shield",
  "shopping_bag",
  "star"
];

export const DEFAULT_HOMEPAGE_SECTIONS_ORDER: HomepageSectionKey[] = [
  "featured",
  "custom_orders",
  "how_it_works",
  "seasonal",
  "trust",
  "testimonials",
  "gallery",
  "final_cta"
];

const DEFAULT_HOW_IT_WORKS_STEPS: HomepageHowItWorksStep[] = [
  {
    title: "Choose your treats",
    text: "Browse our products or start with a custom idea.",
    icon: "shopping_bag"
  },
  {
    title: "Customize your order",
    text: "Pick colors, themes, details, and pickup or delivery preference.",
    icon: "palette"
  },
  {
    title: "We make it fresh",
    text: "Your order is prepared with care and styled beautifully.",
    icon: "sparkles"
  },
  {
    title: "Enjoy the moment",
    text: "Pickup or receive your order and enjoy every sweet bite.",
    icon: "gift"
  }
];

const DEFAULT_TRUST_CARDS: HomepagePromiseCard[] = [
  {
    title: "Freshly Made",
    text: "Every order is prepared with care and attention to detail.",
    icon: "sparkles"
  },
  {
    title: "Custom Details",
    text: "Colors, themes, and designs can be personalized for your occasion.",
    icon: "palette"
  },
  {
    title: "Beautiful Presentation",
    text: "Every box is styled to feel gift-ready and special.",
    icon: "gift"
  },
  {
    title: "Pickup & Local Delivery",
    text: "Convenient pickup and local delivery options are available in select areas.",
    icon: "truck"
  }
];

function cloneGalleryImages(images: HomepageImageAsset[]) {
  return images.map((image) => ({ ...image }));
}

function cloneSteps(steps: HomepageHowItWorksStep[]) {
  return steps.map((step) => ({ ...step }));
}

function cloneCards(cards: HomepagePromiseCard[]) {
  return cards.map((card) => ({ ...card }));
}

export const DEFAULT_HOMEPAGE_CONTENT_JSON: HomepageContentJson = {
  sections_order: [...DEFAULT_HOMEPAGE_SECTIONS_ORDER],
  featured: {
    is_enabled: true,
    product_ids: []
  },
  custom_orders: {
    is_enabled: true,
    title: "Made Just for Your Occasion",
    description:
      "Tell us your theme, colors, event, or inspiration and we’ll help turn it into a custom sweet experience.",
    image_url: null,
    image_alt: "Custom dessert treats styled for a special occasion",
    bullets: [
      "Birthdays",
      "Baby showers",
      "Mother’s Day",
      "Teacher gifts",
      "Holidays",
      "Business gifts",
      "Party favors",
      "Custom colors and themes"
    ],
    button_text: "Start a Custom Order",
    button_link: "/custom-orders"
  },
  how_it_works: {
    is_enabled: true,
    title: "How It Works",
    steps: cloneSteps(DEFAULT_HOW_IT_WORKS_STEPS)
  },
  seasonal: {
    is_enabled: true,
    title: "Seasonal Specials",
    subtitle: "Limited-time treats for holidays, gifts, and sweet celebrations.",
    image_url: null,
    image_alt: "Seasonal dessert box display",
    button_text: "View Seasonal Specials",
    button_link: "/products?seasonal=true",
    product_ids: [],
    special_ids: []
  },
  trust: {
    is_enabled: true,
    title: "Made With Love, Styled With Care",
    description: "",
    cards: cloneCards(DEFAULT_TRUST_CARDS)
  },
  testimonials: {
    is_enabled: true,
    selected_ids: []
  },
  gallery: {
    is_enabled: true,
    title: "A Look at Our Sweet Creations",
    images: []
  },
  final_cta: {
    is_enabled: true,
    title: "Ready to Create Something Sweet?",
    text:
      "Whether it’s a gift, a party, or a custom dessert box, we’re ready to make it beautiful and delicious.",
    button_text: "Start Your Order",
    button_link: "/custom-orders",
    background_image_url: null,
    background_image_alt: "Luxury dessert arrangement"
  }
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeSteps(value: unknown) {
  if (!Array.isArray(value)) {
    return cloneSteps(DEFAULT_HOW_IT_WORKS_STEPS);
  }

  const steps = value
    .filter(isObject)
    .map((step) => ({
      title: asString(step.title),
      text: asString(step.text),
      icon: HOMEPAGE_ICON_OPTIONS.includes(step.icon as HomepageIconName)
        ? (step.icon as HomepageIconName)
        : "sparkles"
    }))
    .filter((step) => step.title && step.text);

  return steps.length > 0 ? steps : cloneSteps(DEFAULT_HOW_IT_WORKS_STEPS);
}

function normalizePromiseCards(value: unknown) {
  if (!Array.isArray(value)) {
    return cloneCards(DEFAULT_TRUST_CARDS);
  }

  const cards = value
    .filter(isObject)
    .map((card) => ({
      title: asString(card.title),
      text: asString(card.text),
      icon: HOMEPAGE_ICON_OPTIONS.includes(card.icon as HomepageIconName)
        ? (card.icon as HomepageIconName)
        : "sparkles"
    }))
    .filter((card) => card.title && card.text);

  return cards.length > 0 ? cards : cloneCards(DEFAULT_TRUST_CARDS);
}

function normalizeGalleryImages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isObject)
    .map((image) => ({
      image_url: asString(image.image_url),
      alt_text: asString(image.alt_text),
      title: asNullableString(image.title),
      caption: asNullableString(image.caption),
      description: asNullableString(image.description),
      asset_id: asNullableString(image.asset_id)
    }))
    .filter((image) => image.image_url && image.alt_text);
}

function normalizeSectionsOrder(value: unknown) {
  const normalized = asStringArray(value).filter((section): section is HomepageSectionKey =>
    DEFAULT_HOMEPAGE_SECTIONS_ORDER.includes(section as HomepageSectionKey)
  );

  if (normalized.length === 0) {
    return [...DEFAULT_HOMEPAGE_SECTIONS_ORDER];
  }

  const missing = DEFAULT_HOMEPAGE_SECTIONS_ORDER.filter(
    (section) => !normalized.includes(section)
  );

  return [...normalized, ...missing];
}

function normalizeContentJson(content: unknown): HomepageContentJson {
  const raw = isObject(content) ? content : {};
  const rawFeatured = isObject(raw.featured) ? raw.featured : {};
  const rawCustomOrders = isObject(raw.custom_orders) ? raw.custom_orders : {};
  const rawHowItWorks = isObject(raw.how_it_works) ? raw.how_it_works : {};
  const rawSeasonal = isObject(raw.seasonal) ? raw.seasonal : {};
  const rawTrust = isObject(raw.trust) ? raw.trust : {};
  const rawTestimonials = isObject(raw.testimonials) ? raw.testimonials : {};
  const rawGallery = isObject(raw.gallery) ? raw.gallery : {};
  const rawFinalCta = isObject(raw.final_cta) ? raw.final_cta : {};

  return {
    sections_order: normalizeSectionsOrder(raw.sections_order),
    featured: {
      is_enabled: asBoolean(
        rawFeatured.is_enabled,
        DEFAULT_HOMEPAGE_CONTENT_JSON.featured.is_enabled
      ),
      product_ids: asStringArray(rawFeatured.product_ids)
    },
    custom_orders: {
      is_enabled: asBoolean(
        rawCustomOrders.is_enabled,
        DEFAULT_HOMEPAGE_CONTENT_JSON.custom_orders.is_enabled
      ),
      title: asString(
        rawCustomOrders.title,
        DEFAULT_HOMEPAGE_CONTENT_JSON.custom_orders.title
      ),
      description: asString(
        rawCustomOrders.description,
        DEFAULT_HOMEPAGE_CONTENT_JSON.custom_orders.description
      ),
      image_url: asNullableString(rawCustomOrders.image_url),
      image_alt: asString(
        rawCustomOrders.image_alt,
        DEFAULT_HOMEPAGE_CONTENT_JSON.custom_orders.image_alt
      ),
      bullets: asStringArray(
        rawCustomOrders.bullets,
        DEFAULT_HOMEPAGE_CONTENT_JSON.custom_orders.bullets
      ),
      button_text: asString(
        rawCustomOrders.button_text,
        DEFAULT_HOMEPAGE_CONTENT_JSON.custom_orders.button_text
      ),
      button_link: asString(
        rawCustomOrders.button_link,
        DEFAULT_HOMEPAGE_CONTENT_JSON.custom_orders.button_link
      )
    },
    how_it_works: {
      is_enabled: asBoolean(
        rawHowItWorks.is_enabled,
        DEFAULT_HOMEPAGE_CONTENT_JSON.how_it_works.is_enabled
      ),
      title: asString(
        rawHowItWorks.title,
        DEFAULT_HOMEPAGE_CONTENT_JSON.how_it_works.title
      ),
      steps: normalizeSteps(rawHowItWorks.steps)
    },
    seasonal: {
      is_enabled: asBoolean(
        rawSeasonal.is_enabled,
        DEFAULT_HOMEPAGE_CONTENT_JSON.seasonal.is_enabled
      ),
      title: asString(rawSeasonal.title, DEFAULT_HOMEPAGE_CONTENT_JSON.seasonal.title),
      subtitle: asString(
        rawSeasonal.subtitle,
        DEFAULT_HOMEPAGE_CONTENT_JSON.seasonal.subtitle
      ),
      image_url: asNullableString(rawSeasonal.image_url),
      image_alt: asString(
        rawSeasonal.image_alt,
        DEFAULT_HOMEPAGE_CONTENT_JSON.seasonal.image_alt
      ),
      button_text: asString(
        rawSeasonal.button_text,
        DEFAULT_HOMEPAGE_CONTENT_JSON.seasonal.button_text
      ),
      button_link: asString(
        rawSeasonal.button_link,
        DEFAULT_HOMEPAGE_CONTENT_JSON.seasonal.button_link
      ),
      product_ids: asStringArray(rawSeasonal.product_ids),
      special_ids: asStringArray(rawSeasonal.special_ids)
    },
    trust: {
      is_enabled: asBoolean(
        rawTrust.is_enabled,
        DEFAULT_HOMEPAGE_CONTENT_JSON.trust.is_enabled
      ),
      title: asString(rawTrust.title, DEFAULT_HOMEPAGE_CONTENT_JSON.trust.title),
      description: asString(
        rawTrust.description,
        DEFAULT_HOMEPAGE_CONTENT_JSON.trust.description
      ),
      cards: normalizePromiseCards(rawTrust.cards)
    },
    testimonials: {
      is_enabled: asBoolean(
        rawTestimonials.is_enabled,
        DEFAULT_HOMEPAGE_CONTENT_JSON.testimonials.is_enabled
      ),
      selected_ids: asStringArray(rawTestimonials.selected_ids)
    },
    gallery: {
      is_enabled: asBoolean(
        rawGallery.is_enabled,
        DEFAULT_HOMEPAGE_CONTENT_JSON.gallery.is_enabled
      ),
      title: asString(rawGallery.title, DEFAULT_HOMEPAGE_CONTENT_JSON.gallery.title),
      images: cloneGalleryImages(normalizeGalleryImages(rawGallery.images))
    },
    final_cta: {
      is_enabled: asBoolean(
        rawFinalCta.is_enabled,
        DEFAULT_HOMEPAGE_CONTENT_JSON.final_cta.is_enabled
      ),
      title: asString(rawFinalCta.title, DEFAULT_HOMEPAGE_CONTENT_JSON.final_cta.title),
      text: asString(rawFinalCta.text, DEFAULT_HOMEPAGE_CONTENT_JSON.final_cta.text),
      button_text: asString(
        rawFinalCta.button_text,
        DEFAULT_HOMEPAGE_CONTENT_JSON.final_cta.button_text
      ),
      button_link: asString(
        rawFinalCta.button_link,
        DEFAULT_HOMEPAGE_CONTENT_JSON.final_cta.button_link
      ),
      background_image_url: asNullableString(rawFinalCta.background_image_url),
      background_image_alt: asString(
        rawFinalCta.background_image_alt,
        DEFAULT_HOMEPAGE_CONTENT_JSON.final_cta.background_image_alt
      )
    }
  };
}

export function normalizeHomepageContent(row: HomepageContentRow): HomepageContentModel {
  return {
    ...row,
    seo_title:
      row.seo_title ?? "L&A Amor & Sugar | Custom Desserts & Sweet Treats in Killeen, TX",
    seo_description:
      row.seo_description ??
      "Custom desserts, chocolate-covered strawberries, cake pops, dessert boxes, and seasonal treats made with love in Killeen, TX. Order online or request a custom treat box.",
    hero_image_url: row.hero_image_url ?? null,
    hero_image_alt: row.hero_image_alt ?? "Luxury custom desserts by L&A Amor & Sugar",
    hero_mobile_image_url: row.hero_mobile_image_url ?? null,
    hero_mobile_image_alt:
      row.hero_mobile_image_alt ?? row.hero_image_alt ?? "Luxury custom desserts by L&A Amor & Sugar",
    hero_background_image_url: row.hero_background_image_url ?? null,
    hero_background_image_alt:
      row.hero_background_image_alt ?? "Soft luxury dessert background",
    content_json: normalizeContentJson(row.content_json)
  };
}
