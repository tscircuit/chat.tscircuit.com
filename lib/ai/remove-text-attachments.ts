import { Message } from "ai"

export const removeTextAttachments = (messages: Message[]) => {
  return messages.map((message) => {
    return {
      ...message,
      experimental_attachments: undefined,
      // experimental_attachments: message.experimental_attachments?.filter(
      //   (attachment) => attachment.contentType !== "text/plain",
      // ),
    }
  })
}
