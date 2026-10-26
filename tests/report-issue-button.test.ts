import { describe, expect, test } from "bun:test"
import {
  buildReportIssueUrl,
  extractRunframeError,
  getPrimaryCircuitCode,
} from "../components/TscircuitIframe"

describe("Report Issue button support in TscircuitIframe", () => {
  test("getPrimaryCircuitCode returns board.tsx content rather than entrypoint wrapper", () => {
    const code = getPrimaryCircuitCode({
      fsMap: {
        "board.tsx":
          "export default () => <board width='10mm' height='10mm' />",
        "entrypoint.tsx":
          'import Board from "./board.tsx"\ncircuit.add(<Board />)',
      },
      entrypoint: "entrypoint.tsx",
    })
    expect(code).toBe(
      "export default () => <board width='10mm' height='10mm' />",
    )
  })

  test("buildReportIssueUrl includes error details and circuit code link", () => {
    const url = buildReportIssueUrl({
      errorMessage:
        'Invalid footprint function, got "smd", from string "smd-diode"',
      code: '<diode name="D1" footprint="smd-diode" />',
    })
    const parsed = new URL(url)
    expect(parsed.origin).toBe("https://github.com")
    expect(parsed.pathname).toBe("/tscircuit/tscircuit.com/issues/new")
    expect(parsed.searchParams.get("title")).toContain(
      "Invalid footprint function",
    )
    const body = parsed.searchParams.get("body") ?? ""
    expect(body).toContain("Package code to reproduce")
    expect(body).toContain("smd-diode")
  })

  test("extractRunframeError handles error and report_issue events from runframe", () => {
    const errRes = extractRunframeError({
      type: "runframe_event",
      runframe_event: {
        type: "error",
        error_message: "Invalid footprint",
      },
    })
    expect(errRes).toEqual({
      errorMessage: "Invalid footprint",
      shouldOpenReport: false,
    })

    const reportRes = extractRunframeError({
      type: "runframe_event",
      runframe_event: {
        type: "report_issue",
        error_message: "Invalid footprint",
        title: "Error Circuit JSON",
      },
    })
    expect(reportRes).toEqual({
      errorMessage: "Invalid footprint",
      shouldOpenReport: true,
      title: "Error Circuit JSON",
    })
  })
})
