import { PreviewMessage } from "./message"
import { useScrollToBottom } from "./use-scroll-to-bottom"
import { Vote } from "@/lib/db/schema"
import { ChatRequestOptions, Message } from "ai"
import { memo } from "react"
import equal from "fast-deep-equal"
import { UIBlock } from "./block"

interface BlockMessagesProps {
  chatId: string
  isLoading: boolean
  votes: Array<Vote> | undefined
  messages: Array<Message>
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>
  isReadonly: boolean
  blockStatus: UIBlock["status"]
}

function PureBlockMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: BlockMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>()

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-2 h-full w-full items-stretch subtle-scrollbar overflow-y-auto overflow-x-hidden px-2 sm:px-3 pt-2 pb-2 text-sm"
      style={{
        height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-base font-medium mb-2">
              Start a conversation
            </div>
            <div className="text-xs">
              Ask questions or describe what you'd like to build
            </div>
          </div>
        </div>
      )}

      {messages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          isLoading={isLoading && index === messages.length - 1}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  )
}

function areEqual(
  prevProps: BlockMessagesProps,
  nextProps: BlockMessagesProps,
) {
  if (
    prevProps.blockStatus === "streaming" &&
    nextProps.blockStatus === "streaming"
  )
    return true

  if (prevProps.isLoading !== nextProps.isLoading) return false
  if (prevProps.isLoading && nextProps.isLoading) return false
  if (prevProps.messages.length !== nextProps.messages.length) return false
  if (!equal(prevProps.votes, nextProps.votes)) return false

  return true
}

export const BlockMessages = memo(PureBlockMessages, areEqual)
