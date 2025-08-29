import { smoothStream, streamText } from "ai"
import { myProvider } from "@/lib/ai/models"
import { createDocumentHandler } from "@/lib/blocks/server"
import { updateDocumentPrompt } from "@/lib/ai/prompts/prompts"

export const textDocumentHandler = createDocumentHandler<"text">({
  kind: "text",
  onCreateDocument: async ({ title, dataStream, selectedModelId }) => {
    let draftContent = ""

    const { fullStream } = streamText({
      model: myProvider.languageModel(selectedModelId ?? "block-model"),
      system:
        "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: title,
      temperature: 1, // GPT-5 only supports temperature value of 1
    })

    for await (const delta of fullStream) {
      const { type } = delta

      if (type === "text-delta") {
        const { textDelta } = delta

        draftContent += textDelta

        dataStream.writeData({
          type: "text-delta",
          content: textDelta,
        })
      }
    }

    return draftContent
  },
  onUpdateDocument: async ({ document, description, dataStream, selectedModelId }) => {
    let draftContent = ""

    const { fullStream } = streamText({
      model: myProvider.languageModel(selectedModelId ?? "block-model"),
      system: updateDocumentPrompt(document.content, "text"),
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: description,
      temperature: 1, // GPT-5 only supports temperature value of 1
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: "content",
            content: document.content,
          },
        },
      },
    })

    for await (const delta of fullStream) {
      const { type } = delta

      if (type === "text-delta") {
        const { textDelta } = delta

        draftContent += textDelta
        dataStream.writeData({
          type: "text-delta",
          content: textDelta,
        })
      }
    }

    return draftContent
  },
})
