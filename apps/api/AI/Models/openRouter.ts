import { ChatOpenRouter } from "@langchain/openrouter";

export const openRouterModel = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "openai/gpt-4o",
});


export const titleModel = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "google/gemini-3.1-flash-lite",
  temperature: 0.2,
  maxTokens: 30,
});
