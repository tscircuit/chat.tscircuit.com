import { Attachment } from "ai"

/**
 * Bundle a tscircuit package together as a vercel attachment. Make sure there's
 * enough context for the AI to understand how to use the package.
 */
export const loadTscircuitPackageAsAttachment = async (
  packageName: string,
): Promise<Attachment> => {
  const packageGetResponse = await fetch(
    "https://registry-api.tscircuit.com/packages/get",
    {
      method: "POST",
      body: JSON.stringify({
        name: packageName,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  ).then((r) => r.json())

  const packageFiles = await fetch(
    "https://registry-api.tscircuit.com/package_files/list",
    {
      method: "POST",
      body: JSON.stringify({
        package_name: packageName,
        use_latest_version: true,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
    .then((r) => r.json())
    .then(
      (r) =>
        r.package_files as Array<{
          content_text: string
          file_path: string
          package_file_id: string
          package_release_id: string
        }>,
    )

  const sourceFiles = packageFiles
    .filter((fi) => !fi.file_path.includes("dist/"))
    .filter(
      (fi) => fi.file_path.endsWith(".tsx") || fi.file_path.endsWith(".ts"),
    )

  let promptSnippet = `---\nModule: "@tsci/${packageName.replace("/", ".")}"\n---\n`
  for (const file of sourceFiles) {
    promptSnippet += [
      "```tsx",
      `// ${file.file_path}`,
      file.content_text,
      "```",
    ].join("\n")
  }

  return {
    url: `data:text/plain;charset=utf-8,${encodeURIComponent(promptSnippet)}`,
    contentType: "text/plain",
    name: packageName,
  }
}
