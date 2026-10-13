"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  ChatMessage,
  Paged,
  SendMessageResult,
} from "@/lib/types";
import { conversationKeys } from "./conversations.hooks";

export const chatKeys = {
  messages: (conversationId: number) =>
    ["chat", "messages", conversationId] as const,
};

export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey:
      conversationId !== null
        ? chatKeys.messages(conversationId)
        : ["chat", "messages", "none"],
    enabled: conversationId !== null,
    queryFn: () =>
      api.get<Paged<ChatMessage>>(`/chat/${conversationId}/messages`),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      message: string;
      conversationId?: number;
      projectId?: number;
    }) => api.post<SendMessageResult>("/chat", input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(data.conversation.id),
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}

export function useEditMessage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { chatId: number; message: string }) =>
      api.patch<ChatMessage>(`/chat/messages/${input.chatId}`, {
        message: input.message,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId),
      });
    },
  });
}

export function useDeleteMessage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: number) =>
      api.delete<{ success: boolean }>(`/chat/messages/${chatId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId),
      });
    },
  });
}
