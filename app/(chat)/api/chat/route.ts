import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from "ai"

import { getSession } from "@/app/(auth)/server-auth"
import { myProvider } from "@/lib/ai/models"
import { systemPrompt } from "@/lib/ai/prompts/prompts"
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from "@/lib/db/queries"
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "@/lib/utils"

import { generateTitleFromUserMessage } from "../../actions"
import { createDocument } from "@/lib/ai/tools/create-document"
import { updateDocument } from "@/lib/ai/tools/update-document"
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions"
import { removeTextAttachments } from "@/lib/ai/remove-text-attachments"
import { getTextAttachmentStrings } from "@/lib/ai/get-text-attachment-strings"

export const maxDuration = 300 // enable fluid computing

export async function POST(request: Request) {
  try {
    // Parse request body
    let requestData: {
      id: string
      messages: Array<Message>
      selectedChatModel: string
    }
    try {
      requestData = await request.json()
    } catch (error) {
      console.error("Failed to parse request body:", error)
      return new Response("Invalid request body", { status: 400 })
    }

    const { id, messages, selectedChatModel } = requestData

    // Validate session
    const session = await getSession()
    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Validate user message
    const userMessage = getMostRecentUserMessage(messages)
    if (!userMessage) {
      return new Response("No user message found", { status: 400 })
    }

    // Handle chat creation/title generation
    try {
      const chat = await getChatById({ id })
      if (!chat) {
        console.log("Generating title for new chat...")
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        })
        console.log("Generated title:", title)
        await saveChat({ id, userId: session.user.id, title })
        console.log("Saved new chat with title")
      }
    } catch (error) {
      console.error("Failed to handle chat creation:", error)
      console.error(
        "Error details:",
        error instanceof Error ? error.message : String(error),
      )
      return new Response("Failed to create or retrieve chat", { status: 500 })
    }

    // Save user message
    try {
      await saveMessages({
        messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
      })
    } catch (error) {
      console.error("Failed to save user message:", error)
      return new Response("Failed to save message", { status: 500 })
    }

    console.log("selectedChatModel", selectedChatModel)

    return createDataStreamResponse({
      execute: (dataStream) => {
        try {
          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPrompt({
              selectedChatModel,
              textAttachmentStrings: getTextAttachmentStrings(messages),
            }),
            messages: removeTextAttachments(messages),
            maxSteps: 5,
            temperature: 1, // GPT-5 only supports temperature value of 1
            experimental_activeTools: selectedChatModel.includes("reasoning")
              ? []
              : ["createDocument", "updateDocument", "requestSuggestions"],
            experimental_transform: smoothStream({ chunking: "word" }),
            experimental_generateMessageId: generateUUID,
            tools: {
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
              requestSuggestions: requestSuggestions({
                session,
                dataStream,
              }),
            },
            onFinish: async ({ response, reasoning }) => {
              if (session.user?.id) {
                try {
                  const sanitizedResponseMessages = sanitizeResponseMessages({
                    messages: response.messages,
                    reasoning,
                  })

                  await saveMessages({
                    messages: sanitizedResponseMessages.map((message) => {
                      return {
                        id: message.id,
                        chatId: id,
                        role: message.role,
                        content: message.content,
                        createdAt: new Date(),
                      }
                    }),
                  })
                } catch (error) {
                  console.error("Failed to save assistant messages:", error)
                }
              }
            },
            experimental_telemetry: {
              isEnabled: true,
              functionId: "stream-text",
            },
          })

          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          })
        } catch (error) {
          console.error("Error in streamText execution:", error)
          dataStream.writeData({
            type: "error",
            content: `Error: ${error instanceof Error ? error.message : String(error)}`,
          })
        }
      },
      onError: (error) => {
        console.error("DataStream error:", error)
        return `Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`
      },
    })
  } catch (error) {
    console.error("Unexpected error in POST handler:", error)
    return new Response(
      `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        status: 500,
      },
    )
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return new Response("Not Found", { status: 404 })
  }

  const session = await getSession()

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const chat = await getChatById({ id })

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    await deleteChatById({ id })

    return new Response("Chat deleted", { status: 200 })
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    })
  }
}
