"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { IconButton, PrimaryButton } from "@/components/controls";
import {
  useArchiveConversation,
  useConversations,
  useDeleteConversation,
  useRenameConversation,
} from "@/features/conversations.hooks";
import { ApiError } from "@/lib/api-client";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function LibraryInner() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useConversations();
  const rename = useRenameConversation();
  const remove = useDeleteConversation();
  const archive = useArchiveConversation(true);
  const unarchive = useArchiveConversation(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saveRename = (conversationId: number) => {
    if (!draft.trim()) {
      setEditingId(null);
      return;
    }
    setError(null);
    rename.mutate(
      { conversationId, title: draft.trim() },
      {
        onSuccess: () => setEditingId(null),
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : "Couldn't rename thread."),
      },
    );
  };

  const items = data?.items ?? [];

  return (
    <div className="flex h-screen bg-canvas text-primary">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title="Library"
          caption={items.length > 0 ? `${items.length} threads` : undefined}
        />
        <div className="nice-scroll mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}
          {isLoading ? (
            <div className="animate-pulse" aria-label="Loading library">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-b border-line py-3.5">
                  <div className="h-4 w-2/3 rounded bg-raised" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorBanner
              message="Couldn't load your library."
              onRetry={() => void refetch()}
              retryLabel="Reload"
            />
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-[15px] font-medium">No threads yet</p>
              <p className="mt-1 max-w-xs text-sm text-secondary">
                Ask your first question and it will show up here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line border-b border-line">
              {items.map((c) => (
                <li key={c.id} className="group flex items-center gap-1 py-1">
                  {editingId === c.id ? (
                    <div className="flex flex-1 items-center gap-2 py-2">
                      <label htmlFor={`rename-${c.id}`} className="sr-only">
                        Rename thread
                      </label>
                      <input
                        id={`rename-${c.id}`}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(c.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="min-w-0 flex-1 rounded-md border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-accent"
                      />
                      <PrimaryButton
                        onClick={() => saveRename(c.id)}
                        className="!px-2.5 !py-1 !text-[13px]"
                      >
                        Save
                      </PrimaryButton>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/c/${c.id}`)}
                        className="min-w-0 flex-1 truncate py-2 text-left text-sm text-primary"
                      >
                        {c.title}
                        {c.isArchived && (
                          <span className="ml-2 rounded border border-line bg-raised px-1.5 py-px text-[11px] font-normal text-tertiary">
                            archived
                          </span>
                        )}
                      </button>
                      <span className="hidden shrink-0 text-xs tabular-nums text-tertiary sm:inline">
                        {formatDate(c.createdAt)}
                      </span>
                      <span className="hidden shrink-0 gap-0.5 group-hover:flex">
                        <IconButton
                          label="Rename thread"
                          onClick={() => {
                            setEditingId(c.id);
                            setDraft(c.title);
                          }}
                        >
                          <span className="px-1 text-xs">Rename</span>
                        </IconButton>
                        <IconButton
                          label={c.isArchived ? "Unarchive thread" : "Archive thread"}
                          onClick={() =>
                            c.isArchived
                              ? unarchive.mutate(c.id)
                              : archive.mutate(c.id)
                          }
                        >
                          <span className="px-1 text-xs">
                            {c.isArchived ? "Unarchive" : "Archive"}
                          </span>
                        </IconButton>
                        <IconButton
                          label="Delete thread"
                          onClick={() => remove.mutate(c.id)}
                          className="hover:!text-red-600 dark:hover:!text-red-400"
                        >
                          <span className="px-1 text-xs">Delete</span>
                        </IconButton>
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
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
