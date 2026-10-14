"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { focusComposer, setActiveConversation } from "@/store/slices/uiSlice";

interface StartChatButtonProps {
  /** "full" = primary sidebar CTA, "compact" = quiet header button. */
  variant?: "full" | "compact";
  className?: string;
}

/**
 * Primary CTA: clears the active thread, routes home, and focuses the
 * search box so the user can type immediately.
 */
export function StartChatButton({
  variant = "full",
  className,
}: StartChatButtonProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const startChat = () => {
    dispatch(setActiveConversation(null));
    dispatch(focusComposer());
    router.push("/");
  };

  if (variant === "compact") {
    return (
      <button
        onClick={startChat}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium text-primary transition-colors hover:bg-raised",
          className,
        )}
      >
        <Plus size={14} />
        <span className="hidden sm:inline">New search</span>
        <span className="sm:hidden">New</span>
      </button>
    );
  }

  return (
    <button
      onClick={startChat}
      className={cn(
        "inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep",
        className,
      )}
    >
      <Plus size={15} />
      New search
    </button>
  );
}
