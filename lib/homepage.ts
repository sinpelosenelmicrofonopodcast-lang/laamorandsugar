import type {
  HomepageContentJson,
  HomepageContentModel,
  HomepageContentRow,
  HomepageHomeContent,
  HomepageHowItWorksStep,
  HomepageIconName,
  HomepageImageAsset,
  HomepagePromiseCard,
  HomepageSectionKey
} from "@/lib/types/app";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/constants";

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
  "trust",
  "how_it_works",
  "custom_orders",
  "seasonal",
  "gallery",
  "testimonials",
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
    title: "Perfect for",
    text: "Mother’s Day, birthdays, anniversaries, apology gifts, and just because.",
    icon: "gift"
  },
  {
    title: "Pickup & Delivery",
    text: "Pickup & delivery available in Killeen, TX. Fort Hood pickup available.",
    icon: "truck"
  },
  {
    title: "Order Timing",
    text: "Orders require 2–3 days notice. Same-day availability may be limited.",
    icon: "calendar"
  },
  {
    title: "Limited Availability",
    text: "Every order is handcrafted and customized, so once we’re booked… that’s it.",
    icon: "sparkles"
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

function cloneHomeContent(content: HomepageHomeContent): HomepageHomeContent {
  return {
    ...content,
    hero: {
      ...content.hero,
      chips: [...content.hero.chips]
    },
    best_sellers: {
      ...content.best_sellers
    },
    occasions: [...content.occasions],
    final_cta: {
      ...content.final_cta
    },
    custom_order: {
      ...content.custom_order
    }
  };
}

export const DEFAULT_HOMEPAGE_HOME_CONTENT: HomepageHomeContent = {
  hero: {
    eyebrow: "Luxury sweet gifting in Killeen, TX",
    headline: "Gifts that make people say WOW before they even taste them.",
    subheadline:
      "Luxury chocolate-covered strawberries, dessert boxes, edible arrangements, and custom treats made to impress every time.",
    urgency: "Limited handcrafted availability this week. Orders require 2–3 days notice, and same-day availability may be limited.",
    cta_primary: "Order Now",
    cta_secondary: "Start Custom Order",
    micro_copy: "Because flowers are nice... but edible ones? unforgettable.",
    badge: "Gift-ready treats for every sweet moment",
    image_badge: "Luxury gifting",
    image_title: "Dessert gifts that look unforgettable before the first bite.",
    chips: [
      "Chocolate-covered strawberries",
      "Dessert boxes",
      "Edible arrangements",
      "Custom orders"
    ],
    reserve_card_title: "Limited handcrafted availability",
    reserve_card_text:
      "Orders require 2–3 days notice, and same-day availability may be limited during busy weeks.",
    delivery_card_title: "Pickup & delivery available",
    delivery_card_text:
      "Pickup and delivery are available in Killeen, TX, and Fort Hood pickup is available for select orders."
  },
  best_sellers: {
    title: "Everyone’s Ordering These Right Now",
    subtitle: "Our most wanted treats — the ones that get reactions every single time."
  },
  about:
    "This isn’t just dessert.\n\nIt’s the moment they open the box.\nIt’s the smile you were hoping for.\nIt’s the reaction you don’t get with regular gifts.\n\nBecause flowers are nice…\nbut edible ones? unforgettable.",
  occasions_heading: "Perfect for:",
  occasions: [
    "Mother’s Day",
    "Birthdays",
    "Anniversaries",
    "Apology gifts",
    "Just because"
  ],
  delivery:
    "Pickup & delivery available in Killeen, TX\nFort Hood pickup available\n\nOrders require 2–3 days notice.\nSame-day availability may be limited.",
  urgency_section:
    "We don’t mass produce.\n\nEvery order is handcrafted and customized — which means availability is limited.\n\nOnce we’re booked… that’s it.",
  final_cta: {
    title: "Don’t wait until it’s too late.",
    text: "Order now and secure your spot."
  },
  custom_order: {
    title: "Build Your Gift Box",
    description:
      "Pick your treats, colors, theme, packaging, and personal details. We’ll turn your idea into a gift-ready sweet experience."
  }
};

export const DEFAULT_HOMEPAGE_CONTENT_JSON: HomepageContentJson = {
  sections_order: [...DEFAULT_HOMEPAGE_SECTIONS_ORDER],
  home_content: cloneHomeContent(DEFAULT_HOMEPAGE_HOME_CONTENT),
  featured: {
    is_enabled: true,
    product_ids: []
  },
  custom_orders: {
    is_enabled: true,
    title: DEFAULT_HOMEPAGE_HOME_CONTENT.custom_order.title,
    description: DEFAULT_HOMEPAGE_HOME_CONTENT.custom_order.description,
    image_url: null,
    image_alt: "Custom dessert treats styled for a special occasion",
    bullets: [...DEFAULT_HOMEPAGE_HOME_CONTENT.occasions],
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
    button_link: "/shop?seasonal=true",
    product_ids: [],
    special_ids: []
  },
  trust: {
    is_enabled: true,
    title: "This isn’t just dessert.",
    description: DEFAULT_HOMEPAGE_HOME_CONTENT.about,
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
    title: DEFAULT_HOMEPAGE_HOME_CONTENT.final_cta.title,
    text: DEFAULT_HOMEPAGE_HOME_CONTENT.final_cta.text,
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
  const rawHomeContent = isObject(raw.home_content) ? raw.home_content : {};
  const rawHeroContent = isObject(rawHomeContent.hero) ? rawHomeContent.hero : {};
  const rawBestSellers = isObject(rawHomeContent.best_sellers) ? rawHomeContent.best_sellers : {};
  const rawFinalCopy = isObject(rawHomeContent.final_cta) ? rawHomeContent.final_cta : {};
  const rawCustomOrderCopy = isObject(rawHomeContent.custom_order) ? rawHomeContent.custom_order : {};
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
    home_content: {
      hero: {
        eyebrow: asString(rawHeroContent.eyebrow, DEFAULT_HOMEPAGE_HOME_CONTENT.hero.eyebrow),
        headline: asString(rawHeroContent.headline, DEFAULT_HOMEPAGE_HOME_CONTENT.hero.headline),
        subheadline: asString(
          rawHeroContent.subheadline,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.subheadline
        ),
        urgency: asString(rawHeroContent.urgency, DEFAULT_HOMEPAGE_HOME_CONTENT.hero.urgency),
        cta_primary: asString(
          rawHeroContent.cta_primary,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.cta_primary
        ),
        cta_secondary: asString(
          rawHeroContent.cta_secondary,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.cta_secondary
        ),
        micro_copy: asString(
          rawHeroContent.micro_copy,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.micro_copy
        ),
        badge: asString(rawHeroContent.badge, DEFAULT_HOMEPAGE_HOME_CONTENT.hero.badge),
        image_badge: asString(
          rawHeroContent.image_badge,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.image_badge
        ),
        image_title: asString(
          rawHeroContent.image_title,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.image_title
        ),
        chips: asStringArray(rawHeroContent.chips, DEFAULT_HOMEPAGE_HOME_CONTENT.hero.chips),
        reserve_card_title: asString(
          rawHeroContent.reserve_card_title,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.reserve_card_title
        ),
        reserve_card_text: asString(
          rawHeroContent.reserve_card_text,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.reserve_card_text
        ),
        delivery_card_title: asString(
          rawHeroContent.delivery_card_title,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.delivery_card_title
        ),
        delivery_card_text: asString(
          rawHeroContent.delivery_card_text,
          DEFAULT_HOMEPAGE_HOME_CONTENT.hero.delivery_card_text
        )
      },
      best_sellers: {
        title: asString(
          rawBestSellers.title,
          DEFAULT_HOMEPAGE_HOME_CONTENT.best_sellers.title
        ),
        subtitle: asString(
          rawBestSellers.subtitle,
          DEFAULT_HOMEPAGE_HOME_CONTENT.best_sellers.subtitle
        )
      },
      about: asString(rawHomeContent.about, DEFAULT_HOMEPAGE_HOME_CONTENT.about),
      occasions_heading: asString(
        rawHomeContent.occasions_heading,
        DEFAULT_HOMEPAGE_HOME_CONTENT.occasions_heading
      ),
      occasions: asStringArray(rawHomeContent.occasions, DEFAULT_HOMEPAGE_HOME_CONTENT.occasions),
      delivery: asString(rawHomeContent.delivery, DEFAULT_HOMEPAGE_HOME_CONTENT.delivery),
      urgency_section: asString(
        rawHomeContent.urgency_section,
        DEFAULT_HOMEPAGE_HOME_CONTENT.urgency_section
      ),
      final_cta: {
        title: asString(rawFinalCopy.title, DEFAULT_HOMEPAGE_HOME_CONTENT.final_cta.title),
        text: asString(rawFinalCopy.text, DEFAULT_HOMEPAGE_HOME_CONTENT.final_cta.text)
      },
      custom_order: {
        title: asString(
          rawCustomOrderCopy.title,
          DEFAULT_HOMEPAGE_HOME_CONTENT.custom_order.title
        ),
        description: asString(
          rawCustomOrderCopy.description,
          DEFAULT_HOMEPAGE_HOME_CONTENT.custom_order.description
        )
      }
    },
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
        DEFAULT_HOMEPAGE_HOME_CONTENT.custom_order.title
      ),
      description: asString(
        rawCustomOrders.description,
        DEFAULT_HOMEPAGE_HOME_CONTENT.custom_order.description
      ),
      image_url: asNullableString(rawCustomOrders.image_url),
      image_alt: asString(
        rawCustomOrders.image_alt,
        DEFAULT_HOMEPAGE_CONTENT_JSON.custom_orders.image_alt
      ),
      bullets: asStringArray(
        rawCustomOrders.bullets,
        DEFAULT_HOMEPAGE_HOME_CONTENT.occasions
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
        DEFAULT_HOMEPAGE_HOME_CONTENT.about
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
      text: asString(rawFinalCta.text, DEFAULT_HOMEPAGE_HOME_CONTENT.final_cta.text),
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
  const contentJson = normalizeContentJson(row.content_json);

  return {
    ...row,
    banner_text: row.banner_text ?? null,
    banner_cta_label: row.banner_cta_label ?? null,
    banner_cta_href: row.banner_cta_href ?? null,
    seo_title:
      row.seo_title ?? "L&A Amor & Sugar | Custom Desserts & Sweet Treats in Killeen, TX",
    seo_description:
      row.seo_description ??
      "Custom desserts, chocolate-covered strawberries, cake pops, dessert boxes, and seasonal treats made with love in Killeen, TX. Order online or request a custom treat box.",
    hero_eyebrow: row.hero_eyebrow ?? contentJson.home_content.hero.eyebrow,
    hero_title: row.hero_title ?? contentJson.home_content.hero.headline,
    hero_description: row.hero_description ?? contentJson.home_content.hero.subheadline,
    hero_primary_cta_label:
      row.hero_primary_cta_label ?? contentJson.home_content.hero.cta_primary,
    hero_primary_cta_href: row.hero_primary_cta_href ?? "/shop",
    hero_secondary_cta_label:
      row.hero_secondary_cta_label ?? contentJson.home_content.hero.cta_secondary,
    hero_secondary_cta_href: row.hero_secondary_cta_href ?? "/custom-orders",
    hero_image_url: row.hero_image_url ?? null,
    hero_image_alt: row.hero_image_alt ?? "Luxury custom desserts by L&A Amor & Sugar",
    hero_mobile_image_url: row.hero_mobile_image_url ?? null,
    hero_mobile_image_alt:
      row.hero_mobile_image_alt ?? row.hero_image_alt ?? "Luxury custom desserts by L&A Amor & Sugar",
    hero_background_image_url: row.hero_background_image_url ?? null,
    hero_background_image_alt:
      row.hero_background_image_alt ?? "Soft luxury dessert background",
    featured_heading: row.featured_heading ?? contentJson.home_content.best_sellers.title,
    featured_description:
      row.featured_description ?? contentJson.home_content.best_sellers.subtitle,
    process_heading: row.process_heading ?? DEFAULT_HOMEPAGE_CONTENT.process_heading,
    process_description:
      row.process_description ?? DEFAULT_HOMEPAGE_CONTENT.process_description,
    testimonials_heading:
      row.testimonials_heading ?? DEFAULT_HOMEPAGE_CONTENT.testimonials_heading,
    testimonials_description:
      row.testimonials_description ?? DEFAULT_HOMEPAGE_CONTENT.testimonials_description,
    cta_heading: row.cta_heading ?? contentJson.home_content.final_cta.title,
    cta_description: row.cta_description ?? contentJson.home_content.final_cta.text,
    content_json: contentJson
  };
}
