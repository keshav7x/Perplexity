import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { AIRegistry, type Provider } from "../modelRegistery";

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export const completeChat = async (
  provider: Provider,
  message: string,
  history: ChatHistoryItem[] = [],
) => {
  const model = AIRegistry(provider);
  const messages = [
    ...history.map((item) =>
      item.role === "assistant"
        ? new AIMessage(item.content)
        : new HumanMessage(item.content),
    ),
    new HumanMessage(message),
  ];
  const response = await model.invoke(messages);
  const content = Array.isArray(response.content)
    ? response.content
        .map((part) =>
          typeof part === "string" ? part : ("text" in part ? part.text : ""),
        )
        .join("")
    : response.content;
  return content.toString();
};
