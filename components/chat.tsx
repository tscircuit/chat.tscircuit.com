"use client"

import type { Attachment, UIMessage as Message } from "ai"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useCallback, useState } from "react"
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
  initialMessages: Array<Message>
  selectedChatModel: string
  selectedVisibilityType: VisibilityType
  isReadonly: boolean
}) {
  const { mutate } = useSWRConfig()
  const [input, setInput] = useState("")

  const {
    messages,
    setMessages,
    sendMessage,
    isLoading,
    stop,
    regenerate,
  } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { id, selectedChatModel },
    }),
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate("/api/history")
    },
    onError: () => {
      toast.error("An error occured, please try again!")
    },
  })

  const handleSubmit = useCallback(
    (
      event?: { preventDefault?: () => void },
      chatRequestOptions?: any,
    ) => {
      event?.preventDefault?.()
      void sendMessage(
        { role: "user", content: input },
        chatRequestOptions,
      )
      setInput("")
    },
    [input, sendMessage],
  )

  const append = (
    message: Message | any,
    chatRequestOptions?: any,
  ) => sendMessage(message as any, chatRequestOptions)

  const reload = regenerate

  // Only fetch votes for authenticated users (readonly users can't vote anyway)
  const { data: votes } = useSWR<Array<Vote>>(
    !isReadonly ? `/api/vote?chatId=${id}` : null,
    fetcher,
  )

  const [attachments, setAttachments] = useState<Array<Attachment>>([])
  const isBlockVisible = useBlockSelector((state) => state.isVisible)

  return (
    <>
      <div className="flex flex-col w-full max-w-[100vw] h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
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
              messages={messages}
              setMessages={setMessages}
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
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  )
}
