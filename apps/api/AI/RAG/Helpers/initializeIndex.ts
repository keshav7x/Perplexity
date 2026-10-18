import { pinecone } from "@api/Config/pinecone";

export const initializeIndex = async (indexName:string) => {
  await pinecone.indexes.create({
     name: indexName,
     schema: {
       fields: {
         _values: {
           type: "dense_vector",
           dimension: 768,
           metric: "cosine",
         },
       },
     },
     waitUntilReady: true,
     suppressConflicts: true
  });
  const index = pinecone.index(indexName);
  console.log(`Index "${indexName}" is ready for use.`);
  return index;
}
