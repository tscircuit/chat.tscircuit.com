import { generateUUID } from "@/lib/utils"
import { UIMessageStreamWriter, tool } from "ai"
import { z } from "zod/v3"
import { blockKinds, documentHandlersByBlockKind } from "@/lib/blocks/server"
import { Session } from "@/app/(auth)/server-auth"

interface CreateDocumentProps {
  session: Session
  dataStream: UIMessageStreamWriter
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
    inputSchema: z.object({
      title: z.string(),
      kind: z.enum(blockKinds),
    }),
    execute: async ({ title, kind }) => {
      const id = generateUUID()

      dataStream.write({
        type: "data-kind",
        data: kind,
      })

      dataStream.write({
        type: "data-id",
        data: id,
      })

      dataStream.write({
        type: "data-title",
        data: title,
      })

      dataStream.write({
        type: "data-clear",
        data: "",
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

      dataStream.write({
        type: "data-finish",
        data: "",
      })

      return {
        id,
        title,
        kind,
        content: "A document was created and is now visible to the user.",
      }
    },
  })
