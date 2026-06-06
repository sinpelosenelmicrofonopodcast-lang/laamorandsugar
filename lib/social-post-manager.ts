/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type {
  Json,
  ProductWithRelations,
  SocialPlatform,
  SocialPostModel,
  SocialPostPublicationModel,
  SocialPostSettingsModel,
  SocialPostSettingsRow
} from "@/lib/types/app";
import { absoluteUrl, getErrorMessage, resolveImageUrl } from "@/lib/utils";

const DEFAULT_SCHEDULE = [
  { id: "morning", label: "Morning", time: "09:00", enabled: true, platforms: ["instagram", "facebook"] },
  { id: "afternoon", label: "Afternoon", time: "14:00", enabled: true, platforms: ["instagram", "facebook"] },
  { id: "night", label: "Night", time: "20:00", enabled: true, platforms: ["instagram", "facebook"] }
] satisfies SocialPostSettingsModel["schedule_entries"];

const DEFAULT_REQUIRED_LINES = [
  "Available in Killeen, TX",
  "Delivery available (delivery fee applies for other areas)",
  "We also deliver on Fort Hood",
  "Order online with secure checkout"
];

const DEFAULT_REQUIRED_LINES_ES = [
  "Disponible en Killeen, TX",
  "Delivery disponible (aplican cargos para otras areas)",
  "Tambien entregamos en Fort Hood",
  "Ordena online con checkout seguro"
];

const DEFAULT_CTA_EN = [
  "Order now before we sell out",
  "DM us to place your order",
  "Limited availability in Killeen"
];

const DEFAULT_CTA_ES = [
  "Ordena ahora antes de que se acaben",
  "Escribenos por inbox para hacer tu pedido",
  "Disponibilidad limitada en Killeen"
];

const DEFAULT_HASHTAGS = [
  "KilleenTX",
  "Desserts",
  "FortHood",
  "SweetTreats",
  "SupportLocal",
  "ChocolateCoveredStrawberries"
];

const FALLBACK_HOOKS_EN = [
  "Treat yourself to something sweet today",
  "A little sweetness goes a long way",
  "Freshly made treats for your favorite moments",
  "Dessert plans just got easier"
];

const FALLBACK_HOOKS_ES = [
  "Consientete con algo dulce hoy",
  "Un detalle dulce cambia el dia",
  "Postres frescos para tus momentos favoritos",
  "Tu antojo ya tiene solucion"
];

type SocialProduct = Pick<
  ProductWithRelations,
  "id" | "name" | "slug" | "description" | "short_description" | "base_price"
> & {
  product_images: ProductWithRelations["product_images"];
};

type SocialCopyResult = {
  caption_en: string;
  caption_es: string;
  cta_en: string;
  cta_es: string;
  combined_caption: string;
  hashtags: string[];
  generation_notes: Record<string, Json>;
};

type PublicationResult = {
  platform: SocialPlatform;
  status: "published" | "failed";
  remote_media_id?: string | null;
  remote_permalink?: string | null;
  metrics?: Record<string, Json> | null;
  error_message?: string | null;
  published_at?: string | null;
};

export const DEFAULT_SOCIAL_POST_SETTINGS: SocialPostSettingsModel = {
  id: "social-post-settings-default",
  automation_enabled: true,
  timezone: "America/Chicago",
  queue_days_ahead: 2,
  schedule_entries: DEFAULT_SCHEDULE.map((entry) => ({ ...entry })),
  required_lines: [...DEFAULT_REQUIRED_LINES],
  cta_phrases_en: [...DEFAULT_CTA_EN],
  cta_phrases_es: [...DEFAULT_CTA_ES],
  default_hashtags: [...DEFAULT_HASHTAGS],
  hashtags_enabled: true,
  tone_notes: "Friendly, sweet, persuasive, and modern social media style.",
  updated_at: new Date().toISOString()
};

function asStringArray(value: Json | null | undefined, fallback: string[]) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const values = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);

  return values.length > 0 ? values : [...fallback];
}

function asPlatforms(value: Json | null | undefined) {
  if (!Array.isArray(value)) {
    return ["instagram", "facebook"] as SocialPlatform[];
  }

  const platforms = value.filter(
    (entry): entry is SocialPlatform => entry === "instagram" || entry === "facebook"
  );

  return platforms.length > 0 ? platforms : (["instagram", "facebook"] as SocialPlatform[]);
}

