import {
  CharacterTextSplitter,
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
  type SupportedTextSplitterLanguage,
} from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

/**
 * A character-offset chunk (kept for backwards compatibility).
 * `content` is the slice `text[startOffset:endOffset]`.
 */
export interface TextChunk {
  content: string;
  index: number;
  startOffset: number;
  endOffset: number;
}

export interface ChunkOptions {
  chunkSize: number;
  overlap: number;
}

/**
 * Structure-aware document splitter built on LangChain splitters.
 *
 * - Markdown-looking text  -> `MarkdownTextSplitter` (header-aware)
 * - Code (`language` set)  -> `RecursiveCharacterTextSplitter.fromLanguage()`
 * - Anything else          -> `CharacterTextSplitter`
 *
 * https://docs.langchain.com/oss/javascript/integrations/splitters/character_text_splitter
 * https://docs.langchain.com/oss/javascript/integrations/splitters/code_splitter
 */
export interface DocumentChunkOptions extends ChunkOptions {
  /** Single-char separator for plain text. Defaults to "\n\n". */
  separator?: string;
  /** e.g. "js" | "python" | "markdown". Enables language-aware splitting. */
  language?: SupportedTextSplitterLanguage;
}

function validateOptions(chunkSize: number, overlap: number): void {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("chunkSize must be a positive integer");
  }
  if (
    !Number.isInteger(overlap) ||
    overlap < 0 ||
    overlap >= chunkSize
  ) {
    throw new Error("overlap must be an integer from 0 to chunkSize - 1");
  }
}

function buildSplitter(options: DocumentChunkOptions) {
  const { chunkSize, overlap, separator = "\n\n", language } = options;
  validateOptions(chunkSize, overlap);

  if (language === "markdown") {
    return new MarkdownTextSplitter({ chunkSize, chunkOverlap: overlap });
  }
  if (language) {
    return RecursiveCharacterTextSplitter.fromLanguage(language, {
      chunkSize,
      chunkOverlap: overlap,
    });
  }
  return new CharacterTextSplitter({
    separator,
    chunkSize,
    chunkOverlap: overlap,
  });
}

/** Detect markdown structure (headers, lists, fenced code blocks). */
function looksLikeMarkdown(text: string): boolean {
  return (
    /^#{1,6}\s/m.test(text) ||
    /```/.test(text) ||
    /^\s*[-*+]\s/m.test(text) ||
    /^\s*\d+\.\s/m.test(text)
  );
}

/**
 * Split raw text into offset-tracked chunks using LangChain under the hood.
 *
 * Kept signature-compatible with the previous hand-rolled `chunkText`
 * (`{ chunkSize, overlap }`), but splitting/merging now follows LangChain's
 * `CharacterTextSplitter` semantics. Offsets are resolved sequentially so
 * repeated substrings map to the correct occurrence.
 */
export async function chunkText(
  text: string,
  options: ChunkOptions,
): Promise<TextChunk[]> {
  const { chunkSize, overlap } = options;
  validateOptions(chunkSize, overlap);
  if (text.length === 0) {
    return [];
  }

  const splitter = new CharacterTextSplitter({
    separator: "\n\n",
    chunkSize,
    chunkOverlap: overlap,
  });
  const parts = await splitter.splitText(text);

  const chunks: TextChunk[] = [];
  let cursor = 0;
  for (const part of parts) {
    const start = text.indexOf(part, cursor);
    // Fallback for separator-normalized joins: advance the cursor.
    const safeStart = start === -1 ? cursor : start;
    const end = Math.min(safeStart + part.length, text.length);
    chunks.push({
      content: part,
      index: chunks.length,
      startOffset: safeStart,
      endOffset: end,
    });
    cursor = safeStart + part.length;
  }
  return chunks;
}

/**
 * Split raw text with automatic structure detection.
 * Markdown -> header-aware split; otherwise LangChain character split.
 * Pass `language` to force code-aware splitting.
 */
export async function chunkDocumentText(
  text: string,
  options: DocumentChunkOptions,
): Promise<string[]> {
  if (text.length === 0) {
    return [];
  }
  const language =
    options.language ?? (looksLikeMarkdown(text) ? "markdown" : undefined);
  const splitter = buildSplitter({ ...options, ...(language ? { language } : {}) });
  return splitter.splitText(text);
}

/**
 * Split LangChain Documents, preserving metadata on each chunk.
 * Uses `.splitDocuments()` so `source` / page metadata survives chunking —
 * the preferred entry point for the RAG ingest pipeline
 * (e.g. output of `loadPdf` / `TextLoader`).
 */
export async function chunkDocuments(
  docs: Document[],
  options: DocumentChunkOptions,
): Promise<Document[]> {
  if (docs.length === 0) {
    return [];
  }
  // Detect per-document so a mixed batch (pdf pages + markdown) each
  // gets the right splitter; group to avoid one splitter per doc.
  const groups = new Map<string, Document[]>();
  for (const doc of docs) {
    const language =
      options.language ??
      (looksLikeMarkdown(doc.pageContent) ? "markdown" : undefined) ??
      "plain";
    const bucket = groups.get(language) ?? [];
    bucket.push(doc);
    groups.set(language, bucket);
  }

  const out: Document[] = [];
  for (const [language, bucket] of groups) {
    const splitter = buildSplitter({
      ...options,
      ...(language !== "plain"
        ? { language: language as SupportedTextSplitterLanguage }
        : {}),
    });
    out.push(...(await splitter.splitDocuments(bucket)));
  }
  return out;
}
