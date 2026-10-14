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

interface SendInput {
  message: string;
  conversationId?: number;
  projectId?: number;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendInput) =>
      api.post<SendMessageResult>("/chat", input),

    // Optimistic: show the user's message instantly. Only possible when we
    // already know the conversation (thread page). Home-page sends create
    // the conversation server-side, so they just use isPending.
    onMutate: async (input) => {
      if (input.conversationId === undefined) return undefined;

      const queryKey = chatKeys.messages(input.conversationId);
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<Paged<ChatMessage>>(queryKey);

      const optimistic: ChatMessage = {
        id: -Date.now(), // negative temp id, replaced by server data
        conversationId: input.conversationId,
        sender: "user",
        message: input.message,
        createdAt: new Date().toISOString(),
        pending: true,
      };

      queryClient.setQueryData<Paged<ChatMessage>>(queryKey, (old) => {
        if (!old) return { items: [optimistic], nextCursor: null };
        // API returns newest-first; prepend the optimistic message.
        return { ...old, items: [optimistic, ...old.items] };
      });

      return { previous, queryKey };
    },

    onError: (_err, input, context) => {
      // Roll back the optimistic message; the page surfaces the error
      // with a retry button fed by `variables`.
      if (context && input.conversationId !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },

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
  const queryKey = chatKeys.messages(conversationId);

  return useMutation({
    mutationFn: (input: { chatId: number; message: string }) =>
      api.patch<ChatMessage>(`/chat/messages/${input.chatId}`, {
        message: input.message,
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<Paged<ChatMessage>>(queryKey);
      queryClient.setQueryData<Paged<ChatMessage>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((m) =>
            m.id === input.chatId ? { ...m, message: input.message } : m,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const queryKey = chatKeys.messages(conversationId);

  return useMutation({
    mutationFn: (chatId: number) =>
      api.delete<{ success: boolean }>(`/chat/messages/${chatId}`),
    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<Paged<ChatMessage>>(queryKey);
      queryClient.setQueryData<Paged<ChatMessage>>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, items: old.items.filter((m) => m.id !== chatId) };
      });
      return { previous };
    },
    onError: (_err, _chatId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
