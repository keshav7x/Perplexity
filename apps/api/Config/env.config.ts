import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string(),
  STORAGE_URL: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  JWT_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  BASE_URL: z.string(),
  NVIDIA_API_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
  GROQ_API_KEY: z.string(),
  EXA_API_KEY: z.string(),
  TAVILY_API_KEY:z.string(),
  REDIS_URL: z.string(),
  PINECONE_API_KEY: z.string(),
  PINECONE_HOST: z.string(),
  OPENROUTER_API_KEY: z.string(),
  
  
})

export const envConfig=envSchema.parse(process.env);
