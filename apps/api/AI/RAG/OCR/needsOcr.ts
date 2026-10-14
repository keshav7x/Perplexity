import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export interface NeedsOcrOptions {
  /**
   * Minimum extractable chars for a PDF to count as text-based.
   * Scanned/image-only PDFs extract ~0 chars. Defaults to 100.
   */
  minTotalChars?: number;
}

/**
 * Heuristic: a PDF needs OCR when its embedded text layer is (near-)empty,
 * i.e. the pages are scanned images. If the text layer can't be read at all,
 * returns `true` (safer to OCR than to ingest nothing).
 */
export async function needsOcr(
  filePath: string,
  options: NeedsOcrOptions = {},
): Promise<boolean> {
  const { minTotalChars = 100 } = options;

  let docs;
  try {
    const loader = new PDFLoader(filePath, { splitPages: true });
    docs = await loader.load();
  } catch {
    return true;
  }

  if (docs.length === 0) {
    return true;
  }

  const totalChars = docs.reduce(
    (sum, doc) => sum + doc.pageContent.trim().length,
    0,
  );

  return totalChars < minTotalChars;
}