function asScheduleEntries(value: Json | null | undefined) {
  if (!Array.isArray(value)) {
    return DEFAULT_SCHEDULE.map((entry) => ({ ...entry }));
  }

  const entries = value
    .map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const record = entry as Record<string, Json | undefined>;
      const id = typeof record.id === "string" && record.id.trim() ? record.id.trim() : `slot-${index + 1}`;
      const label =
        typeof record.label === "string" && record.label.trim() ? record.label.trim() : `Slot ${index + 1}`;
      const time =
        typeof record.time === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(record.time)
          ? record.time
          : "09:00";

      return {
        id,
        label,
        time,
        enabled: record.enabled !== false,
        platforms: asPlatforms(record.platforms ?? null)
      };
    })
    .filter((entry): entry is SocialPostSettingsModel["schedule_entries"][number] => Boolean(entry));

  return entries.length > 0 ? entries : DEFAULT_SCHEDULE.map((entry) => ({ ...entry }));
}

function asObject(value: Json | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : null;
}

export function normalizeSocialPostSettings(
  row: SocialPostSettingsRow | null | undefined
): SocialPostSettingsModel {
  if (!row) {
    return {
      ...DEFAULT_SOCIAL_POST_SETTINGS,
      schedule_entries: DEFAULT_SOCIAL_POST_SETTINGS.schedule_entries.map((entry) => ({ ...entry })),
      required_lines: [...DEFAULT_SOCIAL_POST_SETTINGS.required_lines],
      cta_phrases_en: [...DEFAULT_SOCIAL_POST_SETTINGS.cta_phrases_en],
      cta_phrases_es: [...DEFAULT_SOCIAL_POST_SETTINGS.cta_phrases_es],
      default_hashtags: [...DEFAULT_SOCIAL_POST_SETTINGS.default_hashtags]
    };
  }

  return {
    id: row.id,
    automation_enabled: row.automation_enabled,
    timezone: row.timezone || DEFAULT_SOCIAL_POST_SETTINGS.timezone,
    queue_days_ahead: row.queue_days_ahead ?? DEFAULT_SOCIAL_POST_SETTINGS.queue_days_ahead,
    schedule_entries: asScheduleEntries(row.schedule_entries),
    required_lines: asStringArray(row.required_lines, DEFAULT_REQUIRED_LINES),
    cta_phrases_en: asStringArray(row.cta_phrases_en, DEFAULT_CTA_EN),
    cta_phrases_es: asStringArray(row.cta_phrases_es, DEFAULT_CTA_ES),
    default_hashtags: asStringArray(row.default_hashtags, DEFAULT_HASHTAGS),
    hashtags_enabled: row.hashtags_enabled ?? true,
    tone_notes: row.tone_notes ?? DEFAULT_SOCIAL_POST_SETTINGS.tone_notes,
    updated_at: row.updated_at
  };
}

export function normalizeSocialPost(row: any): SocialPostModel {
  return {
    ...row,
    platforms: asPlatforms(row.platforms ?? null),
    hashtags: asStringArray(row.hashtags ?? null, []),
    generation_notes: asObject(row.generation_notes ?? null),
    social_post_publications: Array.isArray(row.social_post_publications)
      ? row.social_post_publications.map(normalizeSocialPostPublication)
      : []
  };
}

export function normalizeSocialPostPublication(row: any): SocialPostPublicationModel {
  return {
    ...row,
    metrics: asObject(row.metrics ?? null)
  };
}

export function getSocialAutomationEnvStatus() {
  return {
    supabase: hasSupabaseEnv(),
    openai: Boolean(process.env.OPENAI_API_KEY),
    metaAccessToken: Boolean(
      process.env.META_ACCESS_TOKEN ?? process.env.META_PAGE_ACCESS_TOKEN ?? process.env.META_FACEBOOK_PAGE_ACCESS_TOKEN
    ),
    facebookPage: Boolean(process.env.META_FACEBOOK_PAGE_ID),
    instagramAccount: Boolean(process.env.META_INSTAGRAM_BUSINESS_ID),
    cronSecret: Boolean(process.env.SOCIAL_AUTOMATION_SECRET)
  };
}

