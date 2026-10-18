import { chunkDocMarrowBlocks } from "../Chunker/layoutAwareChunk";
import { parseAndEnrich } from "../Helpers/enrichDocument";
import { validateChunks as chunkValidator} from "../Helpers/validateChunks";
import * as fs from 'fs';
import { embedChunks } from "../Helpers/generateEmbedding";
import { runStoragePipeline } from "../Helpers/runStoragePipeline";
export class directIngestionPipeline{
  private readonly parsedDocument = parseAndEnrich;
  private readonly chunkDocument = chunkDocMarrowBlocks;
  private readonly validateChunk = chunkValidator;
  private runStorage = runStoragePipeline;
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
    console.log(rawBuffer)
    return parsedDocument
    // return parsedDocument
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

  //run Vectore storage pipeline

  private runEmbeddingStorage = async () => {
    const chunks = await this.chunkDoc();
    const validatedchunks=await this.validateChunks(chunks)
    const result = await this.runStorage(validatedchunks, this.filePath)
    console.log(result)
    return result
  }



  run = async () => {
    this.getFilePath(this.filePath);

    // this.validateChunks(chunks);
    // console.log(chunks)
    // this.parsedDoc()
    await this.runEmbeddingStorage()
  };
}
