import {
  CharacterTextSplitter,
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
  TokenTextSplitter,
  type SupportedTextSplitterLanguage,
} from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

/**
 * Strategy picked by {@link pickStrategy}.
 * - `character`: tiny texts — single-separator split, minimal overhead.
 * - `recursive`: default — paragraph → sentence → word hierarchy.
 * - `markdown`: header/list/code-fence structure detected.
 * - `code`: fenced code block with a mappable language detected.
 * - `token`: very long texts where the LLM context window (tokens) matters.
 */
export type AdaptiveStrategy =
  | "character"
  | "recursive"
  | "markdown"
  | "code"
  | "token";

export interface AdaptiveChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  /** Above this length (chars), prefer token-based splitting. Defaults to 50_000. */
  tokenThreshold?: number;
  /** Below this length (chars), use a plain character split. Defaults to 500. */
  smallTextThreshold?: number;
  /** Force a strategy instead of auto-detecting. */
  forceStrategy?: AdaptiveStrategy;
  /** Force a code language when `forceStrategy: "code"`. */
  language?: SupportedTextSplitterLanguage;
}

const CODE_FENCE_RE = /```(\w+)?\n[\s\S]*?```/;
const MARKDOWN_RE = /^#{1,6}\s.+$/m;

const FENCE_TO_LANGUAGE: Record<string, SupportedTextSplitterLanguage> = {
  js: "js",
  javascript: "js",
  ts: "js",
  typescript: "js",
  py: "python",
  python: "python",
  go: "go",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
  php: "php",
  ruby: "ruby",
  rust: "rust",
  scala: "scala",
  swift: "swift",
  sol: "sol",
  solidity: "sol",
  md: "markdown",
  markdown: "markdown",
  html: "html",
  latex: "latex",
  tex: "latex",
};

/**
 * Inspect text and pick the cheapest splitter that preserves its structure.
 * Pure function — easy to unit-test and log (`chunk_strategy` metadata).
 */
export function pickStrategy(text: string, options: AdaptiveChunkOptions = {}): {
  strategy: AdaptiveStrategy;
  language?: SupportedTextSplitterLanguage;
} {
  if (options.forceStrategy) {
    return {
      strategy: options.forceStrategy,
      language: options.language,
    };
  }
  const tokenThreshold = options.tokenThreshold ?? 50_000;
  const smallTextThreshold = options.smallTextThreshold ?? 500;

  if (text.length >= tokenThreshold) {
    return { strategy: "token" };
  }

  const fence = text.match(CODE_FENCE_RE);
  if (fence?.[1]) {
    const language = FENCE_TO_LANGUAGE[fence[1].toLowerCase()];
    if (language && language !== "markdown") {
      return { strategy: "code", language };
    }
  }

  if (MARKDOWN_RE.test(text) || /```/.test(text)) {
    return { strategy: "markdown" };
  }

  if (text.length <= smallTextThreshold && !text.includes("\n\n")) {
    return { strategy: "character" };
  }

  return { strategy: "recursive" };
}

/**
 * Adaptively chunk raw text: inspects structure/length, then delegates to
 * the matching LangChain splitter (character / recursive / markdown /
 * code / token).
 *
 * @example
 * ```ts
 * const chunks = await adaptiveChunkText(raw, { chunkSize: 1000, chunkOverlap: 200 });
 * ```
 */
export async function adaptiveChunkText(
  text: string,
  options: AdaptiveChunkOptions = {},
): Promise<string[]> {
  if (text.length === 0) {
    return [];
  }
  const chunkSize = options.chunkSize ?? 1000;
  const chunkOverlap = options.chunkOverlap ?? 200;
  const { strategy, language } = pickStrategy(text, options);

  switch (strategy) {
    case "character": {
      const splitter = new CharacterTextSplitter({
        separator: "\n\n",
        chunkSize,
        chunkOverlap,
      });
      return splitter.splitText(text);
    }
    case "markdown": {
      const splitter = new MarkdownTextSplitter({ chunkSize, chunkOverlap });
      return splitter.splitText(text);
    }
    case "code": {
      const splitter = RecursiveCharacterTextSplitter.fromLanguage(
        language ?? "js",
        { chunkSize, chunkOverlap },
      );
      return splitter.splitText(text);
    }
    case "token": {
      const splitter = new TokenTextSplitter({
        encodingName: "cl100k_base",
        chunkSize: 500,
        chunkOverlap: 50,
      });
      return splitter.splitText(text);
    }
    case "recursive":
    default: {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
      });
      return splitter.splitText(text);
    }
  }
}

/**
 * Adaptively chunk Documents. Each document is routed independently, and the
 * chosen `chunk_strategy` is recorded in chunk metadata for observability.
 */
export async function adaptiveChunkDocuments(
  docs: Document[],
  options: AdaptiveChunkOptions = {},
): Promise<Document[]> {
  const out: Document[] = [];
  for (const doc of docs) {
    const { strategy } = pickStrategy(doc.pageContent, options);
    const chunks = await adaptiveChunkText(doc.pageContent, options);
    for (const chunk of chunks) {
      out.push(
        new Document({
          pageContent: chunk,
          metadata: { ...doc.metadata, chunk_strategy: strategy },
        }),
      );
    }
  }
  return out;
}
