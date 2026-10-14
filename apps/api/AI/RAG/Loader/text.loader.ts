import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export interface RagDocument {
  pageContent: string;
  metadata: Record<string, string | number | boolean>;
}

export interface TextLoaderOptions {
  encoding?: BufferEncoding;
  sourceType?: string;
}

export class TextLoader {
  constructor(
    private readonly filePath: string,
    private readonly options: TextLoaderOptions = {},
  ) {}

  async load(): Promise<RagDocument[]> {
    const encoding = this.options.encoding ?? "utf-8";

    const [raw, stats] = await Promise.all([
      readFile(this.filePath, encoding),
      stat(this.filePath),
    ]);

    if (!raw.trim()) {
      throw new Error(`Text file is empty: ${this.filePath}`);
    }

    return [
      {
        pageContent: raw,
        metadata: {
          source: path.resolve(this.filePath),
          fileName: path.basename(this.filePath),
          sourceType: this.options.sourceType ?? "text",
          sizeBytes: stats.size,
          loadedAt: new Date().toISOString(),
        },
      },
    ];
  }
}
