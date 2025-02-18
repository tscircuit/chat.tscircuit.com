import type { Attachment } from "ai"

import { LoaderIcon } from "./icons"

const TscircuitPackageImage = ({ name }: { name: string }) => {
  const url = `https://registry-api.tscircuit.com/snippets/images/${name}/pcb.svg`
  return (
    <div className="size-full rounded-md overflow-hidden">
      <img
        src={url}
        alt={name}
        className="object-contain scale-[4] rotate-45"
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

  return (
    <div className="flex flex-col gap-2">
      <div className="w-32 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
        {contentType ? (
          contentType.startsWith("image") ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? "An image attachment"}
              className="rounded-md size-full object-cover"
            />
          ) : contentType === "text/plain" ? (
            <TscircuitPackageImage key={name} name={name!} />
          ) : (
            <div className="" />
          )
        ) : (
          <div className="" />
        )}

        {isUploading && (
          <div className="animate-spin absolute text-zinc-500">
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-32 truncate">{name}</div>
    </div>
  )
}
