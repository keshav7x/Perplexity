import type { OcredPage } from "./ocrPdf";

/**
 * RAG document shape. Metadata is restricted to primitives so chunks stay
 * compatible with vector-store serializers and `Loader/TextLoader` output.
 */
export interface RagDocument {
  pageContent: string;
  metadata: Record<string, string | number | boolean>;
}

/**
 * Convert OCRed pages into RAG documents, dropping blank pages.
 * Metadata records provenance (`scanned_pdf` + `tesseract_ocr`) and the
 * 1-based `pageNumber` for citation.
 */
export function ocrPagesToDocuments(
  filePath: string,
  pages: OcredPage[],
): RagDocument[] {
  return pages
    .filter((page) => page.pageContent.trim().length > 0)
    .map((page) => ({
      pageContent: page.pageContent,
      metadata: {
        source: filePath,
        sourceType: "scanned_pdf",
        pageNumber: page.pageNumber,
        extractionMethod: "tesseract_ocr",
      },
    }));
}
