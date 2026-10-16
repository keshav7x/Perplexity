interface DocMarrowBlock {
  type: string;
  text?: string;
  markdown?: string;
  level?: number;
  page: number;
}

interface EnrichedChunk {
  text: string;
  metadata: {
    page: number;
    currentSection: string;
    blockTypes: string[];
  };
}

export function chunkDocMarrowBlocks(blocks: DocMarrowBlock[], maxTokensEst = 500): EnrichedChunk[] {
  const chunks: EnrichedChunk[] = [];
  let currentChunkText = "";
  let currentSection = "Introduction";
  let currentPage = 1;
  let blockTypesInChunk: string[] = [];

  for (const block of blocks) {
    if (block.type === 'heading') {
      currentSection = block.text || currentSection;
    }

    const blockContent = block.type === 'table' ? block.markdown : block.text;
    if (!blockContent) continue;

    const currentLength = (currentChunkText + blockContent).length / 4;

    if (currentLength > maxTokensEst || block.type === 'table') {
      if (currentChunkText.trim()) {
        chunks.push({
          text: currentChunkText.trim(),
          metadata: { page: currentPage, currentSection, blockTypes: [...blockTypesInChunk] }
        });
      }
      // Reset for next chunk
      currentChunkText = "";
      blockTypesInChunk = [];
    }

    currentPage = block.page;
    blockTypesInChunk.push(block.type);

    if (block.type === 'heading') {
      currentChunkText += `\n\n## ${blockContent}\n`;
    } else {
      currentChunkText += `\n${blockContent}\n`;
    }

    // If it's a table, flush it immediately so it stays isolated
    if (block.type === 'table') {
      chunks.push({
        text: currentChunkText.trim(),
        metadata: { page: currentPage, currentSection, blockTypes: [block.type] }
      });
      currentChunkText = "";
      blockTypesInChunk = [];
    }
  }

  // Push any remaining text
  if (currentChunkText.trim()) {
    chunks.push({
      text: currentChunkText.trim(),
      metadata: { page: currentPage, currentSection, blockTypes: blockTypesInChunk }
    });
  }

  return chunks;
}
