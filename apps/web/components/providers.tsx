"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { Provider as ReduxProvider } from "react-redux";
import { getQueryClient } from "@/lib/query-client";
import { store } from "@/store/store";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
