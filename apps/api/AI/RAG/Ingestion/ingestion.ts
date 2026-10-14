import { chunkers as availableChunkers } from "../Chunker";
import { allLoders as availableLoaders } from "../Loader";
import { normalizeDocument } from "../Helpers/normalizeDocument";
import { detectFileType } from "../Helpers/detectFilePath";
import { Document } from "@langchain/core/documents";
import {
  adaptiveChunkDocuments,
  type AdaptiveChunkOptions,
} from "../Chunker/adaptive.chunk";

export class ingestationPipeline {
  constructor(
    private readonly chunkers = availableChunkers,
    private readonly loaders = availableLoaders,
    private readonly chunkOptions: AdaptiveChunkOptions = {},
  ) {}

  private returnfileType = (path: string) => {
    const type = detectFileType(path);
    return type;
  };

  private chooseLoader = (filepath: string) => {
    const type = this.returnfileType(filepath);
    return type === "pdf" ? this.loaders.pdf : this.loaders.text;
  };

  private normalizeDocument = (
    documents: Document<Record<string, unknown>>[],
  ) => {
    const nonEmpty = documents.filter(
      (doc) => doc.pageContent.trim().length > 0,
    );
    if (nonEmpty.length === 0) {
      throw new Error("No extractable content found in file");
    }
    const normalizedDocument = normalizeDocument(nonEmpty);
    return normalizedDocument;
  };

  private getDocument = async (filepath: string) => {
    const loader = this.chooseLoader(filepath);
    const document = await loader(filepath);
    const normalized = this.normalizeDocument(document);
    return normalized;
  };

  chunkDocument = async (
    filepath: string,
    options: AdaptiveChunkOptions = {},
  ) => {
    const documents = await this.getDocument(filepath);
    const chunks = await adaptiveChunkDocuments(documents, {
      ...this.chunkOptions,
      ...options,
    });
    return chunks;
  };

  enrichChunks = async () => {};

  embedDocuments = async () => {};
}
