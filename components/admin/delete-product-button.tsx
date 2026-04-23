"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProductAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  productId,
  productName,
  redirectTo = "/admin/products",
  variant = "ghost",
  size = "sm"
}: {
  productId: string;
  productName: string;
  redirectTo?: Route;
  variant?: "ghost" | "outline";
  size?: "sm" | "icon";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isPending}
      onClick={() => {
        const confirmed = window.confirm(
          `Delete "${productName}"? This will remove the product from the storefront.`
        );

        if (!confirmed) {
          return;
        }

        startTransition(async () => {
          const result = await deleteProductAction(productId);

          if (result.error) {
            toast.error(result.error);
            return;
          }

          toast.success("Product deleted");
          router.push(redirectTo);
          router.refresh();
        });
      }}
    >
      <Trash2 className="h-4 w-4" />
      {size === "sm" ? "Delete" : null}
    </Button>
  );
}
