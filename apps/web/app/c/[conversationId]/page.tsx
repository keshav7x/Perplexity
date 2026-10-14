"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ChatInput } from "@/components/ChatInput";
import { ErrorBanner } from "@/components/ErrorBanner";
import { MessageList } from "@/components/MessageList";
import { Sidebar } from "@/components/Sidebar";
import { ThreadSkeleton } from "@/components/Skeletons";
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
  const {
    data: messagesPage,
    isLoading,
    isError,
    refetch,
  } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage(conversationId);
  const deleteMessage = useDeleteMessage(conversationId);

  const [failed, setFailed] = useState<{ message: string; error: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  const messages = messagesPage?.items ?? [];
  const generating = sendMessage.isPending;
  const exchangeCount = Math.ceil(messages.filter((m) => !m.pending).length / 2);

  // Stick to bottom while new content arrives — unless the user scrolled up.
  useEffect(() => {
    if (stickRef.current) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, generating]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  const send = (message: string) => {
    setFailed(null);
    stickRef.current = true;
    sendMessage.mutate(
      { message, conversationId },
      {
        onError: (e, variables) =>
          setFailed({
            message: variables.message,
            error: e instanceof ApiError ? e.message : "Something went wrong. Try again.",
          }),
      },
    );
  };

  const retry = () => {
    if (failed) send(failed.message);
  };

  return (
    <div className="flex h-screen bg-canvas text-primary">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={conversation?.title ?? "Thread"}
          caption={
            exchangeCount > 0
              ? `${exchangeCount} exchange${exchangeCount === 1 ? "" : "s"}`
              : undefined
          }
        />
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="nice-scroll mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        >
          {isLoading ? (
            <ThreadSkeleton />
          ) : isError ? (
            <ErrorBanner
              message="Couldn't load this thread."
              onRetry={() => void refetch()}
              retryLabel="Reload"
            />
          ) : messages.length === 0 && !generating ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-tertiary">No messages yet.</p>
            </div>
          ) : (
            <MessageList
              messages={messages}
              generating={generating}
              onEdit={(chatId, message) => editMessage.mutate({ chatId, message })}
              onDelete={(chatId) => deleteMessage.mutate(chatId)}
            />
          )}
          {failed && !generating && (
            <div className="mt-4">
              <ErrorBanner
                message={failed.error}
                onRetry={retry}
                onDismiss={() => setFailed(null)}
              />
            </div>
          )}
        </div>
        <div className="border-t border-line bg-canvas">
          <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
            <ChatInput onSend={send} pending={generating} autoFocus />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ThreadPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = Number(params.conversationId);

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return <p className="p-8 text-sm text-red-600">Invalid thread id.</p>;
  }

  return (
    <AuthGuard>
      <ThreadInner conversationId={conversationId} />
    </AuthGuard>
  );
}
