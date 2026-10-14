import { Document } from "@langchain/core/documents";
import {
  adaptiveChunkDocuments,
  type AdaptiveChunkOptions,
} from "../Chunker/adaptive.chunk";
import { returnLoader } from "./chooseLoader";

export async function chooseChunker(
  filePath: string,
  options: AdaptiveChunkOptions = {},
): Promise<Document[]> {
  const load = returnLoader(filePath);
  const raw = await load(filePath);

  const docs = raw
    .filter((doc) => doc.pageContent.trim().length > 0)
    .map(
      (doc) =>
        new Document({
          pageContent: doc.pageContent.trim(),
          metadata: { ...doc.metadata, source: filePath },
        }),
    );

  if (docs.length === 0) {
    throw new Error(`No extractable content found in: ${filePath}`);
  }

  return adaptiveChunkDocuments(docs, options);
}
