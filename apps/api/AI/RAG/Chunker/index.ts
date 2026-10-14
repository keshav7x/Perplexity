import { adaptiveChunkText } from "./adaptive.chunk";
import { aiDrivenChunkText } from "./ai.driven.chunk";
import { contextEnrichedChunkDocuments } from "./contextEnriched.chunk";
import { chunkDocumentText } from "./document.chunk";
import { recursiveChunkText } from "./Recursive.chunk";
import { semanticChunkText } from "./semantic.chunk";
import { tokenBasedChunker } from "./token.chunker";

export const chunkers = {
adaptive: adaptiveChunkText,
aiDriven: aiDrivenChunkText,
contextEnriched: contextEnrichedChunkDocuments,
document: chunkDocumentText,
recursive: recursiveChunkText,
semantic: semanticChunkText,
tokenBased: tokenBasedChunker,
} as const;

