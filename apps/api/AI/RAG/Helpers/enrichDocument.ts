import { parseDocument } from 'docmarrow';
import * as fs from 'fs';

export async function parseAndEnrich(fileBuffer:any) {

  // 1. Structural Parsing
  const parsedDoc = await parseDocument(fileBuffer);

  // 2. Access the markdown property directly (No parentheses)
  const cleanMarkdown = parsedDoc.markdown; // Fixed property access

  // 3. Access RAG ready chunks or the structural blocks array
  const jsonBlocks = parsedDoc.blocks;

  console.log("Structured Markdown loaded cleanly!");
  return jsonBlocks
}
