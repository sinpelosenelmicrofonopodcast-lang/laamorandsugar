"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { toggleProductVisibilityAction } from "@/actions/admin";
import { Checkbox } from "@/components/ui/checkbox";

export function ProductVisibilityToggle({
  productId,
  productName,
  published
}: {
  productId: string;
  productName: string;
  published: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-2 text-xs font-semibold">
      <Checkbox
        checked={published}
        disabled={isPending}
        aria-label={`${published ? "Hide" : "Publish"} ${productName}`}
        onCheckedChange={(checked) => {
          const nextPublished = Boolean(checked);

          startTransition(async () => {
            const result = await toggleProductVisibilityAction(productId, nextPublished);

            if (result.error) {
              toast.error(result.error);
              return;
            }

            toast.success(nextPublished ? "Product published" : "Product hidden from storefront");
            router.refresh();
          });
        }}
      />
      {published ? (
        <Eye className="h-3.5 w-3.5 text-bakery-rose" />
      ) : (
        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span>{isPending ? "Saving..." : published ? "Published" : "Hidden"}</span>
    </label>
  );
}
