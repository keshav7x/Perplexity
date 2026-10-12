import { ChatPromptTemplate } from "@langchain/core/prompts";

export const chatTitlePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You generate concise, meaningful titles for conversations.

Rules:
- Base the title on the user's first message.
- Capture the main topic or intent.
- Use 3–6 words whenever possible.
- Use natural, readable title casing.
- Return only the title.
- Do not include quotation marks, explanations, or prefixes.
- Do not answer the user's question.
- If the message is vague, create the best title possible from the available context.`,
  ],
  ["human", "Generate a title for this first message:\n\n{firstMessage}"],
]);
