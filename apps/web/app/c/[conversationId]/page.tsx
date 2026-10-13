"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ChatInput } from "@/components/ChatInput";
import { MessageList } from "@/components/MessageList";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import {
  useDeleteMessage,
  useEditMessage,
  useMessages,
  useSendMessage,
} from "@/features/chat.hooks";
import { useConversation } from "@/features/conversations.hooks";
import { ApiError } from "@/lib/api-client";

function ThreadInner({ conversationId }: { conversationId: number }) {
  const { data: conversation } = useConversation(conversationId);
  const { data: messagesPage, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage(conversationId);
  const deleteMessage = useDeleteMessage(conversationId);
  const [error, setError] = useState<string | null>(null);

  const messages = messagesPage?.items ?? [];

  const send = (message: string) => {
    setError(null);
    sendMessage.mutate(
      { message, conversationId },
      {
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : "Failed to send message"),
      },
    );
  };

  return (
    <div className="flex h-screen bg-ink-950 text-zinc-100">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={conversation?.title ?? `Thread ${conversationId}`} />
        <div className="nice-scroll mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
          {isLoading ? (
            <p className="text-sm text-zinc-500">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-zinc-500">No messages yet.</p>
          ) : (
            <MessageList
              messages={messages}
              streaming={sendMessage.isPending}
              onEdit={(chatId, message) => editMessage.mutate({ chatId, message })}
              onDelete={(chatId) => deleteMessage.mutate(chatId)}
            />
          )}
          {error && (
            <p className="mt-3 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 pb-6">
          <ChatInput onSend={send} pending={sendMessage.isPending} />
        </div>
      </main>
    </div>
  );
}

export default function ThreadPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = Number(params.conversationId);

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return <p className="p-8 text-sm text-red-400">Invalid thread id.</p>;
  }

  return (
    <AuthGuard>
      <ThreadInner conversationId={conversationId} />
    </AuthGuard>
  );
}
