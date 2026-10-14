"use client";

import { cn } from "@/lib/utils";

/** Flat loading placeholders in token colors. */
export function ThreadSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading thread">
      <div className="h-6 w-2/3 rounded bg-raised" />
      <div className="mt-6 space-y-2 border-b border-line pb-6">
        <div className="h-4 w-11/12 rounded bg-raised" />
        <div className="h-4 w-full rounded bg-raised" />
        <div className="h-4 w-3/4 rounded bg-raised" />
      </div>
      <div className="mt-6 h-6 w-1/2 rounded bg-raised" />
      <div className="mt-6 space-y-2">
        <div className="h-4 w-full rounded bg-raised" />
        <div className="h-4 w-5/6 rounded bg-raised" />
      </div>
    </div>
  );
}

/** Skeleton rows for sidebar / list views. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-1.5" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn("h-8 rounded-md bg-raised")}
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
