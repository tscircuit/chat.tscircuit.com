"use client"

import { useCallback, useState } from "react"
import { CodeIcon, LoaderIcon, PlayIcon, PythonIcon } from "./icons"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogTrigger,
} from "@radix-ui/react-dialog"
import { TscircuitIframe } from "./TscircuitIframe"

interface CodeBlockProps {
  node: any
  inline: boolean
  className: string
  children: any
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const [output, setOutput] = useState<string | null>(null)
  const match = /language-(\w+)/.exec(className || "")
  const isTsx = match?.[1] === "tsx" || match?.[1] === "typescript"
  const codeContent = String(children).replace(/\n$/, "")
  const [tab, setTab] = useState<"code" | "run">("code")

  return (
    <div className="not-prose flex flex-col relative">
      {tab === "code" && (
        <pre
          {...props}
          className={"text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900"}
        >
          <code className="whitespace-pre-wrap wrap-break-word">{children}</code>
        </pre>
      )}

      {isTsx && (
        <div className="absolute top-2 right-3">
          <button
            type="button"
            onClick={() => setTab("run")}
            className="px-2 py-1 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
          >
            Run
          </button>
        </div>
      )}

      {tab === "run" && (
        <div className="text-sm w-full overflow-x-auto bg-zinc-800 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 border-t-0 rounded-b-xl text-zinc-50">
          <pre>{codeContent}</pre>
          <TscircuitIframe
            fsMap={{
              "board.tsx": codeContent,
              "entrypoint.tsx": ` 
              import DefaultExport, * as OtherExports from "./board.tsx";
              let Board = DefaultExport ?? OtherExports[Object.keys(OtherExports).filter(k => k[0] === k[0].toUpperCase())[0]]
              circuit.add(<Board />)
              `.trim(),
            }}
            entrypoint="entrypoint.tsx"
          />
        </div>
      )}
    </div>
  )
}
