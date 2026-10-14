"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

interface ChatInputProps {
  onSend: (message: string) => void;
  pending: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

const MAX_HEIGHT = 200;

export function ChatInput({
  onSend,
  pending,
  placeholder = "Ask anything…",
  autoFocus = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const focusKey = useAppSelector((s) => s.ui.composerFocusKey);
  const mountedRef = useRef(false);

  // Auto-grow up to MAX_HEIGHT, then scroll internally.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value ]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // "New search" action focuses the box on every press.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    ref.current?.focus();
  }, [focusKey]);

  const canSend = value.trim().length > 0 && !pending;

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      if (ref.current) ref.current.style.height = "auto";
      ref.current?.focus();
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-surface transition-colors",
        focused && !pending ? "border-accent" : "border-line",
        pending && "opacity-80",
      )}
    >
      <label htmlFor="search-input" className="sr-only">
        Ask a question
      </label>
      <textarea
        ref={ref}
        id="search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder={pending ? "Researching…" : placeholder}
        disabled={pending}
        className="nice-scroll max-h-[200px] w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] leading-relaxed text-primary outline-none placeholder:text-tertiary disabled:opacity-60"
      />
      <div className="flex items-center justify-between px-2.5 pb-2.5 pt-1">
        <p className="pl-1.5 text-xs text-tertiary">
          <kbd className="rounded border border-line bg-canvas px-1 font-sans text-[11px]">
            ↵
          </kbd>{" "}
          to send
        </p>
        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send question"
          className={cn(
            "inline-flex items-center justify-center rounded-lg p-2 transition-colors",
            canSend
              ? "bg-accent text-white hover:bg-accent-deep"
              : "cursor-not-allowed bg-raised text-tertiary",
          )}
        >
          <ArrowUp size={16} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
