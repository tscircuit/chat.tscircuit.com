import { openai } from "@ai-sdk/openai"
import { fireworks } from "@ai-sdk/fireworks"
import { anthropic } from "@ai-sdk/anthropic"
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai"

export const DEFAULT_CHAT_MODEL: string = "circuit-engineer-small"

export const myProvider = customProvider({
  languageModels: {
    // "chat-model-small": openai("gpt-4o-mini"),
    // "chat-model-large": openai("gpt-4o"),
    "circuit-engineer-large-reasoning": wrapLanguageModel({
      model: fireworks("accounts/fireworks/models/deepseek-r1"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    // There is currently an issue where anthropic will update the document
    // after creating it
    // "circuit-engineer-large": anthropic("claude-3-5-sonnet-latest"),
    "title-model": openai("gpt-4-turbo"),
    "block-model": openai("gpt-4o"),
    "tscircuit-engineer-small": openai("gpt-4o"),
    "tscircuit-engineer-tiny": openai("gpt-4o-mini"),
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
    id: "circuit-engineer-tiny",
    name: "Circuit Engineer (tiny)",
    description: "Tiny-model smart assistant for questions about tscircuit",
  },
  {
    id: "circuit-engineer-small",
    name: "Circuit Engineer (small)",
    description: "Small-model smart assistant for questions about tscircuit",
  },
  {
    id: "circuit-engineer-large-reasoning",
    name: "Circuit Engineer (large)",
    description: "Large reasoning model for circuit generation",
  },
]
