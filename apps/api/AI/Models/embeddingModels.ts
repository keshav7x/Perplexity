import { envConfig } from "@api/Config/env.config";
import OpenAI from "openai";

export const ai = new OpenAI({
  apiKey: envConfig.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
