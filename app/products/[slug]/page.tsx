import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/site/product-detail-client";
import { SectionHeading } from "@/components/site/section-heading";
import { getProductBySlug } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/config/site";
import { resolveImageUrl } from "@/lib/utils";

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
    title: product.name,
    description: product.short_description ?? product.description ?? undefined,
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
    <div className="container py-16">
      <SectionHeading
        eyebrow={product.categories?.name ?? "Signature Treat"}
        title={product.name}
        description={product.short_description ?? undefined}
      />
      <div className="mt-10">
        <ProductDetailClient product={product} />
      </div>
    </div>
  );
}
