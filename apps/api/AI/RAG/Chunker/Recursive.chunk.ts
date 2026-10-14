import {
  RecursiveCharacterTextSplitter,
  type SupportedTextSplitterLanguage,
} from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

/**
 * Options for {@link recursiveChunkText}.
 *
 * Mirrors `RecursiveCharacterTextSplitterParams` from
 * `@langchain/textsplitters`:
 * https://docs.langchain.com/oss/javascript/integrations/splitters/recursive_text_splitter
 *
 * The splitter tries separators in order (`["\n\n", "\n", " ", ""]` by
 * default) so paragraphs, then sentences, then words stay together.
 */
export interface RecursiveChunkOptions {
  /** Max chunk size as measured by `lengthFunction`. Defaults to 1000. */
  chunkSize?: number;
  /** Target overlap between chunks. Defaults to 200. */
  chunkOverlap?: number;
  /** Custom separator list. Overrides the default hierarchy. */
  separators?: string[];
  /** Keep the separator in the output. Defaults to true. */
  keepSeparator?: boolean;
  /** Measure chunk length. Defaults to `(t) => t.length` (characters). */
  lengthFunction?:
    | ((text: string) => number)
    | ((text: string) => Promise<number>);
}

/**
 * Split raw text with LangChain's recommended generic splitter.
 *
 * @example
 * ```ts
 * const chunks = await recursiveChunkText(longArticle, { chunkSize: 1000, chunkOverlap: 200 });
 * ```
 */
export async function recursiveChunkText(
  text: string,
  options: RecursiveChunkOptions = {},
): Promise<string[]> {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separators,
    keepSeparator = true,
    lengthFunction = (t: string) => t.length,
  } = options;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    ...(separators ? { separators } : {}),
    keepSeparator,
    lengthFunction,
  });
  return splitter.splitText(text);
}

/**
 * Split LangChain Documents, preserving metadata on each chunk.
 * Uses `.splitDocuments()` so `metadata` propagates downstream.
 */
export async function recursiveChunkDocuments(
  docs: Document[],
  options: RecursiveChunkOptions = {},
): Promise<Document[]> {
  if (docs.length === 0) {
    return [];
  }
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separators,
    keepSeparator = true,
    lengthFunction = (t: string) => t.length,
  } = options;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    ...(separators ? { separators } : {}),
    keepSeparator,
    lengthFunction,
  });
  return splitter.splitDocuments(docs);
}

/**
 * Language-aware recursive splitting (code / markdown / latex / html).
 * Wraps `RecursiveCharacterTextSplitter.fromLanguage()`.
 *
 * Supported languages: "cpp" | "go" | "java" | "js" | "php" | "proto" |
 * "python" | "rst" | "ruby" | "rust" | "scala" | "swift" | "markdown" |
 * "latex" | "html" | "sol"
 *
 * https://docs.langchain.com/oss/javascript/integrations/splitters/code_splitter
 */
export async function recursiveChunkByLanguage(
  text: string,
  language: SupportedTextSplitterLanguage,
  options: Omit<RecursiveChunkOptions, "separators"> = {},
): Promise<string[]> {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }
  const splitter = RecursiveCharacterTextSplitter.fromLanguage(language, {
    chunkSize: options.chunkSize ?? 1000,
    chunkOverlap: options.chunkOverlap ?? 200,
  });
  return splitter.splitText(text);
}
