"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function CodeBlock({ language, text }: { language: string; text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <figure className="my-4 overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between border-b border-line bg-raised px-3 py-1.5">
        <figcaption className="font-mono text-[11px] text-tertiary">
          {language || "code"}
        </figcaption>
        <button
          onClick={() => {
            void copyText(text).then((ok) => {
              if (ok) {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }
            });
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-sans text-[11px] text-tertiary hover:bg-line/60 hover:text-secondary"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-slate-900 p-4 text-[13px] leading-relaxed dark:bg-black/40">
        <code className="font-mono text-slate-100">{text.replace(/\n$/, "")}</code>
      </pre>
    </figure>
  );
}

const components: Components = {
  h1: ({ children }) => (
    <h3 className="mb-1.5 mt-5 text-[17px] font-semibold tracking-tight text-primary first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-1.5 mt-5 text-[16px] font-semibold tracking-tight text-primary first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1.5 mt-4 text-[15px] font-semibold text-primary first:mt-0">
      {children}
    </h4>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1 mt-3 text-sm font-semibold text-primary first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="mb-1 mt-3 text-sm font-semibold text-primary first:mt-0">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="mb-1 mt-3 text-sm font-semibold text-secondary first:mt-0">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="my-2.5 leading-[1.8] first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2.5 list-disc space-y-1.5 pl-5 marker:text-tertiary">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2.5 list-decimal space-y-1.5 pl-5 marker:text-tertiary">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-[1.75]">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-line pl-3.5 text-secondary">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-line" />,
  table: ({ children }) => (
    <div className="nice-scroll my-4 overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-raised">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-line px-3 py-2 text-left text-[13px] font-semibold text-primary">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line/70 px-3 py-2 align-top text-secondary last:border-b-0">
      {children}
    </td>
  ),
  // `pre` is a passthrough — block styling lives in `code` below.
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const text = Array.isArray(children)
      ? children.join("")
      : String(children ?? "");
    const match = /language-([\w-]+)/.exec(className ?? "");
    const isBlock = match !== null || text.includes("\n");

    if (!isBlock) {
      return (
        <code
          className={cn(
            "rounded border border-line bg-raised px-1 py-px font-mono text-[0.85em] text-primary",
          )}
        >
          {children}
        </code>
      );
    }

    return <CodeBlock language={match?.[1] ?? ""} text={text} />;
  },
};

/**
 * Renders an AI answer as GitHub-flavored markdown.
 * Bare URLs autolink via GFM. Raw HTML is not rendered (no rehype
 * plugins) so untrusted model output stays inert.
 */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="max-w-none text-[15px] text-primary">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
