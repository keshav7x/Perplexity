"use client";

import { motion } from "framer-motion";
import { AlertCircle, RotateCcw, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
}

/** Quiet inline error with optional retry. */
export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  retryLabel = "Retry",
}: ErrorBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
    >
      <AlertCircle size={15} className="shrink-0" />
      <p className="min-w-0 flex-1 truncate" title={message}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium hover:bg-red-100 dark:hover:bg-red-900/50"
        >
          <RotateCcw size={12} /> {retryLabel}
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}
