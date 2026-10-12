import { groqModel } from "./Models/Groq";
import { openRouterModel } from "./Models/openRouter";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type Provider = "groq" | "openrouter" | "nvidia";

export const AIRegistry= (name: Provider):BaseChatModel  => {
  switch (name) {
    case 'groq':
      return groqModel
    case 'openrouter':
      return openRouterModel
    default:
      return groqModel
  }
}
