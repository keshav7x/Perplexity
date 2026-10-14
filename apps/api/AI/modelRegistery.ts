import { geminiModel } from "./Models/Gemini";
import { groqModel } from "./Models/Groq";
import { openRouterModel } from "./Models/openRouter";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type Provider = "groq" | "openrouter" | "nvidia" | "gemini";

export const AIRegistry= (name: Provider)  => {
  switch (name) {
    case 'groq':
      return groqModel
    case 'openrouter':
      return openRouterModel
    case 'gemini':
      return geminiModel
    default:
      return groqModel
  }
}