export async function getSocialAutomationDiagnostics() {
  if (!hasSupabaseEnv()) {
    return {
      env: getSocialAutomationEnvStatus(),
      dueCount: 0,
      overdueCount: 0,
      nextScheduledFor: null,
      lastError: "Supabase is not configured."
    };
  }

  const supabase = createAdminClient() as any;
  const now = new Date().toISOString();
  const { count: dueCount } = await supabase
    .from("social_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "scheduled")
    .lte("scheduled_for", now);
  const { count: overdueCount } = await supabase
    .from("social_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date(Date.now() - 45 * 60 * 1000).toISOString());
  const { data: nextPost } = await supabase
    .from("social_posts")
    .select("scheduled_for")
    .eq("status", "scheduled")
    .gte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(1)
    .maybeSingle();
  const { data: lastFailed } = await supabase
    .from("social_posts")
    .select("last_error,updated_at")
    .eq("status", "failed")
    .not("last_error", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    env: getSocialAutomationEnvStatus(),
    dueCount: dueCount ?? 0,
    overdueCount: overdueCount ?? 0,
    nextScheduledFor: nextPost?.scheduled_for ?? null,
    lastError: lastFailed?.last_error ?? null
  };
}

function getSocialAutomationSecret() {
  const value = process.env.SOCIAL_AUTOMATION_SECRET;

  if (!value) {
    throw new Error("Missing SOCIAL_AUTOMATION_SECRET");
  }

  return value;
}

function getMetaGraphVersion() {
  return process.env.META_GRAPH_API_VERSION ?? "v23.0";
}

function getMetaAccessToken() {
  const value = process.env.META_ACCESS_TOKEN ?? process.env.META_PAGE_ACCESS_TOKEN ?? process.env.META_FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!value) {
    throw new Error("Missing META_ACCESS_TOKEN or META_PAGE_ACCESS_TOKEN");
  }

  return value;
}

function getConfiguredFacebookPageAccessToken() {
  return process.env.META_FACEBOOK_PAGE_ACCESS_TOKEN ?? null;
}

function getFacebookPageId() {
  const value = process.env.META_FACEBOOK_PAGE_ID;

  if (!value) {
    throw new Error("Missing META_FACEBOOK_PAGE_ID");
  }

  return value;
}

function getInstagramBusinessId() {
  const value = process.env.META_INSTAGRAM_BUSINESS_ID;

  if (!value) {
    throw new Error("Missing META_INSTAGRAM_BUSINESS_ID");
  }

  return value;
}

function formatDateKey(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
}

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const parts = formatter.formatToParts(date);
  const record = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(record.year),
    month: Number(record.month),
    day: Number(record.day),
    hour: Number(record.hour),
    minute: Number(record.minute),
    second: Number(record.second)
  };
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const zoned = getTimeZoneParts(date, timeZone);
  const utcEquivalent = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second
  );

  return utcEquivalent - date.getTime();
}

function zonedDateTimeToUtc(dateKey: string, time: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const firstOffset = getTimeZoneOffset(guess, timeZone);
  const candidate = new Date(guess.getTime() - firstOffset);
  const secondOffset = getTimeZoneOffset(candidate, timeZone);

  return new Date(guess.getTime() - secondOffset);
}

function formatPriceLine(price: number | null | undefined) {
  if (typeof price !== "number" || !Number.isFinite(price)) {
    return null;
  }

  return `Only $${price.toFixed(2)}`;
}

function buildProductUrl(product: SocialProduct) {
  return absoluteUrl(`/products/${product.slug}`);
}

