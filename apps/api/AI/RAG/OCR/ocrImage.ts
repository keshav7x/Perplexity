import { createWorker } from "tesseract.js";

export type OcrImageInput = string | Buffer | Uint8Array;

/**
 * Recognize text in a single image with Tesseract.
 *
 * Accepts a file path, a `Buffer`, or a `Uint8Array` (e.g. an embedded
 * image from `PDFParse#getImage` — wrap with `Buffer.from(bytes)` first
 * if needed; Buffers pass through as-is).
 *
 * @example
 * ```ts
 * const text = await ocrImage("page.png");
 * const text2 = await ocrImage(imageBuffer, "eng+fra");
 * ```
 */
export async function ocrImage(
  image: OcrImageInput,
  language = "eng",
): Promise<string> {
  if (typeof image === "string" && image.trim().length === 0) {
    throw new Error("ocrImage: image path must not be empty");
  }

  const worker = await createWorker(language);

  try {
    const { data } = await worker.recognize(
      typeof image === "string" ? image : Buffer.from(image),
    );
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}
