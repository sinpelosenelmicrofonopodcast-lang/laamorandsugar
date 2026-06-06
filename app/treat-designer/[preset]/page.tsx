import { notFound } from "next/navigation";

import { TreatDesignerLoader } from "@/components/TreatDesignerLoader";
import { TreatDesignerPaused } from "@/components/site/treat-designer-paused";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/config/site";
import { getSiteSettings, getTreatDesignerConfig } from "@/lib/data/queries";
import { buildBreadcrumbJsonLd, buildLocalServiceJsonLd } from "@/lib/seo";

const presetPages = {
  "teacher-appreciation": "Teacher Appreciation",
  "graduation-gold": "Graduation Gold",
  "luxury-pink": "Luxury Pink",
  "coffee-lover-collection": "Coffee Lover Collection",
  "romantic-luxe": "Romantic Luxe"
} as const;

type PresetPageProps = {
  params: Promise<{ preset: string }>;
};

export async function generateStaticParams() {
  return Object.keys(presetPages).map((preset) => ({ preset }));
}

export async function generateMetadata({ params }: PresetPageProps) {
  const { preset } = await params;
  const presetName = presetPages[preset as keyof typeof presetPages];

  if (!presetName) {
    return buildMetadata({
      title: "Custom Treat Designer",
      description: "Design a custom luxury dessert gift in Killeen TX.",
      path: `/treat-designer/${preset}`
    });
  }

  return buildMetadata({
    title: `${presetName} Custom Treat Design`,
    description: `Start with the ${presetName} preset and customize a luxury dessert gift with colors, drizzle, sprinkles, edible logo, and packaging in Killeen TX.`,
    path: `/treat-designer/${preset}`
  });
}

export default async function TreatDesignerPresetPage({ params }: PresetPageProps) {
  const { preset } = await params;
  const presetName = presetPages[preset as keyof typeof presetPages];

  if (!presetName) {
    notFound();
  }

  const [config, settings] = await Promise.all([getTreatDesignerConfig(), getSiteSettings()]);
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Treat Designer", path: "/treat-designer" },
      { name: presetName, path: `/treat-designer/${preset}` }
    ]),
    buildLocalServiceJsonLd({
      name: `${presetName} Custom Treat Design`,
      description: `Custom luxury dessert design preset for ${presetName} gifts in Killeen Texas.`,
      path: `/treat-designer/${preset}`
    })
  ];

  if (!settings.feature_settings.treat_designer_enabled) {
    return (
      <TreatDesignerPaused
        message={settings.feature_settings.treat_designer_disabled_message}
      />
    );
  }

  return (
    <div className="container py-12 sm:py-16">
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="mb-8 rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur">
        <Badge variant="gold">Preset design</Badge>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-foreground">
          {presetName} Treat Design
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A luxury preset is loaded for you. Adjust colors, decorations, logo, packaging,
          quantity, and notes before submitting your custom request.
        </p>
      </div>
      <TreatDesignerLoader config={config} initialPresetSlug={preset} />
    </div>
  );
}