function stripCaptionLabel(value: string) {
  return value
    .replace(/^\s*(EN|ES|CTA)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRequiredLine(line: string) {
  if (/order\s+via\s+inbox|dm\s+us/i.test(line)) {
    return "Order online with secure checkout";
  }

  return line;
}

function uniqueHashtags(value: string[]) {
  return [...new Set(value.map((entry) => entry.replace(/^#/, "").trim()).filter(Boolean))];
}

function pickDeterministic<T>(items: T[], seed: string) {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty list");
  }

  const index =
    Array.from(seed).reduce((sum, character) => sum + character.charCodeAt(0), 0) % items.length;

  return items[index];
}

function buildCaptionSections({
  product,
  hook,
  body,
  priceLine,
  requiredLines,
  cta,
  productUrl,
  secureCheckoutLine
}: {
  product: SocialProduct;
  hook: string;
  body: string;
  priceLine: string | null;
  requiredLines: string[];
  cta: string;
  productUrl: string;
  secureCheckoutLine: string;
}) {
  return [
    stripCaptionLabel(hook),
    `${product.name}`.trim(),
    stripCaptionLabel(body),
    priceLine,
    ...requiredLines.map((line) => line.trim()),
    productUrl,
    secureCheckoutLine,
    stripCaptionLabel(cta)
  ]
    .filter((line): line is string => Boolean(line && line.trim()))
    .join("\n");
}

function buildCombinedCaption(captionEn: string, captionEs: string, hashtags: string[]) {
  const hashtagLine =
    hashtags.length > 0 ? `\n\n${hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ")}` : "";

  return `${captionEn}\n\n${captionEs}${hashtagLine}`;
}

async function callOpenAiForSocialCopy({
  product,
  settings,
  slotLabel,
  recentCaptions
}: {
  product: SocialProduct;
  settings: SocialPostSettingsModel;
  slotLabel: string;
  recentCaptions: string[];
}) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "You create bilingual Instagram/Facebook product captions for a dessert brand. Return strict JSON only. Keep the tone friendly, sweet, persuasive, and modern. Avoid repeating recent phrasing."
        },
        {
          role: "user",
          content: [
            `Product name: ${product.name}`,
            `Price: ${typeof product.base_price === "number" ? `$${product.base_price.toFixed(2)}` : "Not available"}`,
            `Description: ${product.description ?? product.short_description ?? "No description provided"}`,
            `Posting slot: ${slotLabel}`,
            `Tone notes: ${settings.tone_notes ?? "Friendly, sweet, persuasive, and modern."}`,
            `Required English lines: ${settings.required_lines.join(" | ")}`,
            `Preferred CTA examples (EN): ${settings.cta_phrases_en.join(" | ")}`,
            `Preferred CTA examples (ES): ${settings.cta_phrases_es.join(" | ")}`,
            "Do not include visible labels like EN:, ES:, or CTA: in any returned text.",
            "Mention that customers can order on the website with secure checkout.",
            recentCaptions.length > 0
              ? `Avoid repeating these recent lines: ${recentCaptions.slice(0, 6).join(" || ")}`
              : "Recent lines: none"
          ].join("\n")
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "social_post_copy",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              hook_en: { type: "string" },
              hook_es: { type: "string" },
              body_en: { type: "string" },
              body_es: { type: "string" },
              cta_en: { type: "string" },
              cta_es: { type: "string" },
              hashtags: {
                type: "array",
                items: { type: "string" },
                minItems: 0,
                maxItems: 10
              }
            },
            required: ["hook_en", "hook_es", "body_en", "body_es", "cta_en", "cta_es", "hashtags"]
          }
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed while generating social post copy.");
  }

  const result = await response.json();
  const outputText = result.output_text as string | undefined;

  if (!outputText) {
    throw new Error("OpenAI returned an empty caption response.");
  }

  return JSON.parse(outputText) as {
    hook_en: string;
    hook_es: string;
    body_en: string;
    body_es: string;
    cta_en: string;
    cta_es: string;
    hashtags: string[];
  };
}

async function generateSocialCopy({
  product,
  settings,
  slotLabel,
  recentCaptions
}: {
  product: SocialProduct;
  settings: SocialPostSettingsModel;
  slotLabel: string;
  recentCaptions: string[];
}): Promise<SocialCopyResult> {
  const aiResult = await callOpenAiForSocialCopy({
    product,
    settings,
    slotLabel,
    recentCaptions
  }).catch(() => null);
  const seed = `${product.id}:${slotLabel}:${formatDateKey(new Date(), settings.timezone)}`;
  const priceLine = formatPriceLine(product.base_price);
  const productUrl = buildProductUrl(product);

  const hookEn = aiResult?.hook_en?.trim() || pickDeterministic(FALLBACK_HOOKS_EN, seed);
  const hookEs = aiResult?.hook_es?.trim() || pickDeterministic(FALLBACK_HOOKS_ES, seed);
  const bodyEn =
    aiResult?.body_en?.trim() ||
    `${product.short_description ?? product.description ?? "Freshly made and ready to make someone's day sweeter."}`;
  const bodyEs =
    aiResult?.body_es?.trim() ||
    "Hecho fresco con mucho amor para endulzar cualquier momento especial.";
  const ctaEn =
    aiResult?.cta_en?.trim() || pickDeterministic(settings.cta_phrases_en, `${seed}:en`);
  const ctaEs =
    aiResult?.cta_es?.trim() || pickDeterministic(settings.cta_phrases_es, `${seed}:es`);
  const hashtags = uniqueHashtags(
    settings.hashtags_enabled
      ? [...(aiResult?.hashtags ?? []), ...settings.default_hashtags].slice(0, 10)
      : []
  );

  const caption_en = buildCaptionSections({
    product,
    hook: hookEn,
    body: bodyEn,
    priceLine,
    requiredLines: settings.required_lines.map((line, index) => {
      const icons = ["📍", "🚗", "🎖", "📩"];
      return `${icons[index] ?? "•"} ${normalizeRequiredLine(line)}`;
    }),
    productUrl,
    secureCheckoutLine: "🔒 Secure checkout available on our website",
    cta: ctaEn
  });

  const caption_es = buildCaptionSections({
    product,
    hook: hookEs,
    body: bodyEs,
    priceLine: priceLine ? priceLine.replace("Only", "Solo") : null,
    requiredLines: [
      `📍 ${DEFAULT_REQUIRED_LINES_ES[0]}`,
      `🚗 ${DEFAULT_REQUIRED_LINES_ES[1]}`,
      `🎖 ${DEFAULT_REQUIRED_LINES_ES[2]}`,
      `📩 ${DEFAULT_REQUIRED_LINES_ES[3]}`
    ],
    productUrl,
    secureCheckoutLine: "🔒 Checkout seguro disponible en nuestra pagina",
    cta: ctaEs
  });

  return {
    caption_en,
    caption_es,
    cta_en: ctaEn,
    cta_es: ctaEs,
    combined_caption: buildCombinedCaption(caption_en, caption_es, hashtags),
    hashtags,
    generation_notes: {
      slot_label: slotLabel,
      ai_used: Boolean(aiResult),
      tone_notes: settings.tone_notes ?? null
    }
  };
}

async function getOrCreateSocialPostSettings(supabase: any) {
  const { data: existing } = (await supabase
    .from("social_post_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: SocialPostSettingsRow | null };

  if (existing) {
    return normalizeSocialPostSettings(existing);
  }

  const payload = {
    automation_enabled: DEFAULT_SOCIAL_POST_SETTINGS.automation_enabled,
    timezone: DEFAULT_SOCIAL_POST_SETTINGS.timezone,
    queue_days_ahead: DEFAULT_SOCIAL_POST_SETTINGS.queue_days_ahead,
    schedule_entries: DEFAULT_SOCIAL_POST_SETTINGS.schedule_entries,
    required_lines: DEFAULT_SOCIAL_POST_SETTINGS.required_lines,
    cta_phrases_en: DEFAULT_SOCIAL_POST_SETTINGS.cta_phrases_en,
    cta_phrases_es: DEFAULT_SOCIAL_POST_SETTINGS.cta_phrases_es,
    default_hashtags: DEFAULT_SOCIAL_POST_SETTINGS.default_hashtags,
    hashtags_enabled: DEFAULT_SOCIAL_POST_SETTINGS.hashtags_enabled,
    tone_notes: DEFAULT_SOCIAL_POST_SETTINGS.tone_notes
  };

  const { data, error } = await supabase
    .from("social_post_settings")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeSocialPostSettings(data as SocialPostSettingsRow);
}

async function getEligibleProducts(supabase: any): Promise<SocialProduct[]> {
  const { data } = await supabase
    .from("products")
    .select("id,name,slug,description,short_description,base_price,product_images(*)")
    .eq("active", true)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  return ((data ?? []) as any[])
    .map((product) => ({
      ...product,
      product_images: (product.product_images ?? [])
        .map((image: any) => ({
          ...image,
          image_url: resolveImageUrl(image)
        }))
        .filter((image: { image_url?: string | null }) => Boolean(image.image_url))
    }))
    .filter((product: SocialProduct) => product.product_images.length > 0);
}

function pickProductForQueue(products: SocialProduct[], recentPosts: SocialPostModel[], seed: string) {
  const recentProductIds = recentPosts
    .map((post) => post.product_id)
    .filter((value): value is string => Boolean(value))
    .slice(0, 6);
  const prioritized = products.filter((product) => !recentProductIds.includes(product.id));
  const pool = prioritized.length > 0 ? prioritized : products;

  return pickDeterministic(
    [...pool].sort((left, right) => left.name.localeCompare(right.name)),
    seed
  );
}

function buildPublicImageUrl(product: SocialProduct) {
  const primary =
    [...product.product_images].sort((left, right) => Number(right.is_primary) - Number(left.is_primary))[0];

  return primary?.image_url ?? absoluteUrl("/products/placeholder-elegance.svg");
}

async function insertPublicationPlaceholders(
  supabase: any,
  socialPostId: string,
  platforms: SocialPlatform[]
) {
  if (platforms.length === 0) {
    return;
  }

  const rows = platforms.map((platform) => ({
    social_post_id: socialPostId,
    platform,
    status: "pending"
  }));

  const { error } = await supabase
    .from("social_post_publications")
    .upsert(rows, { onConflict: "social_post_id,platform" });

  if (error) {
    throw error;
  }
}

export async function ensureSocialPostQueue(options?: {
  daysAhead?: number;
  createdBy?: string | null;
  force?: boolean;
}) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createAdminClient() as any;
  const settings = await getOrCreateSocialPostSettings(supabase);
  const products = await getEligibleProducts(supabase);

  if (products.length === 0) {
    throw new Error("Add at least one active product with an image before generating social posts.");
  }

  const enabledEntries = settings.schedule_entries.filter((entry) => entry.enabled);

  if (enabledEntries.length === 0) {
    return { created: [], settings };
  }

  const todayKey = formatDateKey(new Date(), settings.timezone);
  const now = new Date();
  const totalDays = options?.daysAhead ?? settings.queue_days_ahead;
  const dateKeys = Array.from({ length: totalDays + 1 }, (_, index) => addDaysToDateKey(todayKey, index));
  const { data: existingRows } = await supabase
    .from("social_posts")
    .select("*, social_post_publications(*)")
    .in("source_date", dateKeys)
    .order("scheduled_for", { ascending: true });
  const existingPosts = ((existingRows ?? []) as any[]).map(normalizeSocialPost);
  const recentPosts = [
    ...existingPosts,
    ...(((await supabase
      .from("social_posts")
      .select("*, social_post_publications(*)")
      .not("status", "eq", "canceled")
      .order("created_at", { ascending: false })
      .limit(12)).data ?? []) as any[]).map(normalizeSocialPost)
  ];

  const created: SocialPostModel[] = [];

  for (const dateKey of dateKeys) {
    for (const entry of enabledEntries) {
      const existing = existingPosts.find(
        (post) =>
          post.source_date === dateKey &&
          post.schedule_entry_id === entry.id &&
          post.status !== "canceled"
      );

      if (existing && !options?.force) {
        continue;
      }

      const seed = `${dateKey}:${entry.id}`;
      const product = pickProductForQueue(products, [...created, ...recentPosts], seed);
      const scheduledForDate = zonedDateTimeToUtc(dateKey, entry.time, settings.timezone);

      if (!options?.force && scheduledForDate.getTime() < now.getTime() - 5 * 60 * 1000) {
        continue;
      }

      const copy = await generateSocialCopy({
        product,
        settings,
        slotLabel: entry.label,
        recentCaptions: recentPosts.map((post) => post.caption_en)
      });
      const scheduledFor = scheduledForDate.toISOString();
      const payload = {
        product_id: product.id,
        created_by: options?.createdBy ?? null,
        source_kind: "automation",
        schedule_entry_id: entry.id,
        schedule_entry_label: entry.label,
        source_date: dateKey,
        scheduled_for: scheduledFor,
        status: "scheduled",
        platforms: entry.platforms,
        product_name: product.name,
        product_price: product.base_price,
        product_description: product.description ?? product.short_description ?? null,
        image_url: buildPublicImageUrl(product),
        caption_en: copy.caption_en,
        caption_es: copy.caption_es,
        cta_en: copy.cta_en,
        cta_es: copy.cta_es,
        combined_caption: copy.combined_caption,
        hashtags: copy.hashtags,
        generation_notes: copy.generation_notes,
        last_error: null
      };

      if (existing && options?.force) {
        const { data, error } = await supabase
          .from("social_posts")
          .update(payload)
          .eq("id", existing.id)
          .select("*, social_post_publications(*)")
          .single();

        if (error) {
          throw error;
        }

        await insertPublicationPlaceholders(supabase, data.id, entry.platforms);
        created.push(normalizeSocialPost(data));
        continue;
      }

      const { data, error } = await supabase
        .from("social_posts")
        .insert(payload)
        .select("*, social_post_publications(*)")
        .single();

      if (error) {
        throw error;
      }

      await insertPublicationPlaceholders(supabase, data.id, entry.platforms);
      created.push(normalizeSocialPost({ ...data, social_post_publications: [] }));
    }
  }

  return { created, settings };
}

export async function createManualSocialDraft(createdBy?: string | null) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createAdminClient() as any;
  const settings = await getOrCreateSocialPostSettings(supabase);
  const products = await getEligibleProducts(supabase);

  if (products.length === 0) {
    throw new Error("Add at least one active product with an image before creating a draft.");
  }

  const { data: recentRows } = await supabase
    .from("social_posts")
    .select("*, social_post_publications(*)")
    .order("created_at", { ascending: false })
    .limit(6);
  const recentPosts = ((recentRows ?? []) as any[]).map(normalizeSocialPost);
  const entry = settings.schedule_entries.find((item) => item.enabled) ?? DEFAULT_SCHEDULE[0];
  const product = pickProductForQueue(products, recentPosts, `${new Date().toISOString()}:${randomUUID()}`);
  const copy = await generateSocialCopy({
    product,
    settings,
    slotLabel: entry.label,
    recentCaptions: recentPosts.map((post) => post.caption_en)
  });
  const payload = {
    product_id: product.id,
    created_by: createdBy ?? null,
    source_kind: "manual",
    schedule_entry_id: null,
    schedule_entry_label: "Manual",
    source_date: null,
    scheduled_for: new Date().toISOString(),
    status: "draft",
    platforms: entry.platforms,
    product_name: product.name,
    product_price: product.base_price,
    product_description: product.description ?? product.short_description ?? null,
    image_url: buildPublicImageUrl(product),
    caption_en: copy.caption_en,
    caption_es: copy.caption_es,
    cta_en: copy.cta_en,
    cta_es: copy.cta_es,
    combined_caption: copy.combined_caption,
    hashtags: copy.hashtags,
    generation_notes: copy.generation_notes
  };
  const { data, error } = await supabase
    .from("social_posts")
    .insert(payload)
    .select("*, social_post_publications(*)")
    .single();

  if (error) {
    throw error;
  }

  await insertPublicationPlaceholders(supabase, data.id, payload.platforms);
  return normalizeSocialPost({ ...data, social_post_publications: [] });
}

async function metaRequest(
  path: string,
  method: "GET" | "POST",
  payload?: Record<string, string>,
  accessToken = getMetaAccessToken()
) {
  const token = accessToken;
  const url = new URL(`https://graph.facebook.com/${getMetaGraphVersion()}/${path}`);

  if (method === "GET") {
    url.searchParams.set("access_token", token);

    if (payload) {
      Object.entries(payload).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { method: "GET" });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  }

  const body = new URLSearchParams({
    access_token: token,
    ...(payload ?? {})
  });
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function getFacebookPublishingToken() {
  const configuredPageToken = getConfiguredFacebookPageAccessToken();

  if (configuredPageToken) {
    return configuredPageToken;
  }

  const pageId = getFacebookPageId();
  const result = await metaRequest("me/accounts", "GET", {
    fields: "id,name,access_token,tasks"
  });
  const pages = Array.isArray(result.data) ? result.data : [];
  const page = pages.find((entry: Record<string, unknown>) => String(entry.id) === String(pageId));

  if (typeof page?.access_token === "string" && page.access_token.length > 0) {
    return page.access_token;
  }

  const availablePages = pages
    .map((entry: Record<string, unknown>) => [entry.name, entry.id].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ");

  throw new Error(
    [
      "Meta token can read /me/accounts but did not return a Page access token for META_FACEBOOK_PAGE_ID.",
      "Regenerate the System User token with pages_show_list and pages_manage_posts, or set META_FACEBOOK_PAGE_ACCESS_TOKEN to the Page access token.",
      availablePages ? `Pages returned: ${availablePages}` : "No pages were returned by /me/accounts."
    ].join(" ")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForInstagramContainer(containerId: string) {
  let lastStatus = "";

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await metaRequest(containerId, "GET", {
      fields: "status_code,status"
    });
    lastStatus = [result.status_code, result.status].filter(Boolean).join(": ");

    if (result.status_code === "FINISHED") {
      return;
    }

    if (result.status_code === "ERROR" || result.status_code === "EXPIRED") {
      throw new Error(`Instagram media container failed: ${lastStatus || "unknown status"}`);
    }

    await sleep(5000 + attempt * 1500);
  }

  throw new Error(`Instagram media was not ready for publishing after waiting. Last status: ${lastStatus || "unknown"}`);
}

function isInstagramMediaNotReadyError(error: unknown) {
  const message = getErrorMessage(error);
  return (
    message.includes("\"code\":9007") ||
    message.toLowerCase().includes("media id is not available") ||
    message.toLowerCase().includes("media is not ready")
  );
}

async function publishInstagramContainer(containerId: string) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await metaRequest(`${getInstagramBusinessId()}/media_publish`, "POST", {
        creation_id: containerId
      });
    } catch (error) {
      lastError = error;

      if (!isInstagramMediaNotReadyError(error)) {
        throw error;
      }

      await sleep(6000 + attempt * 2000);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Instagram media was not ready for publishing after retries.");
}

async function publishToFacebook(post: SocialPostModel): Promise<PublicationResult> {
  const pageAccessToken = await getFacebookPublishingToken();
  const result = await metaRequest(`${getFacebookPageId()}/photos`, "POST", {
    url: post.image_url,
    caption: post.combined_caption,
    published: "true"
  }, pageAccessToken);

  const metrics = await fetchFacebookMetrics(result.post_id ?? result.id, pageAccessToken).catch(() => null);

  return {
    platform: "facebook",
    status: "published",
    remote_media_id: result.post_id ?? result.id ?? null,
    remote_permalink: metrics?.remote_permalink ?? null,
    metrics: metrics?.metrics ?? null,
    published_at: new Date().toISOString()
  };
}

async function publishToInstagram(post: SocialPostModel): Promise<PublicationResult> {
  const container = await metaRequest(`${getInstagramBusinessId()}/media`, "POST", {
    image_url: post.image_url,
    caption: post.combined_caption
  });
  await waitForInstagramContainer(container.id);
  const published = await publishInstagramContainer(container.id);
  const metrics = await fetchInstagramMetrics(published.id).catch(() => null);

  return {
    platform: "instagram",
    status: "published",
    remote_media_id: published.id ?? null,
    remote_permalink: metrics?.remote_permalink ?? null,
    metrics: metrics?.metrics ?? null,
    published_at: new Date().toISOString()
  };
}

async function fetchInstagramMetrics(mediaId: string) {
  const result = await metaRequest(mediaId, "GET", {
    fields: "id,permalink,like_count,comments_count,timestamp"
  });

  return {
    remote_permalink: result.permalink ?? null,
    metrics: {
      like_count: typeof result.like_count === "number" ? result.like_count : null,
      comments_count: typeof result.comments_count === "number" ? result.comments_count : null,
      timestamp: typeof result.timestamp === "string" ? result.timestamp : null
    }
  };
}

async function fetchFacebookMetrics(mediaId: string, accessToken = getMetaAccessToken()) {
  const result = await metaRequest(mediaId, "GET", {
    fields: "id,permalink_url,reactions.summary(total_count),comments.summary(total_count)"
  }, accessToken);

  return {
    remote_permalink: result.permalink_url ?? null,
    metrics: {
      reactions:
        typeof result.reactions?.summary?.total_count === "number"
          ? result.reactions.summary.total_count
          : null,
      comments:
        typeof result.comments?.summary?.total_count === "number"
          ? result.comments.summary.total_count
          : null
    }
  };
}

async function savePublicationResult(supabase: any, postId: string, result: PublicationResult) {
  const { error } = await supabase.from("social_post_publications").upsert(
    {
      social_post_id: postId,
      platform: result.platform,
      status: result.status,
      remote_media_id: result.remote_media_id ?? null,
      remote_permalink: result.remote_permalink ?? null,
      published_at: result.published_at ?? null,
      error_message: result.error_message ?? null,
      metrics: result.metrics ?? null
    },
    { onConflict: "social_post_id,platform" }
  );

  if (error) {
    throw error;
  }
}

export async function publishSocialPostById(postId: string) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("social_posts")
    .select("*, social_post_publications(*)")
    .eq("id", postId)
    .single();

  if (error || !data) {
    throw error ?? new Error("Social post not found.");
  }

  const post = normalizeSocialPost(data);

  if (post.status === "published") {
    return { post, results: [] as PublicationResult[] };
  }

  await supabase
    .from("social_posts")
    .update({
      status: "publishing",
      last_error: null
    })
    .eq("id", postId);

  const results: PublicationResult[] = [];

  for (const platform of post.platforms) {
    try {
      const result =
        platform === "facebook" ? await publishToFacebook(post) : await publishToInstagram(post);
      await savePublicationResult(supabase, post.id, result);
      results.push(result);
    } catch (error) {
      const failedResult: PublicationResult = {
        platform,
        status: "failed",
        error_message: getErrorMessage(error),
        published_at: null
      };
      await savePublicationResult(supabase, post.id, failedResult);
      results.push(failedResult);
    }
  }

  const failures = results.filter((result) => result.status === "failed");
  const postStatus = failures.length > 0 ? "failed" : "published";
  const lastError = failures.map((failure) => `${failure.platform}: ${failure.error_message}`).join(" | ") || null;
  const publishedAt = postStatus === "published" ? new Date().toISOString() : null;

  await supabase
    .from("social_posts")
    .update({
      status: postStatus,
      published_at: publishedAt,
      last_error: lastError
    })
    .eq("id", post.id);

  const { data: updated } = await supabase
    .from("social_posts")
    .select("*, social_post_publications(*)")
    .eq("id", post.id)
    .single();

  return {
    post: normalizeSocialPost(updated),
    results
  };
}

export async function processDueSocialPosts() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createAdminClient() as any;
  const settings = await getOrCreateSocialPostSettings(supabase);

  if (!settings.automation_enabled) {
    return { processed: [], skipped: true };
  }

  const { data } = await supabase
    .from("social_posts")
    .select("id")
    .in("status", ["scheduled", "failed"])
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(10);

  const processed = [];

  for (const row of (data ?? []) as { id: string }[]) {
    processed.push(await publishSocialPostById(row.id));
  }

  return { processed, skipped: false };
}

export async function refreshSocialPostMetrics(postId?: string) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createAdminClient() as any;
  let query = supabase
    .from("social_post_publications")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  if (postId) {
    query = query.eq("social_post_id", postId);
  }

  const { data } = await query;
  const updated: SocialPostPublicationModel[] = [];

  for (const row of (data ?? []) as any[]) {
    if (!row.remote_media_id) {
      continue;
    }

    try {
      const next =
        row.platform === "instagram"
          ? await fetchInstagramMetrics(row.remote_media_id)
          : await fetchFacebookMetrics(row.remote_media_id);

      const payload = {
        metrics: next.metrics ?? null,
        remote_permalink: next.remote_permalink ?? row.remote_permalink ?? null
      };

      const { data: saved } = await supabase
        .from("social_post_publications")
        .update(payload)
        .eq("id", row.id)
        .select("*")
        .single();

      updated.push(normalizeSocialPostPublication(saved));
    } catch {
      continue;
    }
  }

  return updated;
}

export async function verifySocialAutomationSecret(secret: string | null | undefined) {
  try {
    return secret === getSocialAutomationSecret();
  } catch {
    return false;
  }
}
