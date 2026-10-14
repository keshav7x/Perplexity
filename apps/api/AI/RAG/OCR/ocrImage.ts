import { createWorker } from "tesseract.js";

export async function ocrImage(
  imagePath: string,
  language = "eng",
): Promise<string> {
  const worker = await createWorker(language);

  try {
    const { data } = await worker.recognize(imagePath);
    return data.text;
  } finally {
    await worker.terminate();
  }
}