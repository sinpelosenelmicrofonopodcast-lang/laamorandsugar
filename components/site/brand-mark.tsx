import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative overflow-hidden",
          compact ? "h-[4.25rem] w-[11rem] sm:w-[12.5rem]" : "h-[5.75rem] w-[15rem] sm:h-[6.5rem] sm:w-[18rem]"
        )}
      >
        <Image
          src="/brand/la-logo-official.png"
          alt="L&A Amor & Sugar Co."
          fill
          priority
          className="object-contain object-left transition duration-500 group-hover:scale-[1.01]"
        />
      </div>
    </Link>
  );
}
