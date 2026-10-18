import { Pinecone } from '@pinecone-database/pinecone';
import { envConfig } from './env.config';

export const pinecone = new Pinecone({
  apiKey: envConfig.PINECONE_API_KEY,
});

