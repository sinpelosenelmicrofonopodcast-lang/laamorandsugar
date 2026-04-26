import { Badge } from "@/components/ui/badge";

const statusVariantMap: Record<string, "default" | "gold" | "rose" | "outline"> = {
  pending: "outline",
  pending_review: "outline",
  confirmed: "default",
  payment_pending: "outline",
  paid: "default",
  in_progress: "gold",
  ready: "rose",
  ready_for_pickup: "rose",
  out_for_delivery: "gold",
  delivered: "default",
  canceled: "outline",
  cancelled: "outline",
  new: "outline",
  reviewing: "gold",
  quoted: "rose",
  approved: "default",
  declined: "outline",
  completed: "default"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariantMap[status] ?? "outline"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
