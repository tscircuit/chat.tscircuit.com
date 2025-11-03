"use client"

import type { UIMessage } from "ai"
import { useChat } from "@ai-sdk/react"
import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"

import { ChatHeader } from "@/components/chat-header"
import type { Vote } from "@/lib/db/schema"
import { fetcher, generateUUID } from "@/lib/utils"

import { Block } from "./block"
import { MultimodalInput } from "./multimodal-input"
import { Messages } from "./messages"
import type { VisibilityType } from "./visibility-selector"
import { useBlockSelector } from "@/hooks/use-block"
import { toast } from "sonner"

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string
  initialMessages: Array<UIMessage>
  selectedChatModel: string
  selectedVisibilityType: VisibilityType
  isReadonly: boolean
}) {
  const { mutate } = useSWRConfig()

  const [modelId, setModelId] = useState(selectedChatModel)

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: modelId },
    initialMessages: initialMessages as any,
    experimental_throttle: 100,
    generateId: generateUUID,

    onFinish: () => {
      mutate("/api/history")
    },

    onError: (error) => {
      toast.error("An error occured, please try again!")
    },
  })

  // Only fetch votes for authenticated users (readonly users can't vote anyway)
  const { data: votes } = useSWR<Array<Vote>>(
    !isReadonly ? `/api/vote?chatId=${id}` : null,
    fetcher,
  )

  const isBlockVisible = useBlockSelector((state) => state.isVisible)

  // Dummy attachment state for compatibility
  const [attachments, setAttachments] = useState<any[]>([])

  return (
    <>
      <div className="flex flex-col w-full max-w-[100vw] h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={modelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
          onModelSelect={setModelId}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages as any}
          setMessages={setMessages as any}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages as any}
              setMessages={setMessages as any}
              append={append}
            />
          )}
        </form>
      </div>

      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages as any}
        setMessages={setMessages as any}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  )
}
