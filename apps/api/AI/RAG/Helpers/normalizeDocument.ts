
import { Document } from "@langchain/core/documents";

type LoadedDocument = Document<Record<string, unknown>>;

export function normalizeDocument(
  documents: LoadedDocument[],
): Document<Record<string, string | number | boolean>>[] {
  return documents.map((document) => {
    const pageContent = document.pageContent.trim();

    if (!pageContent) {
      throw new Error("Cannot normalize an empty document");
    }

    return new Document({
      pageContent,
      metadata: {
        ...document.metadata,
        source: String(document.metadata.source ?? "unknown"),
        normalized: true,
        normalizedAt: new Date().toISOString(),
      },
    });
  });
}
