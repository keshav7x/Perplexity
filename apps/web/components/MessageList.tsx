"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { GeneratingIndicator } from "./GeneratingIndicator";
import { Markdown } from "./Markdown";

interface MessageListProps {
  messages: ChatMessage[]; // newest-first from API
  onEdit: (chatId: number, message: string) => void;
  onDelete: (chatId: number) => void;
  generating: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        void copyText(text).then((ok) => {
          if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }
        });
      }}
      className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs text-tertiary transition-colors hover:bg-raised hover:text-secondary"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function MessageList({ messages, onEdit, onDelete, generating }: MessageListProps) {
  const chronological = [...messages].reverse();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div>
      {chronological.map((m) => {
        const isUser = m.sender === "user";

        if (isUser) {
          return (
            <section key={m.id} aria-label="Your question" className="group pt-2">
              {editingId === m.id ? (
                <div className="space-y-2">
                  <label htmlFor={`edit-${m.id}`} className="sr-only">
                    Edit question
                  </label>
                  <textarea
                    id={`edit-${m.id}`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full resize-none rounded-lg border border-line bg-surface p-3 text-[15px] outline-none focus:border-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (draft.trim() && m.id > 0) onEdit(m.id, draft.trim());
                        setEditingId(null);
                      }}
                      className="rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white hover:bg-accent-deep"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-secondary hover:bg-raised"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2
                    className={`text-[19px] font-medium leading-snug tracking-tight text-primary ${
                      m.pending ? "opacity-60" : ""
                    }`}
                  >
                    {m.message}
                  </h2>
                  {!m.pending && m.id > 0 && (
                    <div className="mt-1 hidden gap-1 group-hover:flex">
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setDraft(m.message);
                        }}
                        className="rounded px-1 py-0.5 text-xs text-tertiary hover:bg-raised hover:text-secondary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(m.id)}
                        className="rounded px-1 py-0.5 text-xs text-tertiary hover:bg-raised hover:text-red-600 dark:hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          );
        }

        return (
          <section key={m.id} aria-label="Answer" className="border-b border-line py-5">
            <Markdown text={m.message} />
            <div className="mt-3 flex items-center gap-2">
              <CopyButton text={m.message} />
              {formatTime(m.createdAt) && (
                <span className="text-xs text-tertiary">
                  {formatTime(m.createdAt)}
                </span>
              )}
            </div>
          </section>
        );
      })}

      {generating && (
        <section aria-label="Researching" aria-live="polite" className="border-b border-line py-5">
          <GeneratingIndicator />
        </section>
      )}
    </div>
  );
}
