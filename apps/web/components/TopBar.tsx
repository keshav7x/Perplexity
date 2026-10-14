"use client";

import { PanelLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { IconButton } from "./controls";
import { StartChatButton } from "./StartChatButton";

export function TopBar({ title, caption }: { title: string; caption?: string }) {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
      <div
        className={`mx-auto flex w-full max-w-3xl items-center gap-1.5 px-4 py-2.5 ${
          sidebarOpen ? "" : "pl-12 md:pl-4"
        }`}
      >
        <IconButton
          label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          onClick={() => dispatch(toggleSidebar())}
          className="-ml-1.5"
        >
          <PanelLeft size={15} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-medium text-primary">{title}</h1>
          {caption && (
            <p className="truncate text-xs text-tertiary">{caption}</p>
          )}
        </div>
        <StartChatButton variant="compact" />
      </div>
    </header>
  );
}
