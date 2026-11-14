import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { Markdown } from "../components/markdown"

test("single backticks render code inline inside prose", () => {
  const html = renderToStaticMarkup(
    <Markdown>{"Connect `R1` to `GND` on this board."}</Markdown>,
  )
  expect(html).toMatch(
    /<p>Connect <code[^>]*>R1<\/code> to <code[^>]*>GND<\/code> on this board\.<\/p>/,
  )
  expect(html).not.toContain("language-tsx")
})

test("fenced blocks remain block-level code", () => {
  const html = renderToStaticMarkup(
    <Markdown>{'Example:\n\n```tsx\n<resistor name="R1" />\n```'}</Markdown>,
  )
  expect(html).toContain("language-tsx")
  expect(html).toContain("group relative")
  expect(html).not.toContain("<p>Example: <code")
})
