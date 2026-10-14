import { createWorker } from "tesseract.js";
import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

/** One OCRed PDF page: 1-based page number plus extracted text. */
export interface OcredPage {
  pageNumber: number;
  pageContent: string;
}

export interface OcrPdfOptions {
  /** Tesseract language(s), e.g. "eng" or "eng+fra". Defaults to "eng". */
  language?: string;
  /** Screenshot render scale (2 ≈ 144 DPI, better accuracy). Defaults to 2. */
  scale?: number;
  /** Only OCR these 1-based page numbers. Defaults to all pages. */
  pages?: number[];
  /** Skip storing pages whose trimmed text is empty. Defaults to true. */
  skipEmptyPages?: boolean;
}

/**
 * OCR a PDF by rendering each page to a PNG screenshot (`PDFParse#getScreenshot`)
 * and recognizing it with Tesseract.
 *
 * Screenshots (not `getImage` embedded fragments) are used so every page —
 * including scanned/image-only pages — is fully covered.
 *
 * @example
 * ```ts
 * const pages = await ocrPdf("scan.pdf");
 * const docs = ocrPagesToDocuments("scan.pdf", pages);
 * ```
 */
export async function ocrPdf(
  pdfPath: string,
  options: OcrPdfOptions = {},
): Promise<OcredPage[]> {
  const {
    language = "eng",
    scale = 2,
    pages: onlyPages,
    skipEmptyPages = true,
  } = options;

  const buffer = await readFile(pdfPath);
  if (buffer.length === 0) {
    throw new Error(`PDF file is empty: ${pdfPath}`);
  }

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const worker = await createWorker(language);

  try {
    const screenshots = await parser.getScreenshot({
      ...(onlyPages ? { partial: onlyPages } : {}),
      scale,
      imageBuffer: true,
    });

    if (screenshots.pages.length === 0) {
      throw new Error(`No pages could be rendered from PDF: ${pdfPath}`);
    }

    const ocred: OcredPage[] = [];
    for (const shot of screenshots.pages) {
      try {
        const { data } = await worker.recognize(Buffer.from(shot.data));
        const text = data.text.trim();
        if (text.length === 0 && skipEmptyPages) {
          continue;
        }
        ocred.push({ pageNumber: shot.pageNumber, pageContent: text });
      } catch (pageError) {
        // One unreadable page must not abort the whole document.
        console.warn(
          `OCR failed for page ${shot.pageNumber} of ${pdfPath}:`,
          pageError instanceof Error ? pageError.message : pageError,
        );
      }
    }

    return ocred;
  } finally {
    await worker.terminate();
    await parser.destroy();
  }
}
