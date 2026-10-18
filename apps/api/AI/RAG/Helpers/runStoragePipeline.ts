import { embedChunks, type DocumentChunk } from "./generateEmbedding";
import { initializeIndex } from "./initializeIndex";

export const runStoragePipeline = async (
  chunks: DocumentChunk[],
  namespace = "document-vault",
) => {
  try {
    const index = await initializeIndex("byo-vectors");

    console.log(`Embedding ${chunks.length} chunks...`);

    const embeddedChunks = await embedChunks(chunks);

    const records = embeddedChunks.map((chunk, i) => ({
      id: `chunk-${i}`,
      values: chunk.embedding,
      metadata: {
        text: chunk.text,
        ...(chunk.metadata.page !== undefined && {
          page: chunk.metadata.page,
        }),
        ...(chunk.metadata.currentSection && {
          currentSection: chunk.metadata.currentSection,
        }),
        ...(chunk.metadata.blockTypes && {
          blockTypes: chunk.metadata.blockTypes,
        }),
      },
    }));

    console.log("Prepared records:", records.length);
    console.log("Target namespace:", namespace);
    console.log("First record dimensions:", records[0]?.values.length);

    console.log("Sending upsert request...");

    await index.namespace(namespace).upsert({ records });

    console.log("Upsert request completed.");

    const stats = await index.describeIndexStats();

    console.dir(stats, { depth: 5 });

    return records;
  } catch (error) {
    console.error("Pinecone storage pipeline failed:", error);
    throw error;
  }
};
