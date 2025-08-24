import { openai } from "@ai-sdk/openai"
import { customProvider, wrapLanguageModel } from "ai"

export const DEFAULT_CHAT_MODEL: string = "gpt-5"

export const myProvider = customProvider({
  languageModels: {
    // "chat-model-small": openai("gpt-4o-mini"),
    // "chat-model-large": openai("gpt-4o"),
    // "circuit-engineer-large-reasoning": wrapLanguageModel({
    //   model: fireworks("accounts/fireworks/models/deepseek-r1"),
    //   middleware: extractReasoningMiddleware({ tagName: "think" }),
    // }),
    // There is currently an issue where anthropic will update the document
    // after creating it
    // "circuit-engineer-large": anthropic("claude-3-5-sonnet-latest"),
    "title-model": wrapLanguageModel({
      model: openai("gpt-5-mini"),
      middleware: [],
    }),
    "block-model": wrapLanguageModel({
      model: openai("gpt-5"),
      middleware: [],
    }),
    "gpt-5": wrapLanguageModel({ model: openai("gpt-5"), middleware: [] }),
    "gpt-5-mini": wrapLanguageModel({
      model: openai("gpt-5-mini"),
      middleware: [],
    }),
  },
  imageModels: {
    // 'small-model': openai.image('dall-e-2'),
    // 'large-model': openai.image('dall-e-3'),
  },
})

interface ChatModel {
  id: string
  name: string
  description: string
}

export const chatModels: Array<ChatModel> = [
  {
    id: "gpt-5",
    name: "GPT 5",
    description: "GPT 5 for general assistance",
  },
  {
    id: "gpt-5-mini",
    name: "GPT 5 Mini",
    description: "GPT 5 Mini for general assistance",
  },
]
