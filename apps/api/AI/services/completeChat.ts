import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { AIRegistry, type Provider } from "../modelRegistery";
import { agents } from "../Agents/agents";

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export const completeChat = async (
  provider: Provider,
  message: string,
  history: ChatHistoryItem[] = [],
): Promise<string> => {
  const model = AIRegistry(provider);
  const agent = await agents(model);

  const allMessages = [
    ...history.map((item) =>
      item.role === "assistant"
        ? new AIMessage(item.content)
        : new HumanMessage(item.content),
    ),
    new HumanMessage(message),
  ];

  const response = await agent.invoke({
    messages: allMessages,
  });

  const lastMessage = response.messages?.at(-1);

  if (!lastMessage) {
    throw new Error("Agent returned no messages.");
  }

  const content = lastMessage.content;

  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) =>
      typeof part === "string"
        ? part
        : "text" in part
          ? part.text
          : "",
    )
    .join("");
};
