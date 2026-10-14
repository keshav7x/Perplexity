"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { IconButton, QuietButton } from "@/components/controls";
import { useMoveConversation } from "@/features/conversations.hooks";
import {
  useProject,
  useProjectConversations,
  useUpdateProject,
} from "@/features/projects.hooks";
import { ApiError } from "@/lib/api-client";

function ProjectDetailInner({ projectId }: { projectId: number }) {
  const router = useRouter();
  const { data: project } = useProject(projectId);
  const { data: conversations, isLoading } = useProjectConversations(projectId);
  const updateProject = useUpdateProject();
  const moveConversation = useMoveConversation();
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!title?.trim()) return;
    setError(null);
    updateProject.mutate(
      { projectId, title: title.trim() },
      {
        onSuccess: () => setTitle(null),
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : "Couldn't rename project."),
      },
    );
  };

  const threads = conversations?.items ?? [];

  return (
    <div className="flex h-screen bg-canvas text-primary">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={project?.title ?? "Project"}
          caption={threads.length > 0 ? `${threads.length} threads` : undefined}
        />
        <div className="nice-scroll mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <section aria-label="Project settings" className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-2 text-sm font-medium">Rename project</h2>
            <div className="flex gap-2">
              <label htmlFor="project-rename" className="sr-only">
                Project title
              </label>
              <input
                id="project-rename"
                key={project?.title ?? "loading"}
                defaultValue={project?.title ?? ""}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="Project title"
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-tertiary focus:border-accent"
              />
              <QuietButton onClick={save} disabled={!title?.trim()}>
                Save
              </QuietButton>
            </div>
            {project?.description && (
              <p className="mt-2 text-[13px] text-secondary">{project.description}</p>
            )}
          </section>
          {error && (
            <div className="mt-3">
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <section aria-label="Threads in this project" className="mt-8">
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wider text-tertiary">
              Threads
            </h2>
            {isLoading ? (
              <div className="animate-pulse" aria-label="Loading threads">
                {[0, 1].map((i) => (
                  <div key={i} className="border-b border-line py-3.5">
                    <div className="h-4 w-2/3 rounded bg-raised" />
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <p className="border-b border-line py-4 text-sm text-tertiary">
                No threads in this project yet.
              </p>
            ) : (
              <ul className="divide-y divide-line border-b border-line">
                {threads.map((c) => (
                  <li key={c.id} className="group flex items-center gap-2 py-1">
                    <button
                      onClick={() => router.push(`/c/${c.id}`)}
                      className="min-w-0 flex-1 truncate py-2 text-left text-sm text-primary"
                    >
                      {c.title}
                    </button>
                    <span className="hidden group-hover:inline">
                      <IconButton
                        label={`Remove "${c.title}" from project`}
                        onClick={() =>
                          moveConversation.mutate({
                            conversationId: c.id,
                            projectId: null,
                          })
                        }
                      >
                        <span className="px-1 text-xs">Remove</span>
                      </IconButton>
                    </span>
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

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return <p className="p-8 text-sm text-red-600">Invalid project id.</p>;
  }

  return (
    <AuthGuard>
      <ProjectDetailInner projectId={projectId} />
    </AuthGuard>
  );
}
