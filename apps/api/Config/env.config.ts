import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string(),
  STORAGE_URL: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  JWT_SECRET: z.string(),
  SEND_GRID_API:z.string()
})

export const envConfig=envSchema.parse(process.env);
