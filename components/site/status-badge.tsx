import { Badge } from "@/components/ui/badge";

const statusVariantMap: Record<string, "default" | "gold" | "rose" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  in_progress: "gold",
  ready: "rose",
  delivered: "default",
  canceled: "outline",
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
