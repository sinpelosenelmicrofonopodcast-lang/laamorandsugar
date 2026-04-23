import { TestimonialManager } from "@/components/admin/testimonial-manager";
import { getTestimonials } from "@/lib/data/queries";

export default async function AdminTestimonialsPage() {
  const testimonials = await getTestimonials();

  return <TestimonialManager testimonials={testimonials} />;
}
