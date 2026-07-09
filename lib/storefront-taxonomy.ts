export const shopCategoryLinks = [
  { label: "Chocolate Covered Strawberries", href: "/collections/chocolate-covered-strawberries", keywords: ["strawberry", "berry"] },
  { label: "Cake Pops", href: "/collections/cake-pops", keywords: ["cake pop"] },
  { label: "Cakesicles", href: "/collections/cakesicles", keywords: ["cakesicle"] },
  { label: "Chocolate Covered Cookies", href: "/collections/chocolate-covered-cookies", keywords: ["cookie", "oreo"] },
  { label: "Rice Krispies Treats", href: "/collections/rice-krispies-treats", keywords: ["rice krisp"] },
  { label: "Chocolate Covered Pretzels", href: "/collections/chocolate-covered-pretzels", keywords: ["pretzel"] },
  { label: "Chocolate Covered Marshmallows", href: "/collections/chocolate-covered-marshmallows", keywords: ["marshmallow"] },
  { label: "Dessert Boxes", href: "/collections/dessert-boxes", keywords: ["box", "bundle"] },
  { label: "Party Packages", href: "/custom-orders?occasion=party", keywords: ["party", "event"] }
] as const;

export const occasionLinks = [
  { label: "Birthday", slug: "birthday", description: "Gift-ready treats for birthdays, surprise boxes, dessert tables, and milestone parties." },
  { label: "Baby Shower", slug: "baby-shower", description: "Soft colors, elegant packaging, and custom details for baby shower dessert moments." },
  { label: "Wedding", slug: "wedding", description: "Luxury sweets for favors, dessert displays, bridal suites, and celebration tables." },
  { label: "Bridal Shower", slug: "bridal-shower", description: "Polished treats for bridal showers, proposals, and pre-wedding gifting." },
  { label: "Graduation", slug: "graduation", description: "Custom colors, school themes, and gift boxes for Central Texas graduation season." },
  { label: "Corporate Events", slug: "corporate-events", description: "Branded dessert gifts, client boxes, logo treats, and office celebration sweets." },
  { label: "Military Promotions", slug: "military-promotions", description: "Elegant treats for Fort Cavazos promotions, retirements, ceremonies, and family celebrations." },
  { label: "Retirement", slug: "retirement", description: "Thoughtful sweets for retirement parties, farewell gifts, and appreciation moments." },
  { label: "Anniversary", slug: "anniversary", description: "Romantic strawberries, dessert boxes, and custom details for anniversaries." },
  { label: "Gender Reveal", slug: "gender-reveal", description: "Custom colors and reveal-friendly treats for sweet family announcements." },
  { label: "Holiday Collection", slug: "holiday", description: "Seasonal gift boxes and limited sweets for holidays and family gatherings." },
  { label: "Christmas", slug: "christmas", description: "Holiday dessert gifts for parties, teachers, families, and corporate gifting." },
  { label: "Valentine's Day", slug: "valentines-day", description: "Romantic chocolate covered treats, berries, boxes, and custom love notes." },
  { label: "Mother's Day", slug: "mothers-day", description: "Elegant dessert gifts for moms, grandmothers, and mother figures." },
  { label: "Father's Day", slug: "fathers-day", description: "Chocolate treats and gift boxes for Father's Day celebrations." },
  { label: "Halloween", slug: "halloween", description: "Seasonal custom treats for Halloween parties, school gifts, and dessert tables." },
  { label: "Easter", slug: "easter", description: "Spring dessert boxes and colorful sweets for Easter gatherings." }
] as const;

export const localServiceAreas = [
  "Killeen",
  "Fort Cavazos",
  "Harker Heights",
  "Copperas Cove",
  "Temple",
  "Belton",
  "Central Texas"
] as const;

export function getOccasionHref(slug: string) {
  return `/occasions/${slug}`;
}
