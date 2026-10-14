import { createWorker } from "tesseract.js";

export type OcrImageInput = string | Buffer | Uint8Array;

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
