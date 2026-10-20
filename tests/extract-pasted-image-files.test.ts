import { expect, test } from "bun:test"
import { extractPastedImageFiles } from "../lib/extract-pasted-image-files"

test("extractPastedImageFiles extracts image files from clipboard items", () => {
  const pngFile = new File(["png-data"], "screenshot.png", {
    type: "image/png",
  })
  const textFile = new File(["hello"], "notes.txt", {
    type: "text/plain",
  })

  const result = extractPastedImageFiles({
    items: [
      {
        kind: "string",
        type: "text/plain",
        getAsFile: () => null,
      },
      {
        kind: "file",
        type: "image/png",
        getAsFile: () => pngFile,
      },
      {
        kind: "file",
        type: "text/plain",
        getAsFile: () => textFile,
      },
    ],
  })

  expect(result).toEqual([pngFile])
})

test("extractPastedImageFiles falls back to clipboard files list when items are unavailable", () => {
  const jpegFile = new File(["jpg-data"], "photo.jpg", {
    type: "image/jpeg",
  })
  const pdfFile = new File(["pdf-data"], "doc.pdf", {
    type: "application/pdf",
  })

  const result = extractPastedImageFiles({
    files: [jpegFile, pdfFile],
  })

  expect(result).toEqual([jpegFile])
})

test("extractPastedImageFiles returns empty array for plain text paste", () => {
  expect(extractPastedImageFiles(null)).toEqual([])
  expect(
    extractPastedImageFiles({
      items: [
        {
          kind: "string",
          type: "text/plain",
          getAsFile: () => null,
        },
      ],
    }),
  ).toEqual([])
})
