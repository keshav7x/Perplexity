import { createWorker } from "tesseract.js";
import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

interface OcredPage {
  pageNumber: number;
  pageContent: string;
}

export async function ocrPdf(pdfPath: string): Promise<OcredPage[]> {
  const buffer = await readFile(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const images = await parser.getImages(); 

  const worker = await createWorker("eng");
  const pages: OcredPage[] = [];

  try {
    for (const image of images) {
      const { data } = await worker.recognize(image.data);

      pages.push({
        pageNumber: image.pageNumber,
        pageContent: data.text.trim(),
      });
    }
  } finally {
    await worker.terminate();
  }

  return pages;
}
