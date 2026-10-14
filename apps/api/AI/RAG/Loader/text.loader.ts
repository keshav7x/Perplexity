
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";

export async function loadText(filePath: string) {
  const loader = new TextLoader(filePath);
  const documents = await loader.load();

  return documents;
}
