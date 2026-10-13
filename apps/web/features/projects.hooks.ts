"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Conversation, Paged, Project } from "@/lib/types";
import { conversationKeys } from "./conversations.hooks";

export const projectKeys = {
  lists: () => ["projects", "list"] as const,
  detail: (id: number) => ["projects", "detail", id] as const,
  conversations: (id: number) => ["projects", id, "conversations"] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: () => api.get<Paged<Project>>("/projects", { query: { limit: 50 } }),
  });
}

export function useProject(projectId: number | null) {
  return useQuery({
    queryKey:
      projectId !== null
        ? projectKeys.detail(projectId)
        : ["projects", "detail", "none"],
    enabled: projectId !== null,
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
  });
}

export function useProjectConversations(projectId: number | null) {
  return useQuery({
    queryKey:
      projectId !== null
        ? projectKeys.conversations(projectId)
        : ["projects", "none", "conversations"],
    enabled: projectId !== null,
    queryFn: () =>
      api.get<Paged<Conversation>>(`/projects/${projectId}/conversations`),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description?: string }) =>
      api.post<Project>("/projects", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      projectId: number;
      title?: string;
      description?: string | null;
    }) =>
      api.patch<Project>(`/projects/${input.projectId}`, {
        title: input.title,
        description: input.description,
      }),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: projectKeys.detail(vars.projectId),
      });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) =>
      api.delete<{ success: boolean }>(`/projects/${projectId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}
