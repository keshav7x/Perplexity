"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { ChatInput } from "@/components/ChatInput";
import { Sidebar } from "@/components/Sidebar";
import { useSendMessage } from "@/features/chat.hooks";
import { useConversations } from "@/features/conversations.hooks";
import { ApiError } from "@/lib/api-client";
import { useState } from "react";

function HomeInner() {
  const router = useRouter();
  const sendMessage = useSendMessage();
  const { data: recent } = useConversations();
  const [error, setError] = useState<string | null>(null);

  const startThread = (message: string) => {
    setError(null);
    sendMessage.mutate(
      { message },
      {
        onSuccess: (data) => router.push(`/c/${data.conversation.id}`),
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : "Failed to send message"),
      },
    );
  };

  return (
    <div className="flex h-screen bg-ink-950 text-zinc-100">
      <Sidebar />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4">
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-semibold tracking-tight">
              perplexity<span className="text-accent-500">·clone</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Ask anything. A new thread is created automatically.
            </p>
          </motion.div>

          <ChatInput onSend={startThread} pending={sendMessage.isPending} />

          {error && (
            <p className="mt-3 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {(recent?.items.length ?? 0) > 0 && (
            <div className="mt-8">
              <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
                Recent threads
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {recent!.items.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => router.push(`/c/${c.id}`)}
                    className="truncate rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-left text-sm hover:bg-ink-800"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeInner />
    </AuthGuard>
  );
}
