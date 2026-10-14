import { TokenTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

/**
 * Options for {@link tokenBasedChunker}.
 *
 * Mirrors `TokenTextSplitterParams` from `@langchain/textsplitters`:
 * https://docs.langchain.com/oss/javascript/integrations/splitters/split_by_token
 *
 * Chunk size is measured with a `tiktoken` tokenizer (accurate for
 * OpenAI-family models), NOT with characters.
 */
export interface TokenChunkOptions {
  /** Tiktoken encoding, e.g. "cl100k_base" (gpt-3.5/4) or "o200k_base". */
  encodingName?: "gpt2" | "r50k_base" | "p50k_base" | "p50k_edit" | "cl100k_base" | "o200k_base";
  /** Max tokens per chunk. Defaults to 500. */
  chunkSize?: number;
  /** Token overlap between chunks. Defaults to 50. */
  chunkOverlap?: number;
}

const DEFAULTS: Required<TokenChunkOptions> = {
  encodingName: "cl100k_base",
  chunkSize: 500,
  chunkOverlap: 50,
};

function buildSplitter(options: TokenChunkOptions = {}): TokenTextSplitter {
  const { encodingName, chunkSize, chunkOverlap } = {
    ...DEFAULTS,
    ...options,
  };
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("chunkSize must be a positive integer");
  }
  if (
    !Number.isInteger(chunkOverlap) ||
    chunkOverlap < 0 ||
    chunkOverlap >= chunkSize
  ) {
    throw new Error("chunkOverlap must be an integer from 0 to chunkSize - 1");
  }
  return new TokenTextSplitter({ encodingName, chunkSize, chunkOverlap });
}

/**
 * Split raw text into token-bounded chunks.
 *
 * NOTE: `splitText` is async in LangChain.js — the previous sync version
 * returned a Promise object instead of strings. Always `await` this.
 *
 * @example
 * ```ts
 * const chunks = await tokenBasedChunker(article, { chunkSize: 500, chunkOverlap: 50 });
 * ```
 */
export const tokenBasedChunker = async (
  document: string,
  options: TokenChunkOptions = {},
): Promise<string[]> => {
  if (typeof document !== "string" || document.length === 0) {
    return [];
  }
  const splitter = buildSplitter(options);
  return splitter.splitText(document);
};

/**
 * Split LangChain Documents into token-bounded chunks,
 * preserving metadata on each chunk.
 */
export const tokenBasedChunkDocuments = async (
  docs: Document[],
  options: TokenChunkOptions = {},
): Promise<Document[]> => {
  if (docs.length === 0) {
    return [];
  }
  const splitter = buildSplitter(options);
  return splitter.splitDocuments(docs);
};
