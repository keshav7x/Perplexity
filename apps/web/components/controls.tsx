"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* Small, consistent control set. Blue is reserved for primary actions. */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

export function QuietButton({ className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

export function IconButton({
  className,
  label,
  ...props
}: ButtonProps & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1.5 text-secondary transition-colors hover:bg-raised hover:text-primary disabled:opacity-40",
        className,
      )}
    />
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function TextInput({ className, error, ...props }: TextInputProps) {
  return (
    <div>
      <input
        {...props}
        className={cn(
          "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-accent",
          error && "border-red-500 focus:border-red-500",
          className,
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
