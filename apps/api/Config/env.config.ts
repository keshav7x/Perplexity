import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string(),
  STORAGE_URL: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  JWT_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  BASE_URL: z.string(),
  // MISTRAL_API_KEY: z.string(),
  // GEMINI_API_KEY: z.string(),
  // GROQ_API_KEY: z.string(),
  // TAVILY_API_KEY: z.string(),
  // crewAi: z.string(),
  REDIS_URL:z.string()
  
  
})

export const envConfig=envSchema.parse(process.env);
