import { TextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import type { Embeddings } from "@langchain/core/embeddings";

/**
 * Breakpoint strategies, ported from LangChain's experimental Python
 * `SemanticChunker` (no JS equivalent ships in `@langchain/textsplitters`):
 * https://github.com/langchain-ai/langchain-experimental/blob/main/libs/experimental/langchain_experimental/text_splitter.py
 *
 * - `percentile`: split where distance > p-th percentile of distances.
 * - `standard_deviation`: split where distance > mean + k * std.
 * - `interquartile`: split where distance > mean + k * IQR.
 * - `gradient`: percentile over the gradient of the distance curve
 *   (better for highly-correlated / domain-specific text).
 */
export type BreakpointThresholdType =
  | "percentile"
  | "standard_deviation"
  | "interquartile"
  | "gradient";

export const BREAKPOINT_DEFAULTS: Record<BreakpointThresholdType, number> = {
  percentile: 95,
  standard_deviation: 3,
  interquartile: 1.5,
  gradient: 95,
};

export interface SemanticChunkerOptions {
  /** Embedding model used to vectorize buffered sentences. Required. */
  embeddings: Embeddings;
  /** Sentences of context on each side when embedding. Defaults to 1. */
  bufferSize?: number;
  /** Threshold strategy. Defaults to "percentile". */
  breakpointThresholdType?: BreakpointThresholdType;
  /** Threshold amount (defaults per strategy, see BREAKPOINT_DEFAULTS). */
  breakpointThresholdAmount?: number;
  /** Target chunk count — overrides threshold math via interpolation. */
  numberOfChunks?: number;
  /** Sentence boundary regex. Defaults to `(?<=[.?!])\s+`. */
  sentenceSplitRegex?: string;
  /** Drop trailing groups shorter than this many chars (merged onward). */
  minChunkSize?: number;
  /** Add `start_index` (char offset) to chunk metadata. Defaults to false. */
  addStartIndex?: boolean;
}

interface BufferedSentence {
  sentence: string;
  index: number;
  combinedSentence: string;
  combinedSentenceEmbedding?: number[];
  distanceToNext?: number;
}

function combineSentences(
  sentences: Array<Pick<BufferedSentence, "sentence" | "index">>,
  bufferSize: number,
): BufferedSentence[] {
  return sentences.map((s, i) => {
    let combined = "";
    for (let j = i - bufferSize; j < i; j++) {
      if (j >= 0) {
        combined += `${sentences[j]!.sentence} `;
      }
    }
    combined += s.sentence;
    for (let j = i + 1; j < i + 1 + bufferSize; j++) {
      if (j < sentences.length) {
        combined += ` ${sentences[j]!.sentence}`;
      }
    }
    return { ...s, combinedSentence: combined };
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Linear-interpolation percentile (matches `numpy.percentile` default). */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  if (sorted.length === 1) {
    return sorted[0]!;
  }
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) {
    return sorted[lower]!;
  }
  const weight = rank - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

function mean(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function std(values: number[], avg = mean(values)): number {
  const variance =
    values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Discrete gradient with unit spacing (matches `numpy.gradient`). */
function gradient(values: number[]): number[] {
  if (values.length < 2) {
    return values.slice();
  }
  return values.map((_, i) => {
    if (i === 0) {
      return values[1]! - values[0]!;
    }
    if (i === values.length - 1) {
      return values[i]! - values[i - 1]!;
    }
    return (values[i + 1]! - values[i - 1]!) / 2;
  });
}

/**
 * Embedding-based semantic chunker for LangChain.js.
 *
 * Algorithm (Greg Kamradt / LangChain experimental):
 * 1. Split into sentences.
 * 2. Buffer each sentence with neighbours for context.
 * 3. Embed buffered sentences, take cosine distance between adjacents.
 * 4. Break wherever distance exceeds the threshold.
 *
 * Extends LangChain's `TextSplitter`, so `createDocuments()` /
 * `splitDocuments()` / `transformDocuments()` work out of the box.
 */
export class SemanticChunker extends TextSplitter {
  private embeddings: Embeddings;
  private bufferSize: number;
  private addStartIndexFlag: boolean;
  private breakpointThresholdType: BreakpointThresholdType;
  private breakpointThresholdAmount: number;
  private numberOfChunks?: number;
  private sentenceSplitRegex: string;
  private minChunkSize?: number;

  constructor(fields: SemanticChunkerOptions) {
    // chunkSize/overlap are unused by semantic splitting; set sentinels so
    // the base class stays valid if `mergeSplits` is ever called.
    super({ chunkSize: Number.MAX_SAFE_INTEGER, chunkOverlap: 0 });
    this.embeddings = fields.embeddings;
    this.bufferSize = fields.bufferSize ?? 1;
    this.addStartIndexFlag = fields.addStartIndex ?? false;
    this.breakpointThresholdType =
      fields.breakpointThresholdType ?? "percentile";
    this.breakpointThresholdAmount =
      fields.breakpointThresholdAmount ??
      BREAKPOINT_DEFAULTS[this.breakpointThresholdType];
    this.numberOfChunks = fields.numberOfChunks;
    this.sentenceSplitRegex = fields.sentenceSplitRegex ?? "(?<=[.?!])\\s+";
    this.minChunkSize = fields.minChunkSize;
  }

  private getSingleSentences(text: string): string[] {
    return text
      .split(new RegExp(this.sentenceSplitRegex))
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private async calculateSentenceDistances(
    singleSentences: string[],
  ): Promise<{ distances: number[]; sentences: BufferedSentence[] }> {
    const base = singleSentences.map((sentence, index) => ({
      sentence,
      index,
    }));
    const sentences = combineSentences(base, this.bufferSize);
    const vectors = await this.embeddings.embedDocuments(
      sentences.map((s) => s.combinedSentence),
    );
    sentences.forEach((s, i) => {
      s.combinedSentenceEmbedding = vectors[i];
    });

    const distances: number[] = [];
    for (let i = 0; i < sentences.length - 1; i++) {
      const current = sentences[i]!.combinedSentenceEmbedding ?? [];
      const next = sentences[i + 1]!.combinedSentenceEmbedding ?? [];
      const distance = 1 - cosineSimilarity(current, next);
      distances.push(distance);
      sentences[i]!.distanceToNext = distance;
    }
    return { distances, sentences };
  }

  private calculateBreakpointThreshold(distances: number[]): {
    threshold: number;
    breakpointArray: number[];
  } {
    const sorted = [...distances].sort((a, b) => a - b);
    switch (this.breakpointThresholdType) {
      case "percentile":
        return {
          threshold: percentile(sorted, this.breakpointThresholdAmount),
          breakpointArray: distances,
        };
      case "standard_deviation": {
        const avg = mean(distances);
        return {
          threshold: avg + this.breakpointThresholdAmount * std(distances, avg),
          breakpointArray: distances,
        };
      }
      case "interquartile": {
        const q1 = percentile(sorted, 25);
        const q3 = percentile(sorted, 75);
        return {
          threshold: mean(distances) + this.breakpointThresholdAmount * (q3 - q1),
          breakpointArray: distances,
        };
      }
      case "gradient": {
        const grad = gradient(distances);
        return {
          threshold: percentile(
            [...grad].sort((a, b) => a - b),
            this.breakpointThresholdAmount,
          ),
          breakpointArray: grad,
        };
      }
    }
  }

  /** Inverse-percentile mapping used when `numberOfChunks` is set. */
  private thresholdFromClusters(distances: number[]): number {
    if (this.numberOfChunks == null) {
      throw new Error(
        "thresholdFromClusters called without numberOfChunks set",
      );
    }
    const x1 = distances.length;
    const y1 = 0.0;
    const x2 = 1.0;
    const y2 = 100.0;
    const x = Math.max(Math.min(this.numberOfChunks, x1), x2);
    const y = x2 === x1 ? y2 : y1 + ((y2 - y1) / (x2 - x1)) * (x - x1);
    const clamped = Math.min(Math.max(y, 0), 100);
    return percentile([...distances].sort((a, b) => a - b), clamped);
  }

  async splitText(text: string): Promise<string[]> {
    const singles = this.getSingleSentences(text);
    if (singles.length <= 1) {
      return singles.length === 1 ? [singles[0]!] : [];
    }
    if (this.breakpointThresholdType === "gradient" && singles.length === 2) {
      return singles;
    }

    const { distances, sentences } =
      await this.calculateSentenceDistances(singles);

    let threshold: number;
    let breakpointArray: number[];
    if (this.numberOfChunks != null) {
      threshold = this.thresholdFromClusters(distances);
      breakpointArray = distances;
    } else {
      ({ threshold, breakpointArray } =
        this.calculateBreakpointThreshold(distances));
    }

    const breakIndices = breakpointArray
      .map((d, i) => (d > threshold ? i : -1))
      .filter((i) => i !== -1);

    const chunks: string[] = [];
    let startIndex = 0;
    for (const index of breakIndices) {
      const group = sentences.slice(startIndex, index + 1);
      const combined = group.map((g) => g.sentence).join(" ");
      if (
        this.minChunkSize != null &&
        combined.length < this.minChunkSize
      ) {
        continue;
      }
      chunks.push(combined);
      startIndex = index + 1;
    }
    if (startIndex < sentences.length) {
      chunks.push(sentences.slice(startIndex).map((g) => g.sentence).join(" "));
    }
    return chunks;
  }

  override async createDocuments(
    texts: string[],
    metadatas?: Record<string, unknown>[],
  ): Promise<Document[]> {
    const docs: Document[] = [];
    for (let i = 0; i < texts.length; i++) {
      let startIndex = 0;
      for (const chunk of await this.splitText(texts[i]!)) {
        const metadata: Record<string, unknown> = { ...(metadatas?.[i] ?? {}) };
        if (this.addStartIndexFlag) {
          metadata["start_index"] = startIndex;
        }
        docs.push(new Document({ pageContent: chunk, metadata }));
        startIndex += chunk.length;
      }
    }
    return docs;
  }

  override async splitDocuments(documents: Document[]): Promise<Document[]> {
    return this.createDocuments(
      documents.map((d) => d.pageContent),
      documents.map((d) => d.metadata as Record<string, unknown>),
    );
  }
}

/**
 * Convenience wrapper: split raw text semantically.
 *
 * @example
 * ```ts
 * import { OpenAIEmbeddings } from "@langchain/openai";
 * const chunks = await semanticChunkText(article, { embeddings: new OpenAIEmbeddings() });
 * ```
 */
export async function semanticChunkText(
  text: string,
  options: SemanticChunkerOptions,
): Promise<string[]> {
  if (text.trim().length === 0) {
    return [];
  }
  return new SemanticChunker(options).splitText(text);
}

/** Convenience wrapper: split Documents semantically, preserving metadata. */
export async function semanticChunkDocuments(
  docs: Document[],
  options: SemanticChunkerOptions,
): Promise<Document[]> {
  if (docs.length === 0) {
    return [];
  }
  return new SemanticChunker(options).splitDocuments(docs);
}
