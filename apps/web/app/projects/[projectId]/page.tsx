"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { useMoveConversation } from "@/features/conversations.hooks";
import {
  useProject,
  useProjectConversations,
  useUpdateProject,
} from "@/features/projects.hooks";

function ProjectDetailInner({ projectId }: { projectId: number }) {
  const router = useRouter();
  const { data: project } = useProject(projectId);
  const { data: conversations } = useProjectConversations(projectId);
  const updateProject = useUpdateProject();
  const moveConversation = useMoveConversation();
  const [title, setTitle] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-ink-950 text-zinc-100">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={project?.title ?? `Project ${projectId}`} />
        <div className="nice-scroll mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-6 rounded-xl border border-ink-700 bg-ink-900 p-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
              Rename project
            </p>
            <div className="flex gap-2">
              <input
                defaultValue={project?.title ?? ""}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project title"
                className="flex-1 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() =>
                  title?.trim() &&
                  updateProject.mutate({ projectId, title: title.trim() })
                }
                className="rounded-lg bg-ink-700 px-3 py-2 text-sm hover:bg-ink-800"
              >
                Save
              </button>
            </div>
            {project?.description && (
              <p className="mt-2 text-xs text-zinc-500">{project.description}</p>
            )}
          </div>

          <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
            Threads in this project
          </p>
          <div className="space-y-2">
            {(conversations?.items ?? []).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3"
              >
                <button
                  onClick={() => router.push(`/c/${c.id}`)}
                  className="min-w-0 flex-1 truncate text-left text-sm"
                >
                  {c.title}
                </button>
                <button
                  onClick={() =>
                    moveConversation.mutate({
                      conversationId: c.id,
                      projectId: null,
                    })
                  }
                  className="text-xs text-zinc-500 hover:text-zinc-200"
                >
                  Remove
                </button>
              </div>
            ))}
            {(conversations?.items.length ?? 0) === 0 && (
              <p className="text-sm text-zinc-500">No threads in this project.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return <p className="p-8 text-sm text-red-400">Invalid project id.</p>;
  }

  return (
    <AuthGuard>
      <ProjectDetailInner projectId={projectId} />
    </AuthGuard>
  );
}
