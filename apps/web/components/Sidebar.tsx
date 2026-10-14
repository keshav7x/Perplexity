"use client";

import { FolderKanban, Library, LogOut, Moon, PanelLeft, Search, Sun, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useConversations, useDeleteConversation } from "@/features/conversations.hooks";
import { useProjects } from "@/features/projects.hooks";
import { useLogout, useMe } from "@/features/auth.hooks";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveConversation, toggleSidebar } from "@/store/slices/uiSlice";
import { IconButton } from "./controls";
import { StartChatButton } from "./StartChatButton";
import { useTheme } from "./ThemeProvider";

function NavLink({
  href,
  active,
  children,
  onNavigate,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px]",
        active
          ? "bg-raised font-medium text-primary"
          : "text-secondary hover:bg-raised/60 hover:text-primary",
      )}
    >
      {children}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const { theme, toggle } = useTheme();
  const { data: user } = useMe(false);
  const { data: conversations, isLoading: conversationsLoading } =
    useConversations();
  const { data: projects } = useProjects();
  const deleteConversation = useDeleteConversation();
  const logout = useLogout();
  const [filter, setFilter] = useState("");

  const closeOnMobile = () => {
    if (window.innerWidth < 768) dispatch(toggleSidebar());
  };

  const threads = (conversations?.items ?? []).filter((c) =>
    c.title.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <>
      {/* Reopen affordance when the sidebar is collapsed. */}
      {!sidebarOpen && (
        <div className="fixed left-3 top-3 z-40">
          <IconButton
            label="Open sidebar"
            onClick={() => dispatch(toggleSidebar())}
            className="border border-line bg-surface shadow-lift"
          >
            <PanelLeft size={16} />
          </IconButton>
        </div>
      )}

      {/* Mobile scrim. */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => dispatch(toggleSidebar())}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] shrink-0 flex-col border-r border-line bg-surface transition-transform duration-200",
          "md:static md:z-auto md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <Link
            href="/"
            onClick={closeOnMobile}
            className="text-[15px] font-semibold tracking-tight text-primary"
          >
            perplexity
          </Link>
          <IconButton
            label="Close sidebar"
            onClick={() => dispatch(toggleSidebar())}
          >
            <X size={15} className="md:hidden" />
            <PanelLeft size={15} className="hidden md:block" />
          </IconButton>
        </div>

        <nav aria-label="Primary" className="space-y-0.5 px-2.5 pt-3">
          <div className="pb-2">
            <StartChatButton />
          </div>
          <NavLink
            href="/library"
            active={pathname === "/library"}
            onNavigate={closeOnMobile}
          >
            <Library size={14} /> Library
          </NavLink>
          <NavLink
            href="/projects"
            active={pathname.startsWith("/projects")}
            onNavigate={closeOnMobile}
          >
            <FolderKanban size={14} /> Projects
            <span className="ml-auto text-xs tabular-nums text-tertiary">
              {projects?.items.length ?? 0}
            </span>
          </NavLink>
        </nav>

        <div className="mt-4 flex min-h-0 flex-1 flex-col px-2.5">
          <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-tertiary">
            History
          </p>
          <div className="relative mb-1.5">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"
            />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search history"
              aria-label="Search history"
              className="w-full rounded-md border border-transparent bg-canvas py-1.5 pl-8 pr-2 text-[13px] text-primary outline-none placeholder:text-tertiary focus:border-line"
            />
          </div>
          <div className="nice-scroll min-h-0 flex-1 overflow-y-auto pb-2">
            {conversationsLoading ? (
              <div className="animate-pulse space-y-1.5 px-0.5 pt-1" aria-label="Loading history">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 rounded-md bg-raised"
                    style={{ opacity: 1 - i * 0.12 }}
                  />
                ))}
              </div>
            ) : (
              <ul className="space-y-px">
                {threads.map((c) => {
                  const active = pathname === `/c/${c.id}`;
                  return (
                    <li
                      key={c.id}
                      className={cn(
                        "group flex items-center gap-1 rounded-md pl-2.5 pr-1 py-1.5",
                        active ? "bg-raised" : "hover:bg-raised/60",
                      )}
                    >
                      <Link
                        href={`/c/${c.id}`}
                        onClick={() => {
                          dispatch(setActiveConversation(c.id));
                          closeOnMobile();
                        }}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "min-w-0 flex-1 truncate text-[13px]",
                          active ? "font-medium text-primary" : "text-secondary group-hover:text-primary",
                        )}
                        title={c.title}
                      >
                        {c.title}
                      </Link>
                      <IconButton
                        label={`Delete "${c.title}"`}
                        onClick={() => deleteConversation.mutate(c.id)}
                        className="hidden hover:!bg-transparent group-hover:inline-flex hover:!text-red-600 dark:hover:!text-red-400"
                      >
                        <Trash2 size={13} />
                      </IconButton>
                    </li>
                  );
                })}
                {threads.length === 0 && (
                  <li className="px-2.5 py-2 text-xs text-tertiary">
                    {filter.trim()
                      ? "No threads match your search."
                      : "No searches yet."}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-line p-2.5">
          <div className="flex items-center gap-2 rounded-md px-1.5 py-1">
            <div
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-secondary"
            >
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-primary">
                {user?.name ?? "…"}
              </p>
              <p className="truncate text-xs text-tertiary">{user?.email ?? ""}</p>
            </div>
            <IconButton
              label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggle}
            >
              {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            </IconButton>
            <IconButton
              label="Log out"
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => router.replace("/login"),
                })
              }
            >
              <LogOut size={14} />
            </IconButton>
          </div>
        </div>
      </aside>
    </>
  );
}
