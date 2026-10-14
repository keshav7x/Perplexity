"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { IconButton, PrimaryButton } from "@/components/controls";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
} from "@/features/projects.hooks";
import { ApiError } from "@/lib/api-client";

function ProjectsInner() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useProjects();
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
          setError(e instanceof ApiError ? e.message : "Couldn't create project."),
      },
    );
  };

  const items = data?.items ?? [];

  return (
    <div className="flex h-screen bg-canvas text-primary">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title="Projects"
          caption={items.length > 0 ? `${items.length} projects` : undefined}
        />
        <div className="nice-scroll mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <section aria-label="Create project">
            <h2 className="mb-2 text-sm font-medium">New project</h2>
            <div className="flex gap-2">
              <label htmlFor="project-title" className="sr-only">
                Project title
              </label>
              <input
                id="project-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="e.g. Q3 market research"
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-tertiary focus:border-accent"
              />
              <PrimaryButton
                onClick={create}
                disabled={createProject.isPending || !title.trim()}
              >
                {createProject.isPending ? "Creating…" : "Create"}
              </PrimaryButton>
            </div>
            {error && (
              <div className="mt-3">
                <ErrorBanner message={error} onDismiss={() => setError(null)} />
              </div>
            )}
          </section>

          <section aria-label="Your projects" className="mt-8">
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wider text-tertiary">
              All projects
            </h2>
            {isLoading ? (
              <div className="animate-pulse" aria-label="Loading projects">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="border-b border-line py-4">
                    <div className="h-4 w-1/2 rounded bg-raised" />
                    <div className="mt-2 h-3 w-3/4 rounded bg-raised" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <ErrorBanner
                message="Couldn't load projects."
                onRetry={() => void refetch()}
                retryLabel="Reload"
              />
            ) : items.length === 0 ? (
              <p className="border-b border-line py-4 text-sm text-tertiary">
                No projects yet. Group related threads with your first project above.
              </p>
            ) : (
              <ul className="divide-y divide-line border-b border-line">
                {items.map((p) => (
                  <li key={p.id} className="group flex items-center gap-2 py-3">
                    <button
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-primary">
                        {p.title}
                      </span>
                      {p.description ? (
                        <span className="mt-0.5 line-clamp-1 block text-[13px] text-secondary">
                          {p.description}
                        </span>
                      ) : null}
                    </button>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
                    />
                    <IconButton
                      label={`Delete project "${p.title}"`}
                      onClick={() => remove.mutate(p.id)}
                      className="hover:!text-red-600 dark:hover:!text-red-400"
                    >
                      <span className="px-1 text-xs">Delete</span>
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
