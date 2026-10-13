"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: ChatMessage[]; // newest-first from API
  onEdit: (chatId: number, message: string) => void;
  onDelete: (chatId: number) => void;
  streaming?: boolean;
}

export function MessageList({ messages, onEdit, onDelete, streaming }: MessageListProps) {
  const chronological = [...messages].reverse();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-6">
      <AnimatePresence initial={false}>
        {chronological.map((m) => {
          const isUser = m.sender === "user";
          return (
            <motion.div
              key={m.id}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn("flex", isUser ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "group max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  isUser
                    ? "bg-ink-700 text-zinc-100"
                    : "border border-ink-700 bg-ink-900 text-zinc-200",
                )}
              >
                {editingId === m.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-ink-700 bg-ink-950 p-2 text-sm outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (draft.trim()) onEdit(m.id, draft.trim());
                          setEditingId(null);
                        }}
                        className="rounded-lg bg-accent-500 px-3 py-1 text-xs font-medium text-black"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-ink-700 px-3 py-1 text-xs text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="ai-body whitespace-pre-wrap">{m.message}</div>
                    {isUser && (
                      <div className="mt-1 hidden gap-1 group-hover:flex">
                        <button
                          onClick={() => {
                            setEditingId(m.id);
                            setDraft(m.message);
                          }}
                          className="rounded p-1 text-zinc-500 hover:text-zinc-200"
                          aria-label="Edit message"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => onDelete(m.id)}
                          className="rounded p-1 text-zinc-500 hover:text-red-400"
                          aria-label="Delete message"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {streaming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-zinc-500"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-500" />
          Generating answer…
        </motion.div>
      )}
    </div>
  );
}
