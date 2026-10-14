import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export async function needsOcr(filePath: string): Promise<boolean> {
  const loader = new PDFLoader(filePath, { splitPages: true });
  const docs = await loader.load();

  const totalChars = docs.reduce(
    (sum, doc) => sum + doc.pageContent.trim().length,
    0,
  );

  return totalChars < 100;
}
