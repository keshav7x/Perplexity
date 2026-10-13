"use client";

import { useAppSelector } from "@/store/hooks";

export function TopBar({ title }: { title: string }) {
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  return (
    <header
      className={`sticky top-0 z-10 border-b border-ink-700 bg-ink-950/80 backdrop-blur ${
        sidebarOpen ? "" : "pl-12"
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        <h1 className="truncate text-sm font-medium text-zinc-200">{title}</h1>
      </div>
    </header>
  );
}
