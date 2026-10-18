import crypto from "crypto";
import type { DocumentChunk } from "../Helpers/generateEmbedding";

const generateRecordId = (chunk: DocumentChunk, index: number): string => {
  const hash = crypto.createHash("sha256").update(chunk.text).digest("hex");

  const parts = ["chunk", hash];
  if (chunk.metadata?.page) {
    parts.push(`p${chunk.metadata.page}`);
  }
  parts.push(String(index));

  return parts.join("-");
};
