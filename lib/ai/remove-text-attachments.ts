import { UIMessage } from "ai"

export const removeTextAttachments = (messages: UIMessage[]) => {
  return messages.map((message) => {
    // In v5, filter out text file attachments from the parts array
    return {
      ...message,
      parts: message.parts?.filter(
        (part: any) =>
          !(part.type === "file" && part.mimeType === "text/plain"),
      ),
    }
  })
}
