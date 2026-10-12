import { AIRegistry, type Provider } from "../modelRegistery";

export const completeChat = async (provider: Provider, message: string) => {
  const model = AIRegistry(provider)
  const response = await model.invoke(message)
  console.log(response.content)
}
