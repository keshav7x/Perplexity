"use client";

import { motion } from "framer-motion";

/**
 * Honest loading state: a single indeterminate "researching" indicator
 * bound to the real pending request. No staged claims about what the
 * backend is doing — stages aren't visible from the API.
 */
export function GeneratingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
      aria-label="Researching"
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
        <p className="text-sm text-secondary">
          Researching<span className="animate-pulse">…</span>
        </p>
      </div>
      <div
        className="h-0.5 w-40 overflow-hidden rounded-full bg-raised"
        aria-hidden
      >
        <div className="progress-slide h-full w-1/3 rounded-full bg-teal" />
      </div>
      <div className="animate-pulse space-y-2" aria-hidden>
        {[94, 100, 82].map((w) => (
          <div
            key={w}
            className="h-3.5 rounded bg-raised"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
