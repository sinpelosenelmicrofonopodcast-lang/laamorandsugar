import { SectionHeading } from "@/components/site/section-heading";
import { TestimonialCard } from "@/components/site/testimonial-card";
import { getTestimonials } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/config/site";
import type { TestimonialRow } from "@/lib/types/app";

export const metadata = buildMetadata({
  title: "Customer Reviews",
  description:
    "Read customer reviews for L&A Amor & Sugar, a Killeen, TX dessert brand for custom treats, gift boxes, and celebration sweets.",
  path: "/reviews"
});

export default async function ReviewsPage() {
  const testimonials = await getTestimonials();

  return (
    <div className="container py-16">
      <SectionHeading
        eyebrow="Reviews"
        title="Client love letters, one dessert table at a time"
        description="Sweet notes from customers who trusted us with birthdays, gifts, events, and custom dessert moments."
        as="h1"
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {testimonials.map((testimonial: TestimonialRow) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
}
