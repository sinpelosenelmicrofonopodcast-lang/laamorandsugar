import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  className,
  action
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-dashed border-border bg-white/70 p-8 text-center shadow-sm",
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bakery-blush/50 text-bakery-rose">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="font-serif text-2xl text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
