"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteOrderAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

type DeleteOrderButtonProps = {
  orderId: string;
  orderNumber: string;
  redirectToOrders?: boolean;
};

export function DeleteOrderButton({
  orderId,
  orderNumber,
  redirectToOrders = false
}: DeleteOrderButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size={redirectToOrders ? "sm" : "icon"}
      disabled={isPending}
      onClick={() => {
        const confirmed = window.confirm(
          `Delete order ${orderNumber}? This will permanently remove the order and its messages.`
        );

        if (!confirmed) {
          return;
        }

        startTransition(async () => {
          const result = await deleteOrderAction(orderId);

          if (result.error) {
            toast.error(result.error);
            return;
          }

          toast.success("Order deleted");

          if (redirectToOrders) {
            router.push("/admin/orders");
          }

          router.refresh();
        });
      }}
    >
      <Trash2 className={redirectToOrders ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      {redirectToOrders ? "Delete order" : <span className="sr-only">Delete order</span>}
    </Button>
  );
}
