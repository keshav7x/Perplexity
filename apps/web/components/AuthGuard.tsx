"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/features/auth.hooks";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && data === null) {
      router.replace("/login");
    }
  }, [data, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="flex items-center gap-2 text-sm text-secondary" role="status">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Checking session…
        </div>
      </div>
    );
  }

  if (data === null) return null;

  return <>{children}</>;
}
