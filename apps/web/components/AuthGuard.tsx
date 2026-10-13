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
      <div className="flex h-screen items-center justify-center bg-ink-950 text-sm text-zinc-400">
        Checking session…
      </div>
    );
  }

  if (data === null) return null;

  return <>{children}</>;
}
