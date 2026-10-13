"use client";

import { motion } from "framer-motion";
import { ArrowUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  pending: boolean;
  placeholder?: string;
  initialValue?: string;
}

export function ChatInput({
  onSend,
  pending,
  placeholder = "Ask anything…",
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="rounded-2xl border border-ink-700 bg-ink-900 p-2 shadow-xl"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-3 pt-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
      />
      <div className="flex items-center justify-between px-2 pb-1">
        <p className="text-[11px] text-zinc-500">Enter to send · Shift+Enter newline</p>
        <button
          onClick={submit}
          disabled={pending || !value.trim()}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            pending || !value.trim()
              ? "bg-ink-700 text-zinc-500"
              : "bg-accent-500 text-black hover:bg-accent-400",
          )}
          aria-label="Send message"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
        </button>
      </div>
    </motion.div>
  );
}
