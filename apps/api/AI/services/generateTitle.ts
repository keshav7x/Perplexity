
import { titleModel } from "../Models/openRouter";
import { chatTitlePrompt } from "../PromptsTemplate/generateChatTitle";

export const generateChatTitle = async (firstMessage: string) => {
  const formattedMessages = await chatTitlePrompt.formatMessages({
    firstMessage: firstMessage,
  });
  const response = await titleModel.invoke(formattedMessages);
  const content = Array.isArray(response.content)
    ? response.content
        .map((part) =>
          typeof part === "string" ? part : ("text" in part ? part.text : ""),
        )
        .join("")
    : response.content;
  // Strip surrounding quotes the model sometimes adds despite the prompt.
  return content.toString().trim().replace(/^["']|["']$/g, "");
};
