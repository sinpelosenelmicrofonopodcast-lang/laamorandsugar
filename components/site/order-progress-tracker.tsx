import { Check } from "lucide-react";

import {
  getOrderProgressStepIndex,
  ORDER_PROGRESS_STEPS,
  type CustomerOrderStatus
} from "@/lib/order-status";

export function OrderProgressTracker({ status }: { status: CustomerOrderStatus }) {
  const activeIndex = getOrderProgressStepIndex(status);

  return (
    <div className="grid gap-4 sm:grid-cols-5">
      {ORDER_PROGRESS_STEPS.map((step, index) => {
        const isComplete = index <= activeIndex;
        return (
          <div key={step.key} className="flex items-center gap-3 sm:flex-col sm:items-start">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                isComplete
                  ? "border-bakery-gold bg-bakery-gold text-white"
                  : "border-border bg-white text-muted-foreground"
              }`}
            >
              {isComplete ? <Check className="h-5 w-5" /> : index + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{step.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
