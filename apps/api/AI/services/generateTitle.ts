
import { titleModel } from "../Models/openRouter";
import { chatTitlePrompt } from "../PromptsTemplate/generateChatTitle";

export const generateChatTitle = async (firstMessage:string) => {
  const formattedMessages = await chatTitlePrompt.formatMessages({
    firstMessage:firstMessage ,
  });
  const response = await titleModel.invoke(formattedMessages)
  console.log(response.content)
  return response.content
}
