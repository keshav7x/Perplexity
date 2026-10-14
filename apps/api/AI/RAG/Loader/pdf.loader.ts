import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

interface PdfPage {
  pageContent: string;
  metadata: Record<string, unknown>;
}

export const loadPdf = async (filePath: string): Promise<PdfPage[]> => {
  const loader = new PDFLoader(filePath, {
    splitPages: true,
  });

  const docs = await loader.load();

  if (docs.length === 0) {
    throw new Error(`No pages could be extracted from PDF: ${filePath}`);
  }

  console.log(`Loaded ${docs.length} pages from ${filePath}`);
  console.log("Page 1 metadata:", docs[0]!.metadata);

  return docs.map((doc) => ({
    pageContent: doc.pageContent,
    metadata: {
      ...doc.metadata,
      source: filePath,
      fileType: "pdf",
    },
  }));
};