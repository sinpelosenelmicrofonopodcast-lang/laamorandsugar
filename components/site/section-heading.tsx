import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as = "h2",
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  const Heading = as;

  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-bakery-gold">
          {eyebrow}
        </p>
      ) : null}
      <Heading className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
        {title}
      </Heading>
      {description ? (
        <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
