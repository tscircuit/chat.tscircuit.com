import { describe, expect, test } from "bun:test"
import {
  codePrompt,
  systemPrompt,
  updateDocumentPrompt,
} from "../lib/ai/prompts/prompts"

describe("AI footprint guidance", () => {
  test("removes the known erroneous diode footprint default from embedded documentation", () => {
    const prompt = systemPrompt({
      selectedChatModel: "circuit-engineer-small",
      textAttachmentStrings: [],
    })
    expect(prompt).not.toContain('default footprint "smd-diode"')
    expect(prompt).toContain('explicitly uses the "0402" footprint')
    expect(prompt).toContain('"smd-diode" is not a valid default')
  })

  test("asks for physical package, valid footprinter string, and pin mapping", () => {
    expect(codePrompt).toContain('"sod123"')
    expect(codePrompt).toContain('"sod323"')
    expect(codePrompt).toContain(
      "Do not infer footprint IDs from human descriptions",
    )
    expect(codePrompt).toContain("Verify pad count, dimensions and pin mapping")
  })

  test("code updates use the same footprint instructions as initial code creation", () => {
    const current = 'export default () => <diode name="D1" footprint="0402" />'
    const text = updateDocumentPrompt(current, "code")
    expect(text).toContain(codePrompt)
    expect(text).toContain(current)
    expect(text).toContain("D_SOD-123")
  })

  test("text-only document updates do not embed code instructions", () => {
    expect(updateDocumentPrompt("some text", "text")).not.toContain(codePrompt)
  })
})
