
import path from "node:path";

export type FileType =
  | "pdf"
  | "docx"
  | "txt"
  | "md"
  | "html"
  | "csv"
  | "json";

const supportedTypes: Record<string, FileType> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".txt": "txt",
  ".md": "md",
  ".html": "html",
  ".htm": "html",
  ".csv": "csv",
  ".json": "json",
};

export function detectFileType(filePath: string): FileType {
  const extension = path.extname(filePath).toLowerCase();
  const fileType = supportedTypes[extension];

  if (!fileType) {
    throw new Error(
      `Unsupported file type: ${extension || "(no extension)"}`,
    );
  }

  return fileType;
}
