import {
  type UIMessage,
  smoothStream,
  streamText,
  stepCountIs,
} from "ai";

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
      messages: Array<UIMessage>
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

    // Save user message to database (convert UIMessage to DB format)
    try {
      await saveMessages({
        messages: [{ 
          id: userMessage.id,
          role: userMessage.role as any,
          content: userMessage.parts,
          createdAt: new Date(), 
          chatId: id 
        }],
      })
    } catch (error) {
      console.error("Failed to save user message:", error)
      return new Response("Failed to save message", { status: 500 })
    }

    console.log("selectedChatModel", selectedChatModel)

    // Convert UIMessages to ModelMessage format for the AI SDK
    const messagesForAI = messages.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.parts as any,
    }))

    try {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),

        system: systemPrompt({
          selectedChatModel,
          textAttachmentStrings: getTextAttachmentStrings(messages),
        }),

        messages: messagesForAI,

        // GPT-5 only supports temperature value of 1
        temperature: 1,

        // Note: Tools integration needs update for v5 dataStream API
        // For now, disabling tools to get basic streaming working
        // tools: {
        //   createDocument: createDocument({
        //     session,
        //     selectedModelId: selectedChatModel,
        //   }),
        //   updateDocument: updateDocument({
        //     session,
        //     selectedModelId: selectedChatModel,
        //   }),
        //   requestSuggestions: requestSuggestions({
        //     session,
        //   }),
        // },

        onFinish: async ({ response }) => {
          if (session.user?.id) {
            try {
              // In v5, save the assistant response messages
              for (const message of response.messages) {
                if (message.role === "assistant") {
                  await saveMessages({
                    messages: [{
                      id: generateUUID(),
                      chatId: id,
                      role: "assistant",
                      content: message.content as any,
                      createdAt: new Date(),
                    }],
                  })
                }
              }
            } catch (error) {
              console.error("Failed to save assistant messages:", error)
            }
          }
        },

        experimental_telemetry: {
          isEnabled: true,
          functionId: "stream-text",
        }
      })

      // In v5, convert the stream result to a proper response
      return result.toTextStreamResponse()
    } catch (error) {
      console.error("Error in streamText execution:", error)
      return new Response(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
        { status: 500 }
      )
    }
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
