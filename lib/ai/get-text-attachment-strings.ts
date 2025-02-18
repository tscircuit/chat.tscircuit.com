import { Message } from "ai"

export const getTextAttachmentStrings = (messages: Message[]) => {
  return messages
    .flatMap((message) => message.experimental_attachments)
    .filter((attachment) => attachment?.contentType === "text/plain")
    .map((attachment) => {
      if (!attachment?.url.startsWith("data:")) return null
      const decoded = decodeURIComponent(attachment.url.split(",")[1])
      return decoded
    })
    .filter(Boolean)
}
