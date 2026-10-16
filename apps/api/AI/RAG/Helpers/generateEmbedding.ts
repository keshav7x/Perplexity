import { envConfig } from "@api/Config/env.config";
import OpenAI from "openai";

const openrouter = new OpenAI({
  apiKey: envConfig.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const EMBEDDING_MODEL = "google/gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;
const EMBEDDING_BATCH_SIZE = 200;

export type DocumentChunk = {
  text: string;
  metadata: {
    page?: number;
    currentSection?: string;
    blockTypes?: string[];
  };
};

export type EmbeddedChunk = DocumentChunk & {
  embedding: number[];
};

export async function embedChunks(
  chunks: DocumentChunk[],
): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) {
    throw new Error("Cannot embed an empty chunk list");
  }

  if (chunks.some((chunk) => !chunk.text.trim())) {
    throw new Error("Cannot embed a chunk with empty text");
  }

  const embeddedChunks: EmbeddedChunk[] = [];

  for (
    let start = 0;
    start < chunks.length;
    start += EMBEDDING_BATCH_SIZE
  ) {
    const batch = chunks.slice(start, start + EMBEDDING_BATCH_SIZE);

    const response = await openrouter.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch.map((chunk) => chunk.text),
      encoding_format: "float",
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const ordered = [...response.data].sort(
      (a, b) => a.index - b.index,
    );

    if (ordered.length !== batch.length) {
      throw new Error(
        `Embedding count mismatch in batch starting at chunk ${start}`,
      );
    }

    console.log({
      batchStart: start,
      requested: batch.length,
      returned: ordered.length,
      dimensions: ordered.map((item) => item.embedding.length),
    });

    for (let i = 0; i < batch.length; i++) {
      const embedding = ordered[i]?.embedding;

      if (
        !embedding ||
        embedding.length !== EMBEDDING_DIMENSIONS ||
        !embedding.every(Number.isFinite)
      ) {
        console.dir({
          chunkIndex: start + i,
          hasEmbedding: Boolean(embedding),
          expectedDimensions: EMBEDDING_DIMENSIONS,
          actualDimensions: embedding?.length,
          sample: embedding?.slice(0, 5),
        });

        throw new Error(
          `Invalid embedding for chunk ${start + i}: ` +
            `expected ${EMBEDDING_DIMENSIONS} dimensions, ` +
            `got ${embedding?.length ?? 0}`,
        );
      }

      //@ts-ignore
      embeddedChunks.push({
        ...batch[i],
        embedding,
      });
    }
  }

  return embeddedChunks;
}
