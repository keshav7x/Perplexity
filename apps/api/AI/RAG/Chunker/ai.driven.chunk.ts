import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface AiDrivenChunkOptions {
  /** Pre-chunk size (chars) before asking the LLM. Defaults to 2000. */
  coarseChunkSize?: number;
  /** Overlap for the coarse pre-chunk. Defaults to 200. */
  coarseChunkOverlap?: number;
  /** Max propositions kept per coarse chunk (cost guard). Defaults to 20. */
  maxPropositionsPerChunk?: number;
  /** Fall back to coarse chunks when the LLM call fails. Defaults to true. */
  fallbackToCoarse?: boolean;
}

const PROPOSITION_SYSTEM_PROMPT = `You split text into self-contained propositions for retrieval.
Rules:
- Each proposition is ONE atomic fact, understandable without surrounding context.
- Resolve pronouns and references (replace "it", "they", "this" with the entity).
- Keep names, dates, quantities exactly as written. Do not invent facts.
- Output one proposition per line, prefixed with "- ". No numbering, no commentary.`;

function messageTextToString(content: unknown): string {
  if (typeof content === "string") {
    return content;
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
      .join("\n");
  }
  return String(content ?? "");
}

function parsePropositions(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•\d.)\]]+\s*)+/, "").trim())
    .filter((line) => line.length > 0);
}

/**
 * LLM-driven (proposition) chunking.
 *
 * Pipeline:
 * 1. Coarse-split with `RecursiveCharacterTextSplitter` (cheap, local).
 * 2. For each coarse chunk, prompt the chat model to emit atomic,
 *    self-contained propositions (Dense X Retrieval style).
 * 3. On LLM failure, fall back to the coarse chunk (configurable).
 *
 * Pass any LangChain chat model, e.g. `groqModel` / `geminiModel` from
 * `AI/modelRegistery.ts` via `AIRegistry("groq")`.
 *
 * @example
 * ```ts
 * import { AIRegistry } from "../../modelRegistery";
 * const chunks = await aiDrivenChunkText(article, AIRegistry("groq"));
 * ```
 */
export async function aiDrivenChunkText(
  text: string,
  model: BaseChatModel,
  options: AiDrivenChunkOptions = {},
): Promise<string[]> {
  if (text.trim().length === 0) {
    return [];
  }
  const {
    coarseChunkSize = 2000,
    coarseChunkOverlap = 200,
    maxPropositionsPerChunk = 20,
    fallbackToCoarse = true,
  } = options;

  const coarse = await new RecursiveCharacterTextSplitter({
    chunkSize: coarseChunkSize,
    chunkOverlap: coarseChunkOverlap,
  }).splitText(text);

  const out: string[] = [];
  for (const piece of coarse) {
    try {
      const response = await model.invoke([
        new SystemMessage(PROPOSITION_SYSTEM_PROMPT),
        new HumanMessage(
          `Split the following text into self-contained propositions:\n\n${piece}`,
        ),
      ]);
      const propositions = parsePropositions(
        messageTextToString(response.content),
      ).slice(0, maxPropositionsPerChunk);
      if (propositions.length > 0) {
        out.push(...propositions);
      } else if (fallbackToCoarse) {
        out.push(piece);
      }
    } catch {
      if (fallbackToCoarse) {
        out.push(piece);
      }
    }
  }
  return out;
}

/**
 * Proposition-chunk Documents, preserving source metadata and tagging each
 * chunk with `chunk_method: "ai_driven"` plus its coarse-chunk index.
 */
export async function aiDrivenChunkDocuments(
  docs: Document[],
  model: BaseChatModel,
  options: AiDrivenChunkOptions = {},
): Promise<Document[]> {
  const out: Document[] = [];
  for (const doc of docs) {
    const propositions = await aiDrivenChunkText(
      doc.pageContent,
      model,
      options,
    );
    propositions.forEach((proposition, i) => {
      out.push(
        new Document({
          pageContent: proposition,
          metadata: {
            ...doc.metadata,
            chunk_method: "ai_driven",
            proposition_index: i,
          },
        }),
      );
    });
  }
  return out;
}
