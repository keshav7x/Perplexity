import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface ContextEnrichedChunkOptions {
  /** Base chunk size (chars). Defaults to 1000. */
  chunkSize?: number;
  /** Base chunk overlap (chars). Defaults to 200. */
  chunkOverlap?: number;
  /** Max chars of whole-doc context sent per LLM call. Defaults to 8000. */
  maxContextChars?: number;
  /** Max concurrent context-generation calls. Defaults to 4. */
  concurrency?: number;
  /** Keep the raw chunk alongside context. Defaults to true. */
  keepOriginal?: boolean;
}

const CONTEXT_SYSTEM_PROMPT = `You generate short retrieval context for a document chunk.
Rules:
- Output 1-2 sentences (under 60 words) situating the chunk within its source document.
- Name the document/topic and resolve vague references when possible.
- Do NOT answer, summarize beyond situating, or add facts not in the document.
- Output ONLY the context sentence(s), no prefix or quotes.`;

/** Truncate the middle of long documents so prompts stay bounded. */
function boundedContext(doc: string, maxChars: number): string {
  if (doc.length <= maxChars) {
    return doc;
  }
  const head = Math.ceil(maxChars * 0.6);
  const tail = Math.floor(maxChars * 0.4);
  return `${doc.slice(0, head)}\n\n[... truncated ...]\n\n${doc.slice(-tail)}`;
}

function contentToString(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .map((block) =>
        typeof block === "string"
          ? block
          : typeof block?.text === "string"
            ? block.text
            : "",
      )
      .join("\n")
      .trim();
  }
  return String(content ?? "").trim();
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (next < items.length) {
        const current = next++;
        results[current] = await fn(items[current]!, current);
      }
    },
  );
  await Promise.all(workers);
  return results as R[];
}

/**
 * Contextual-retrieval chunking (Anthropic's "Contextual Retrieval" recipe).
 *
 * 1. Base-split with `RecursiveCharacterTextSplitter`.
 * 2. For each chunk, ask the chat model for a 1-2 sentence context grounded
 *    in the whole document.
 * 3. Emit `"<context>\n---\n<chunk>"` so embeddings capture both, while the
 *    original chunk stays intact in metadata for faithful citation.
 *
 * Pass any LangChain chat model, e.g. `AIRegistry("gemini")`.
 */
export async function contextEnrichedChunkText(
  text: string,
  model: BaseChatModel,
  options: ContextEnrichedChunkOptions = {},
): Promise<string[]> {
  return (await contextEnrichedChunkDocuments(
    [new Document({ pageContent: text })],
    model,
    options,
  )).map((d) => d.pageContent);
}

/**
 * Context-enrich Documents. Each output chunk keeps the source metadata plus:
 * - `context`: the LLM-generated situating sentence(s)
 * - `original_chunk`: the raw chunk (when `keepOriginal`, default true)
 * - `chunk_method: "context_enriched"`
 */
export async function contextEnrichedChunkDocuments(
  docs: Document[],
  model: BaseChatModel,
  options: ContextEnrichedChunkOptions = {},
): Promise<Document[]> {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    maxContextChars = 8000,
    concurrency = 4,
    keepOriginal = true,
  } = options;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const out: Document[] = [];
  for (const doc of docs) {
    if (doc.pageContent.trim().length === 0) {
      continue;
    }
    const base = await splitter.splitDocuments([doc]);
    const wholeDoc = boundedContext(doc.pageContent, maxContextChars);

    const enriched = await runWithConcurrency(
      base,
      concurrency,
      async (chunk, i) => {
        let context = "";
        try {
          const response = await model.invoke([
            new SystemMessage(CONTEXT_SYSTEM_PROMPT),
            new HumanMessage(
              `<document>\n${wholeDoc}\n</document>\n\n<chunk>\n${chunk.pageContent}\n</chunk>`,
            ),
          ]);
          context = contentToString(response.content);
        } catch {
          context = "";
        }
        const pageContent = context
          ? `${context}\n---\n${chunk.pageContent}`
          : chunk.pageContent;
        return new Document({
          pageContent,
          metadata: {
            ...doc.metadata,
            chunk_method: "context_enriched",
            chunk_index: i,
            ...(keepOriginal
              ? { original_chunk: chunk.pageContent }
              : {}),
            ...(context ? { context } : {}),
          },
        });
      },
    );
    out.push(...enriched);
  }
  return out;
}
