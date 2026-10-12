import { ChatGroq } from "@langchain/groq";

export const groqModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
});
