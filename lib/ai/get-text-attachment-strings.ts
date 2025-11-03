import { UIMessage } from "ai"

export const getTextAttachmentStrings = (messages: UIMessage[]): string[] => {
  // In v5, attachments are stored in the parts array with type "file"
  return messages
    .flatMap((message) => message.parts || [])
    .filter(
      (part: any) => part.type === "file" && part.mimeType === "text/plain",
    )
    .map((part: any) => {
      if (!part?.url?.startsWith("data:")) return null
      try {
        const decoded = decodeURIComponent(part.url.split(",")[1])
        return decoded
      } catch {
        return null
      }
    })
    .filter((str) => str !== null)
}
