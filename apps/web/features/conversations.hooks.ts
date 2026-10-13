"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Conversation, Paged } from "@/lib/types";

export const conversationKeys = {
  lists: () => ["conversations", "list"] as const,
  detail: (id: number) => ["conversations", "detail", id] as const,
};

export function useConversations(projectId?: number) {
  return useQuery({
    queryKey: [...conversationKeys.lists(), { projectId }],
    queryFn: () =>
      api.get<Paged<Conversation>>("/conversations", {
        query: { projectId, limit: 50 },
      }),
  });
}

export function useConversation(conversationId: number | null) {
  return useQuery({
    queryKey:
      conversationId !== null
        ? conversationKeys.detail(conversationId)
        : ["conversations", "detail", "none"],
    enabled: conversationId !== null,
    queryFn: () =>
      api.get<Conversation>(`/conversations/${conversationId}`),
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; projectId?: number }) =>
      api.post<Conversation>("/conversations", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { conversationId: number; title: string }) =>
      api.patch<Conversation>(`/conversations/${input.conversationId}`, {
        title: input.title,
      }),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(vars.conversationId),
      });
    },
  });
}

export function useArchiveConversation(archived: boolean) {
  const queryClient = useQueryClient();
  const action = archived ? "archive" : "unarchive";
  return useMutation({
    mutationFn: (conversationId: number) =>
      api.post<Conversation>(`/conversations/${conversationId}/${action}`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}

export function useMoveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      conversationId: number;
      projectId: number | null;
    }) =>
      api.post<Conversation>(
        `/conversations/${input.conversationId}/move`,
        { projectId: input.projectId },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) =>
      api.delete<{ success: boolean }>(`/conversations/${conversationId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}
