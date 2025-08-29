import { generateUUID } from "@/lib/utils"
import { DataStreamWriter, tool } from "ai"
import { z } from "zod"
import { blockKinds, documentHandlersByBlockKind } from "@/lib/blocks/server"
import { Session } from "@/app/(auth)/server-auth"

interface CreateDocumentProps {
  session: Session
  dataStream: DataStreamWriter
  selectedModelId?: string
}

export const createDocument = ({
  session,
  dataStream,
  selectedModelId,
}: CreateDocumentProps) =>
  tool({
    description:
      "Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.",
    parameters: z.object({
      title: z.string(),
      kind: z.enum(blockKinds),
    }),
    execute: async ({ title, kind }) => {
      const id = generateUUID()

      dataStream.writeData({
        type: "kind",
        content: kind,
      })

      dataStream.writeData({
        type: "id",
        content: id,
      })

      dataStream.writeData({
        type: "title",
        content: title,
      })

      dataStream.writeData({
        type: "clear",
        content: "",
      })

      const documentHandler = documentHandlersByBlockKind.find(
        (documentHandlerByBlockKind) =>
          documentHandlerByBlockKind.kind === kind,
      )

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`)
      }

      await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
        selectedModelId,
      })

      dataStream.writeData({ type: "finish", content: "" })

      return {
        id,
        title,
        kind,
        content: "A document was created and is now visible to the user.",
      }
    },
  })
