
import path from "node:path";
import { loadPdf } from "../Loader/pdf.loader";
import { loadText } from "../Loader/text.loader";

export function returnLoader(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".pdf":
      return loadPdf;

    case ".txt":
    case ".md":
      return loadText;

    default:
      throw new Error(
        `Unsupported file extension: ${extension || "(none)"}`,
      );
  }
}
