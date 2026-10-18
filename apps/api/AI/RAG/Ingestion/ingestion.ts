import { chunkDocMarrowBlocks } from "../Chunker/layoutAwareChunk";
import { parseAndEnrich } from "../Helpers/enrichDocument";
import { validateChunks as chunkValidator} from "../Helpers/validateChunks";
import * as fs from 'fs';
import { embedChunks } from "../Helpers/generateEmbedding";

export class directIngestionPipeline{
  private readonly parsedDocument = parseAndEnrich;
  private readonly chunkDocument = chunkDocMarrowBlocks;
  private readonly validateChunk = chunkValidator;
  constructor(
    private filePath:string,
  ) { }

  //get filePath
  private getFilePath = (filePath: string) => {
    this.filePath = filePath
  }

  //get Buffer of the file
  private getRawBuffer = () => {
    const rawBuffer = fs.readFileSync(this.filePath);
    return new Uint8Array(rawBuffer);
  }

  //parse the doc
  private parsedDoc = async() => {
    const rawBuffer = this.getRawBuffer()
    const parsedDocument = await this.parsedDocument(rawBuffer)
    return parsedDocument
  }

  //chunk the doc
  private chunkDoc = async() => {
    const parsedDoc =await this.parsedDoc()
    const semanticChunks = this.chunkDocument(parsedDoc)
    return semanticChunks
  }

  //validate chunk
  private validateChunks = (chunk:any) => {
    const result = this.validateChunk(chunk)
    if (!result.valid) {
      throw new Error(
        `Invalid chunks: ${result.errors.join("; ")}`,
      );
    }

    console.log("Chunk validation passed.");
    if (result.warnings.length > 0) {
      console.warn(result.warnings);
    }

    return chunk;
  }

  //generate embeddings
  private generateEmbeddings = async (chunks: any) => {
    const result = await embedChunks(chunks);
    console.log(`Generated ${result.length} embeddings.`);
    return result;
  };

  //save the embeddings into pinecone

  
  
  //Index for retrieval


  //Mark ingestion complete



  run = async () => {
    this.getFilePath(this.filePath);
    const chunks = await this.chunkDoc();
    this.validateChunks(chunks);
    console.log(chunks)
    // return await this.generateEmbeddings(chunks);
  };
}
