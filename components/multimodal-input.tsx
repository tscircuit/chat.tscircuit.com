"use client"

import type { Attachment, ChatRequestOptions, CreateMessage, Message } from "ai"
import cx from "classnames"
import type React from "react"
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from "react"
import { toast } from "sonner"
import { useLocalStorage, useWindowSize } from "usehooks-ts"

import { sanitizeUIMessages } from "@/lib/utils"

import { ArrowUpIcon, PaperclipIcon, StopIcon } from "./icons"
import { PreviewAttachment } from "./preview-attachment"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { SuggestedActions } from "./suggested-actions"
import equal from "fast-deep-equal"
import TscircuitPackageSelector from "./tscircuit-package-selector"
import { loadTscircuitPackageAsAttachment } from "@/lib/tscircuit/load-tscircuit-package-as-attachement"
import { CheckCheckIcon, Loader2 } from "lucide-react"

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  stop: () => void
  attachments: Array<Attachment>
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>
  messages: Array<Message>
  setMessages: Dispatch<SetStateAction<Array<Message>>>
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>
  handleSubmit: (
    event?: {
      preventDefault?: () => void
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void
  className?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { width } = useWindowSize()
  const [showFileSelector, setShowFileSelector] = useState(false)
  const [fileSelectorTriggerPos, setFileSelectorTriggerPos] = useState({
    x: 0,
    y: 0,
  })
  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight()
    }
  }, [])
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`
    }
  }

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = "98px"
    }
  }

  const [localStorageInput, setLocalStorageInput] = useLocalStorage("input", "")

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || ""
      setInput(finalValue)
      adjustHeight()
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLocalStorageInput(input)
  }, [input, setLocalStorageInput])

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value
      const oldValue = input

      // Check if '@' was just typed (for mobile compatibility)
      if (newValue.length > oldValue.length && newValue.endsWith("@")) {
        setShowFileSelector(true)
      }

      const oldPackageRefs: string[] = oldValue.match(/@[\w-\/]+/g) || []
      const newPackageRefs: string[] = newValue.match(/@[\w-\/]+/g) || []

      const removedPackages = oldPackageRefs
        .filter((oldRef) => !newPackageRefs.includes(oldRef))
        .map((ref) => ref.substring(1))

      if (removedPackages.length > 0) {
        setAttachments((currentAttachments) =>
          currentAttachments.filter(
            (attachment) => !removedPackages.includes(attachment.name || ""),
          ),
        )
      }

      setInput(newValue)
      adjustHeight()
    },
    [input, setInput, setShowFileSelector, setAttachments],
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([])

  const submitForm = useCallback(() => {
    window.history.replaceState({}, "", `/chat/${chatId}`)

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    })

    setAttachments([])
    setLocalStorageInput("")
    resetHeight()

    if (width && width > 768) {
      textareaRef.current?.focus()
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ])

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const { url, pathname, contentType } = data

        return {
          url,
          name: pathname,
          contentType: contentType,
        }
      }
      const { error } = await response.json()
      toast.error(error)
    } catch (error) {
      toast.error("Failed to upload file, please try again!")
    }
  }

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])

      setUploadQueue(files.map((file) => file.name))

      try {
        const uploadPromises = files.map((file) => uploadFile(file))
        const uploadedAttachments = await Promise.all(uploadPromises)
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        )

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ])
      } catch (error) {
        console.error("Error uploading files!", error)
      } finally {
        setUploadQueue([])
      }
    },
    [setAttachments],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()

        if (isLoading) {
          toast.error("Please wait for the model to finish its response!")
        } else {
          submitForm()
        }
      } else if (event.key === "@") {
        setShowFileSelector(true)
        event.preventDefault()
      } else {
        setShowFileSelector(false)
      }
    },
    [setFileSelectorTriggerPos, setShowFileSelector, submitForm],
  )
  const handleFileSelect = useCallback(
    async (packageName: string) => {
      if (!textareaRef.current) return

      if (attachments.find((a) => a.name === packageName)) {
        setShowFileSelector(false)
        setTimeout(() => {
          textareaRef.current?.focus()
        }, 0)
        return
      }

      const cursorPos = textareaRef.current.selectionStart
      const textBefore = input.substring(0, cursorPos)
      const textAfter = input.substring(cursorPos)

      // Show loading toast
      const toastId = toast.loading(`Adding "${packageName}" to your chat`, {
        icon: <Loader2 className="w-5 h-5 text-black" />,
      })

      try {
        // Insert @packageName at cursor position
        const cursorPos = textareaRef.current.selectionStart || 0
        const textBefore = input.slice(0, cursorPos)
        const textAfter = input.slice(cursorPos)
        const newText = textBefore + `@${packageName}` + textAfter

        setInput(newText)

        // Update cursor position after insertion
        setTimeout(() => {
          const newCursorPos = cursorPos + `@${packageName}`.length
          if (textareaRef.current) {
            textareaRef.current.selectionStart = newCursorPos
            textareaRef.current.selectionEnd = newCursorPos
          }
        }, 0)

        // Load package as attachment
        const attachment = await loadTscircuitPackageAsAttachment(packageName)
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          attachment,
        ])

        // Success toast
        toast.success("Package loaded successfully!", {
          id: toastId,
          icon: <CheckCheckIcon className="w-5 h-5 text-black" />,
        })
      } catch (error) {
        // Error toast
        toast.error("Failed to load package", {
          id: toastId,
          description:
            error instanceof Error ? error.message : "Please try again",
        })
        console.error("Error loading TSCircuit package:", error)
      }

      setShowFileSelector(false)
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    },
    [attachments, setAttachments, input],
  )

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions append={append} chatId={chatId} />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll items-end no-scrollbar">
          {attachments.map((attachment) => {
            // Check if this package is referenced in the text with @
            const isReferenced =
              attachment.name && input.includes(`@${attachment.name}`)
            return (
              <div key={attachment.url} className="relative group">
                <PreviewAttachment attachment={attachment} />
                {isReferenced && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-primary-foreground font-bold">
                      @
                    </span>
                  </div>
                )}
                {/* Remove button for packages */}
                {attachment.contentType === "text/plain" && (
                  <button
                    onClick={() => {
                      // Remove from attachments
                      setAttachments((currentAttachments) =>
                        currentAttachments.filter(
                          (a) => a.url !== attachment.url,
                        ),
                      )
                      // Remove @packagename from input text
                      if (attachment.name) {
                        const newInput = input.replace(
                          new RegExp(`@${attachment.name}`, "g"),
                          "",
                        )
                        setInput(newInput)
                      }
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                  >
                    <span className="text-xs">×</span>
                  </button>
                )}
              </div>
            )
          })}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: "",
                name: filename,
                contentType: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder="Send a message..."
        name="input"
        value={input}
        onChange={handleInput}
        className={cx(
          "min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl text-base! bg-muted pb-10 dark:border-zinc-700",
          className,
        )}
        rows={2}
        autoComplete="off"
        autoFocus
        onKeyDown={handleKeyDown}
      />

      <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
        <AttachmentsButton fileInputRef={fileInputRef} isLoading={isLoading} />
      </div>

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {isLoading ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
          />
        )}
      </div>
      <TscircuitPackageSelector
        isOpen={showFileSelector}
        onClose={({ refocusInput }) => {
          setShowFileSelector(false)
          if (refocusInput) {
            textareaRef.current?.focus()
          }
        }}
        onSelect={handleFileSelect}
        triggerPos={fileSelectorTriggerPos}
      />
    </div>
  )
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false
    if (prevProps.isLoading !== nextProps.isLoading) return false
    if (!equal(prevProps.attachments, nextProps.attachments)) return false

    return true
  },
)

function PureAttachmentsButton({
  fileInputRef,
  isLoading,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>
  isLoading: boolean
}) {
  return (
    <Button
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 dark:hover:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault()
        fileInputRef.current?.click()
      }}
      disabled={isLoading}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  )
}

const AttachmentsButton = memo(PureAttachmentsButton)

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void
  setMessages: Dispatch<SetStateAction<Array<Message>>>
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault()
        stop()
        setMessages((messages) => sanitizeUIMessages(messages))
      }}
    >
      <StopIcon size={14} />
    </Button>
  )
}

const StopButton = memo(PureStopButton)

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void
  input: string
  uploadQueue: Array<string>
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault()
        submitForm()
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  )
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false
  if (prevProps.input !== nextProps.input) return false
  return true
})
