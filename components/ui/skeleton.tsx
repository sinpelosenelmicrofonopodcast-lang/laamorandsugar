import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[length:200%_100%] bg-[linear-gradient(90deg,rgba(255,255,255,0.4),rgba(248,217,221,0.55),rgba(255,255,255,0.4))] animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
