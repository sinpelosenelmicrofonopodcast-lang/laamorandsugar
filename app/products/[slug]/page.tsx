import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/site/product-detail-client";
import { SectionHeading } from "@/components/site/section-heading";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { getProductBySlug } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/config/site";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo";
import { resolveImageUrl } from "@/lib/utils";
import { getProductDescription } from "@/lib/product-presentation";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return buildMetadata({
      title: "Product Not Found",
      path: `/products/${slug}`
    });
  }

  return buildMetadata({
    title: `${product.name} | Luxury Dessert Gifts in Killeen TX`,
    description:
      product.short_description ??
      `${product.name} from L&A Amor & Sugar is a luxury custom dessert gift in Killeen, TX. Order for birthdays, teachers, Fort Hood gifts, graduations, events, and local dessert delivery.`,
    path: `/products/${slug}`,
    image:
      resolveImageUrl(
        product.product_images.find((image) => image.is_primary) ?? product.product_images[0]
      ) ?? undefined,
    imageAlt:
      product.product_images.find((image) => image.is_primary)?.alt_text ??
      product.product_images[0]?.alt_text ??
      product.name
  });
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      {[buildBreadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }, { name: product.name, path: `/products/${product.slug}` }]), buildProductJsonLd(product)].map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="container py-16">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: product.categories?.name ?? "Menu", href: product.categories?.slug ? `/collections/${product.categories.slug.toLowerCase()}` : "/menu" },
            { name: product.name, href: `/products/${product.slug}` }
          ]}
        />
        <SectionHeading
          eyebrow={product.categories?.name ?? "Signature Treat"}
          title={product.name}
          description={product.short_description ?? getProductDescription(product)}
        />
        <div className="mt-10">
          <ProductDetailClient product={product} />
        </div>
      </div>
    </>
  );
}
