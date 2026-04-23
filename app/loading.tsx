import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-24">
      <div className="space-y-5">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-[360px] w-full rounded-[2rem]" />
      </div>
    </div>
  );
}
