"use client";

import { motion } from "framer-motion";
import { Archive, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import {
  useArchiveConversation,
  useConversations,
  useDeleteConversation,
  useRenameConversation,
} from "@/features/conversations.hooks";

function LibraryInner() {
  const router = useRouter();
  const { data, isLoading } = useConversations();
  const rename = useRenameConversation();
  const remove = useDeleteConversation();
  const archive = useArchiveConversation(true);
  const unarchive = useArchiveConversation(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-screen bg-ink-950 text-zinc-100">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar title="Library" />
        <div className="nice-scroll mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
          {isLoading ? (
            <p className="text-sm text-zinc-500">Loading threads…</p>
          ) : (
            <div className="space-y-2">
              {(data?.items ?? []).map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3"
                >
                  {editingId === c.id ? (
                    <div className="flex flex-1 gap-2">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="flex-1 rounded-lg border border-ink-700 bg-ink-950 px-2 py-1 text-sm outline-none"
                      />
                      <button
                        onClick={() => {
                          if (draft.trim())
                            rename.mutate({ conversationId: c.id, title: draft.trim() });
                          setEditingId(null);
                        }}
                        className="rounded-lg bg-accent-500 px-3 py-1 text-xs text-black"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/c/${c.id}`)}
                        className="min-w-0 flex-1 truncate text-left text-sm"
                      >
                        {c.title}
                        {c.isArchived && (
                          <span className="ml-2 rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
                            archived
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setDraft(c.title);
                        }}
                        className="rounded p-1.5 text-zinc-500 hover:bg-ink-800 hover:text-zinc-200"
                        aria-label="Rename"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() =>
                          c.isArchived
                            ? unarchive.mutate(c.id)
                            : archive.mutate(c.id)
                        }
                        className="rounded p-1.5 text-zinc-500 hover:bg-ink-800 hover:text-zinc-200"
                        aria-label="Archive toggle"
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={() => remove.mutate(c.id)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-ink-800 hover:text-red-400"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
              {(data?.items.length ?? 0) === 0 && (
                <p className="text-sm text-zinc-500">No threads yet.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <AuthGuard>
      <LibraryInner />
    </AuthGuard>
  );
}
