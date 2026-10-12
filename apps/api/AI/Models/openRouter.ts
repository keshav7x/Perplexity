import { ChatOpenRouter } from "@langchain/openrouter";

export const openRouterModel = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "openai/gpt-4o",
});