"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FolderKanban,
  Library,
  LogOut,
  MessageSquarePlus,
  PanelLeft,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConversations, useDeleteConversation } from "@/features/conversations.hooks";
import { useProjects } from "@/features/projects.hooks";
import { useLogout, useMe } from "@/features/auth.hooks";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveConversation, toggleSidebar } from "@/store/slices/uiSlice";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const { data: user } = useMe(false);
  const { data: conversations } = useConversations();
  const { data: projects } = useProjects();
  const deleteConversation = useDeleteConversation();
  const logout = useLogout();

  const items = conversations?.items ?? [];

  return (
    <>
      {!sidebarOpen && (
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="fixed left-3 top-3 z-40 rounded-lg border border-ink-700 bg-ink-900 p-2 text-zinc-300 hover:bg-ink-800"
          aria-label="Open sidebar"
        >
          <PanelLeft size={18} />
        </button>
      )}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="flex h-screen w-[270px] shrink-0 flex-col border-r border-ink-700 bg-ink-900"
          >
            <div className="flex items-center justify-between px-4 pt-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                perplexity<span className="text-accent-500">·clone</span>
              </Link>
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-ink-800"
                aria-label="Close sidebar"
              >
                <PanelLeft size={18} />
              </button>
            </div>

            <div className="space-y-1 px-3 pt-4">
              <Link
                href="/"
                onClick={() => dispatch(setActiveConversation(null))}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  pathname === "/"
                    ? "bg-ink-700 text-white"
                    : "text-zinc-300 hover:bg-ink-800",
                )}
              >
                <MessageSquarePlus size={16} /> New thread
              </Link>
              <Link
                href="/library"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  pathname === "/library"
                    ? "bg-ink-700 text-white"
                    : "text-zinc-300 hover:bg-ink-800",
                )}
              >
                <Library size={16} /> Library
              </Link>
              <Link
                href="/projects"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  pathname.startsWith("/projects")
                    ? "bg-ink-700 text-white"
                    : "text-zinc-300 hover:bg-ink-800",
                )}
              >
                <FolderKanban size={16} /> Projects
                <span className="ml-auto text-xs text-zinc-500">
                  {projects?.items.length ?? 0}
                </span>
              </Link>
            </div>

            <div className="nice-scroll mt-4 flex-1 overflow-y-auto px-3">
              <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-zinc-500">
                Threads
              </p>
              <div className="space-y-0.5">
                {items.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-lg px-3 py-2 text-sm",
                      pathname === `/c/${c.id}`
                        ? "bg-ink-700 text-white"
                        : "text-zinc-300 hover:bg-ink-800",
                    )}
                  >
                    <Link
                      href={`/c/${c.id}`}
                      onClick={() => dispatch(setActiveConversation(c.id))}
                      className="min-w-0 flex-1 truncate"
                    >
                      {c.title}
                    </Link>
                    <button
                      onClick={() => deleteConversation.mutate(c.id)}
                      className="hidden rounded p-1 text-zinc-500 hover:bg-ink-700 hover:text-red-400 group-hover:block"
                      aria-label="Delete thread"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="px-3 py-2 text-xs text-zinc-500">
                    No threads yet — start one above.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-ink-700 p-3">
              <div className="flex items-center gap-2 px-1 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/20 text-sm font-semibold text-accent-400">
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm">{user?.name ?? "…"}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {user?.email ?? ""}
                  </p>
                </div>
                <button
                  onClick={() =>
                    logout.mutate(undefined, {
                      onSuccess: () => router.replace("/login"),
                    })
                  }
                  className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-ink-800"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
