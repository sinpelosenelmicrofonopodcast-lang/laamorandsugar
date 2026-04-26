import type {
  AboutPageContentModel,
  AboutPageContentRow
} from "@/lib/types/app";

export const DEFAULT_ABOUT_PAGE_CONTENT: AboutPageContentModel = {
  id: "fallback-about-page",
  hero_eyebrow: "Our Story",
  hero_title: "Sweet Moments, Made With Love",
  hero_text:
    "L&A Amor & Sugar was created with one simple idea: make beautiful treats that feel personal, thoughtful, and unforgettable. From custom cake pops and chocolate-covered strawberries to luxury dessert boxes and seasonal gifts, every order is made with care, detail, and love.",
  hero_image_url: null,
  hero_image_alt: "Elegant custom dessert treats from L&A Amor & Sugar",
  section_one_title: "More Than Just Desserts",
  section_one_text:
    "We believe every sweet treat should feel like part of the celebration. Whether it’s a birthday, Mother’s Day gift, baby shower, romantic surprise, business gift, or a simple “just because” moment, our goal is to make every box look beautiful and taste even better.",
  section_two_title: "Family-Made With Care",
  section_two_text:
    "Behind L&A Amor & Sugar is a family-centered dessert brand built on love, creativity, and attention to detail. Every order is handled with care, from the colors and presentation to the final packaging.",
  style_title: "Our Style",
  style_text:
    "Soft colors, elegant details, romantic presentation, and a luxury dessert-box feel. L&A Amor & Sugar is for people who want something sweeter than ordinary.",
  cta_title: "Ready to Create Something Sweet?",
  cta_text:
    "Tell us your theme, colors, or occasion and we’ll help bring your idea to life.",
  cta_button_text: "Start a Custom Order",
  cta_button_link: "/custom-orders",
  gallery_images: [],
  highlight_cards: [
    {
      title: "Custom Treats",
      text:
        "Cake pops, strawberries, pretzels, dessert boxes, and seasonal sweets made to match your occasion."
    },
    {
      title: "Gift-Ready Presentation",
      text:
        "Every box is styled to feel beautiful, thoughtful, and ready to impress."
    },
    {
      title: "Made Fresh",
      text:
        "Orders are prepared with care so every treat feels fresh, special, and delicious."
    },
    {
      title: "Local Pickup & Delivery",
      text: "Pickup and local delivery options are available for select areas."
    }
  ],
  updated_at: new Date().toISOString()
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeGalleryImages(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as AboutPageContentModel["gallery_images"];
  }

  return value
    .filter(isObject)
    .map((image) => ({
      image_url: asString(image.image_url),
      alt_text: asString(image.alt_text)
    }))
    .filter((image) => image.image_url && image.alt_text)
    .slice(0, 6);
}

function normalizeHighlightCards(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_ABOUT_PAGE_CONTENT.highlight_cards.map((card) => ({ ...card }));
  }

  const cards = value
    .filter(isObject)
    .map((card) => ({
      title: asString(card.title),
      text: asString(card.text)
    }))
    .filter((card) => card.title && card.text)
    .slice(0, 4);

  return cards.length > 0
    ? cards
    : DEFAULT_ABOUT_PAGE_CONTENT.highlight_cards.map((card) => ({ ...card }));
}

export function normalizeAboutPageContent(
  row: AboutPageContentRow | null | undefined
): AboutPageContentModel {
  if (!row) {
    return {
      ...DEFAULT_ABOUT_PAGE_CONTENT,
      gallery_images: [],
      highlight_cards: DEFAULT_ABOUT_PAGE_CONTENT.highlight_cards.map((card) => ({ ...card }))
    };
  }

  return {
    ...row,
    hero_eyebrow: asNullableString(row.hero_eyebrow) ?? DEFAULT_ABOUT_PAGE_CONTENT.hero_eyebrow,
    hero_title: asNullableString(row.hero_title) ?? DEFAULT_ABOUT_PAGE_CONTENT.hero_title,
    hero_text: asNullableString(row.hero_text) ?? DEFAULT_ABOUT_PAGE_CONTENT.hero_text,
    hero_image_url: asNullableString(row.hero_image_url),
    hero_image_alt: asNullableString(row.hero_image_alt) ?? DEFAULT_ABOUT_PAGE_CONTENT.hero_image_alt,
    section_one_title:
      asNullableString(row.section_one_title) ?? DEFAULT_ABOUT_PAGE_CONTENT.section_one_title,
    section_one_text:
      asNullableString(row.section_one_text) ?? DEFAULT_ABOUT_PAGE_CONTENT.section_one_text,
    section_two_title:
      asNullableString(row.section_two_title) ?? DEFAULT_ABOUT_PAGE_CONTENT.section_two_title,
    section_two_text:
      asNullableString(row.section_two_text) ?? DEFAULT_ABOUT_PAGE_CONTENT.section_two_text,
    style_title: asNullableString(row.style_title) ?? DEFAULT_ABOUT_PAGE_CONTENT.style_title,
    style_text: asNullableString(row.style_text) ?? DEFAULT_ABOUT_PAGE_CONTENT.style_text,
    cta_title: asNullableString(row.cta_title) ?? DEFAULT_ABOUT_PAGE_CONTENT.cta_title,
    cta_text: asNullableString(row.cta_text) ?? DEFAULT_ABOUT_PAGE_CONTENT.cta_text,
    cta_button_text:
      asNullableString(row.cta_button_text) ?? DEFAULT_ABOUT_PAGE_CONTENT.cta_button_text,
    cta_button_link:
      asNullableString(row.cta_button_link) ?? DEFAULT_ABOUT_PAGE_CONTENT.cta_button_link,
    gallery_images: normalizeGalleryImages(row.gallery_images),
    highlight_cards: normalizeHighlightCards(row.highlight_cards)
  };
}
