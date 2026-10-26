// https://docs.tscircuit.com/guides/running-tscircuit-inside-an-iframe
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"

export interface TscircuitIframeProps {
  fsMap: Record<string, string>
  entrypoint: string
  mainComponentPath?: string
  code?: string
  onReportIssue?: (issueUrl: string) => void
}

export function getPrimaryCircuitCode(props: TscircuitIframeProps): string {
  if (typeof props.code === "string" && props.code.trim().length > 0) {
    return props.code
  }
  const mainPath = props.mainComponentPath ?? "board.tsx"
  if (typeof props.fsMap?.[mainPath] === "string") {
    return props.fsMap[mainPath]
  }
  if (typeof props.fsMap?.[props.entrypoint] === "string") {
    return props.fsMap[props.entrypoint]
  }
  const firstEntry = Object.values(props.fsMap ?? {})[0]
  return typeof firstEntry === "string" ? firstEntry : ""
}

export function buildReportIssueUrl({
  title,
  errorMessage,
  code,
}: {
  title?: string
  errorMessage?: string | null
  code?: string
}): string {
  const cleanError = (errorMessage ?? "").trim()
  const resolvedTitle = (
    title?.trim() || (cleanError ? `Error: ${cleanError}` : "Issue Report")
  )
    .replace(/[^a-zA-Z0-9 :_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100)

  const sections: string[] = []
  const trimmedCode = (code ?? "").trim()
  if (trimmedCode) {
    const editorUrl = `https://tscircuit.com/editor?code=${encodeURIComponent(trimmedCode)}`
    sections.push(`[Package code to reproduce](${editorUrl})`)
    sections.push(`### Circuit Code\n\`\`\`tsx\n${trimmedCode}\n\`\`\``)
  }

  if (cleanError) {
    const truncatedError =
      cleanError.length > 2000 ? `${cleanError.slice(0, 2000)}...` : cleanError
    sections.push(`### Error\n\`\`\`\n${truncatedError}\n\`\`\``)
  }

  const body = sections.join("\n\n") || "Issue reported from chat.tscircuit.com"
  return `https://github.com/tscircuit/tscircuit.com/issues/new?title=${encodeURIComponent(
    resolvedTitle,
  )}&body=${encodeURIComponent(body)}`
}

export function extractRunframeError(data: unknown): {
  errorMessage: string | null
  shouldOpenReport: boolean
  title?: string
} {
  if (!data || typeof data !== "object") {
    return { errorMessage: null, shouldOpenReport: false }
  }
  const payload = data as {
    type?: string
    runframe_type?: string
    error_message?: string
    title?: string
    runframe_event?: {
      type?: string
      error_message?: string
      title?: string
    }
  }

  const evt = payload.runframe_event ?? payload
  const evtType = evt.type ?? payload.runframe_type

  if (evtType === "error" && typeof evt.error_message === "string") {
    const trimmed = evt.error_message.trim()
    return {
      errorMessage: trimmed.length > 0 ? trimmed : null,
      shouldOpenReport: false,
    }
  }

  if (evtType === "report_issue" || evtType === "open_issue") {
    const trimmed =
      typeof evt.error_message === "string" ? evt.error_message.trim() : null
    return {
      errorMessage: trimmed && trimmed.length > 0 ? trimmed : null,
      shouldOpenReport: true,
      title: typeof evt.title === "string" ? evt.title : undefined,
    }
  }

  return { errorMessage: null, shouldOpenReport: false }
}

export const TscircuitIframe = (runFrameProps: TscircuitIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [iframeHeight, setIframeHeight] = useState(600) // Default height for SSR
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const primaryCode = getPrimaryCircuitCode(runFrameProps)
  const effectiveMainComponentPath =
    runFrameProps.mainComponentPath ??
    ("board.tsx" in (runFrameProps.fsMap ?? {}) ? "board.tsx" : undefined)

  const handleReportIssue = (overrideError?: string | null, title?: string) => {
    const url = buildReportIssueUrl({
      title,
      errorMessage: overrideError ?? errorMessage,
      code: primaryCode,
    })
    runFrameProps.onReportIssue?.(url)
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.runframe_type === "runframe_ready_to_receive") {
        setIsReady(true)
        iframeRef.current?.contentWindow?.postMessage(
          {
            runframe_type: "runframe_props_changed",
            runframe_props: {
              ...runFrameProps,
              mainComponentPath: effectiveMainComponentPath,
              code: primaryCode,
            },
          },
          "*",
        )
      }

      const extracted = extractRunframeError(event.data)
      if (extracted.errorMessage) {
        setErrorMessage(extracted.errorMessage)
      }
      if (extracted.shouldOpenReport) {
        handleReportIssue(extracted.errorMessage, extracted.title)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [runFrameProps, effectiveMainComponentPath, primaryCode, errorMessage])

  useEffect(() => {
    setErrorMessage(null)
    if (!iframeRef.current) return
    if (!isReady) return
    if (iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          runframe_type: "runframe_props_changed",
          runframe_props: {
            ...runFrameProps,
            mainComponentPath: effectiveMainComponentPath,
            code: primaryCode,
          },
        },
        "*",
      )
    }
  }, [runFrameProps.fsMap, runFrameProps.entrypoint, isReady])

  // Set iframe height after component mounts to avoid SSR issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIframeHeight(Math.min(600, window.innerHeight - 50))
    }
  }, [])

  return (
    <div>
      {errorMessage && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900">
          <span className="text-xs font-mono text-red-700 dark:text-red-300 truncate">
            {errorMessage}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleReportIssue(errorMessage)}
            className="h-7 px-2.5 text-xs gap-1.5 shrink-0"
          >
            <GitHubLogoIcon className="size-3.5" />
            Report Issue
          </Button>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="https://runframe.tscircuit.com/iframe.html"
        title="tscircuit code runner and preview"
        frameBorder="0"
        scrolling="no"
        style={{
          overflow: "hidden",
          width: "100%",
          height: iframeHeight,
          border: "none",
          padding: 0,
          margin: 0,
          boxSizing: "border-box",
        }}
      />
    </div>
  )
}
