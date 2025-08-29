import type { Attachment } from "ai"

import { LoaderIcon } from "./icons"

const TscircuitPackageImage = ({ name }: { name: string }) => {
  const url = `https://registry-api.tscircuit.com/snippets/images/${name}/pcb.svg`
  return (
    <div className="size-full rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/30 flex items-center justify-center">
      <img
        src={url}
        alt={name}
        className="object-contain scale-[3.5] rotate-45 transition-transform duration-300 hover:scale-[4] hover:rotate-[50deg]"
      />
    </div>
  )
}

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment
  isUploading?: boolean
}) => {
  const { name, url, contentType } = attachment

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey && name) {
      e.preventDefault()
      const packageUrl = `https://tscircuit.com/${name}`
      window.open(packageUrl, "_blank")
    }
  }

  return (
    <div
      className="group flex flex-col gap-3 transition-all duration-200 cursor-pointer"
      onClick={handleClick}
      title={name ? `Ctrl+click to open ${name} on tscircuit.com` : undefined}
    >
      <div className="relative w-32 h-20 sm:w-36 sm:h-24 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-muted/20" />

        {contentType ? (
          contentType.startsWith("image") ? (
            <img
              key={url}
              src={url}
              alt={name ?? "An image attachment"}
              className="relative z-10 size-full object-cover rounded-xl transition-all duration-300 group-hover:brightness-110"
            />
          ) : contentType === "text/plain" ? (
            <div className="relative z-10 size-full">
              <TscircuitPackageImage key={name} name={name!} />
            </div>
          ) : (
            <div className="relative z-10 size-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          )
        ) : (
          <div className="relative z-10 size-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
            <div className="animate-spin text-primary">
              <LoaderIcon />
            </div>
          </div>
        )}

        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-border/20 pointer-events-none" />
      </div>

      <div className="px-1">
        <div className="text-xs font-medium text-foreground/80 max-w-32 sm:max-w-36 truncate group-hover:text-foreground transition-colors duration-200">
          {name}
        </div>
      </div>
    </div>
  )
}
