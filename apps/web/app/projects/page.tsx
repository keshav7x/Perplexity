"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
} from "@/features/projects.hooks";
import { ApiError } from "@/lib/api-client";

function ProjectsInner() {
  const router = useRouter();
  const { data, isLoading } = useProjects();
  const createProject = useCreateProject();
  const remove = useDeleteProject();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = () => {
    if (!title.trim()) return;
    setError(null);
    createProject.mutate(
      { title: title.trim() },
      {
        onSuccess: () => setTitle(""),
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : "Failed to create project"),
      },
    );
  };

  return (
    <div className="flex h-screen bg-ink-950 text-zinc-100">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar title="Projects" />
        <div className="nice-scroll mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-6 flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="New project title…"
              className="flex-1 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2 text-sm outline-none focus:border-accent-500"
            />
            <button
              onClick={create}
              disabled={createProject.isPending || !title.trim()}
              className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-black hover:bg-accent-400 disabled:opacity-50"
            >
              Create
            </button>
          </div>
          {error && (
            <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          {isLoading ? (
            <p className="text-sm text-zinc-500">Loading projects…</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {(data?.items ?? []).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="rounded-xl border border-ink-700 bg-ink-900 p-4"
                >
                  <button
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="block w-full truncate text-left text-sm font-medium hover:text-accent-400"
                  >
                    {p.title}
                  </button>
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                      {p.description}
                    </p>
                  )}
                  <button
                    onClick={() => remove.mutate(p.id)}
                    className="mt-2 text-xs text-zinc-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <ProjectsInner />
    </AuthGuard>
  );
}
