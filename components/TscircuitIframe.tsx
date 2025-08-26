// https://docs.tscircuit.com/guides/running-tscircuit-inside-an-iframe
import { useEffect, useRef, useState } from "react"

export interface TscircuitIframeProps {
  fsMap: Record<string, string>
  entrypoint: string
}

export const TscircuitIframe = (runFrameProps: TscircuitIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [iframeHeight, setIframeHeight] = useState(600) // Default height for SSR

  console.log(runFrameProps)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.runframe_type === "runframe_ready_to_receive") {
        setIsReady(true)
        iframeRef.current?.contentWindow?.postMessage(
          {
            runframe_type: "runframe_props_changed",
            runframe_props: runFrameProps,
          },
          "*",
        )
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  useEffect(() => {
    if (!iframeRef.current) return
    if (!isReady) return
    if (iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          runframe_type: "runframe_props_changed",
          runframe_props: runFrameProps,
        },
        "*",
      )
    }
  }, [runFrameProps])

  // Set iframe height after component mounts to avoid SSR issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIframeHeight(Math.min(600, window.innerHeight - 50))
    }
  }, [])

  return (
    <div>
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
