export interface RagDocument {
  pageContent: string;
  metadata: Record<string, unknown>;
}

export function ocrPagesToDocuments(
  filePath: string,
  pages: OcredPage[],
): RagDocument[] {
  return pages
    .filter((page) => page.pageContent.length > 0)
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