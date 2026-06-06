"use client";

import dynamic from "next/dynamic";

import type { TreatDesignerConfig } from "@/lib/types/app";

const TreatDesigner = dynamic(
  () => import("@/components/TreatDesigner").then((module) => module.TreatDesigner),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <div className="h-20 animate-pulse rounded-[1.75rem] border border-white/80 bg-white/70 shadow-card" />
          <div className="h-[32rem] animate-pulse rounded-[2rem] border border-white/80 bg-white/78 shadow-card" />
        </div>
        <div className="h-[28rem] animate-pulse rounded-[2rem] border border-white/80 bg-white/78 shadow-card" />
      </div>
    )
  }
);

export function TreatDesignerLoader({
  config,
  initialPresetSlug
}: {
  config: TreatDesignerConfig;
  initialPresetSlug?: string;
}) {
  return <TreatDesigner config={config} initialPresetSlug={initialPresetSlug} />;
}
