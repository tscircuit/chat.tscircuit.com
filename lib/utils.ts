import type {
  CoreAssistantMessage,
  CoreToolMessage,
  UIMessage,
  TextStreamPart,
  UIToolInvocation,
  ToolSet,
} from "ai"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import type { Message as DBMessage, Document } from "@/lib/db/schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ApplicationError extends Error {
  info: string
  status: number
}

export const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as ApplicationError

    error.info = await res.json()
    error.status = res.status

    throw error
  }

  return res.json()
}

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]")
  }
  return []
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  });
}

export function convertToUIMessages(
  messages: Array<DBMessage>,
): Array<UIMessage> {
  return messages.map((message) => {
    const parts: any[] = []
    
    // Convert old content format to new parts array
    if (typeof message.content === "string" && message.content) {
      parts.push({ type: "text", text: message.content })
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === "text") {
          parts.push({ type: "text", text: content.text })
        } else if (content.type === "tool-call") {
          parts.push({
            type: `tool-${content.toolName}`,
            toolCallId: content.toolCallId,
            input: content.args,
          })
        } else if (content.type === "reasoning") {
          parts.push({ type: "text", text: content.reasoningText })
        }
      }
    }

    return {
      id: message.id,
      role: message.role as any,
      parts: parts.length > 0 ? parts : [{ type: "text", text: "" }],
    } as UIMessage
  })
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage
type ResponseMessage = ResponseMessageWithoutId & { id: string }

export function sanitizeResponseMessages({
  messages,
  reasoningText,
}: {
  messages: Array<ResponseMessage>
  reasoningText: string | undefined
}) {
  // In v5, just filter out empty messages
  return messages.filter((message) => {
    if (message.role === "assistant" && Array.isArray(message.content)) {
      return message.content.length > 0
    }
    return true
  })
}

export function sanitizeUIMessages(messages: Array<UIMessage>): Array<UIMessage> {
  // In v5, filter out messages with empty parts
  return messages.filter((message) => {
    return message.parts && message.parts.length > 0
  })
}

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === "user")
  return userMessages.at(-1)
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date()
  if (index > documents.length) return new Date()

  return documents[index].createdAt
}
