"use client";

import { ChevronRight, Compass, Cpu, Globe2, Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ChatInput } from "@/components/ChatInput";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Sidebar } from "@/components/Sidebar";
import { useSendMessage } from "@/features/chat.hooks";
import { useConversations } from "@/features/conversations.hooks";
import { ApiError } from "@/lib/api-client";

const SUGGESTIONS = [
  { icon: Globe2, label: "What happened in tech today?" },
  { icon: Cpu, label: "How do vector databases work?" },
  { icon: Newspaper, label: "Summarize the latest AI research" },
  { icon: Compass, label: "Plan a weekend trip to Kyoto" },
];

function HomeInner() {
  const router = useRouter();
  const sendMessage = useSendMessage();
  const { data: recent, isLoading: recentLoading } = useConversations();
  const [error, setError] = useState<string | null>(null);

  const busy = sendMessage.isPending;

  const startThread = (message: string) => {
    if (busy) return;
    setError(null);
    sendMessage.mutate(
      { message },
      {
        onSuccess: (data) => router.push(`/c/${data.conversation.id}`),
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : "Something went wrong. Try again."),
      },
    );
  };

  const threads = recent?.items ?? [];

  return (
    <div className="flex h-screen bg-canvas text-primary">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="nice-scroll mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center overflow-y-auto px-4 py-10 sm:px-6">
          <div className="mb-6">
            <h1 className="text-[26px] font-medium tracking-tight">
              What do you want to know?
            </h1>
            <p className="mt-1.5 text-[15px] text-secondary">
              Ask anything — get a direct answer you can follow up on.
            </p>
          </div>

          <ChatInput onSend={startThread} pending={busy} autoFocus />

          {error && (
            <div className="mt-3">
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => startThread(label)}
                disabled={busy}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-[13px] text-secondary transition-colors hover:border-secondary/40 hover:text-primary disabled:cursor-wait disabled:opacity-60"
              >
                <Icon size={14} className="shrink-0 text-tertiary" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </button>
            ))}
          </div>

          {(recentLoading || threads.length > 0) && (
            <section aria-label="Recent searches" className="mt-10">
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wider text-tertiary">
                Recent
              </h2>
              {recentLoading ? (
                <div className="animate-pulse space-y-0" aria-label="Loading recent searches">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="border-b border-line py-3">
                      <div className="h-4 w-3/4 rounded bg-raised" />
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="divide-y divide-line border-b border-line">
                  {threads.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => router.push(`/c/${c.id}`)}
                        className="group flex w-full items-center gap-2 py-3 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm text-primary">
                          {c.title}
                        </span>
                        <ChevronRight
                          size={14}
                          className="shrink-0 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
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
