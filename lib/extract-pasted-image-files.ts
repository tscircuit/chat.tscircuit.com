export interface ClipboardDataLike {
  items?: ArrayLike<{
    kind: string
    type: string
    getAsFile: () => File | null
  }> | null
  files?: ArrayLike<File> | null
}

export function extractPastedImageFiles(
  clipboardData: ClipboardDataLike | null | undefined,
): File[] {
  if (!clipboardData) return []

  const imageFiles: File[] = []

  if (clipboardData.items) {
    for (const item of Array.from(clipboardData.items)) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) {
          imageFiles.push(file)
        }
      }
    }
  }

  if (imageFiles.length === 0 && clipboardData.files) {
    for (const file of Array.from(clipboardData.files)) {
      if (file.type.startsWith("image/")) {
        imageFiles.push(file)
      }
    }
  }

  return imageFiles
}
