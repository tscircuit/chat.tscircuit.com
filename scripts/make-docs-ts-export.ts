import fs from "node:fs"
import path from "node:path"

// Find the docs content file in repo root
const repoRoot = process.cwd()
const docsFiles = fs
  .readdirSync(repoRoot)
  .filter((f) => f.startsWith("docs-content-") && f.endsWith(".txt"))

if (docsFiles.length === 0) {
  console.error("No docs-content-*.txt file found in repo root")
  process.exit(1)
}

// Use the most recent docs file if multiple exist
const inputFile = docsFiles.sort().pop()!
const outputFile = "lib/ai/prompts/docs-content.generated.ts"

try {
  // Read the content of the input file as UTF-8 text
  const content = fs.readFileSync(path.join(repoRoot, inputFile), "utf8")

  // Create string that exports the file content as a default export
  const outputContent = `// @ts-nocheck\nexport default ${JSON.stringify(content)};`

  // Ensure output directory exists
  const outputDir = path.dirname(outputFile)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write the output content to the output file
  fs.writeFileSync(outputFile, outputContent)

  // Delete the input txt file
  fs.unlinkSync(path.join(repoRoot, inputFile))

  console.log(
    `Successfully converted ${inputFile} to ${outputFile} and deleted ${inputFile}`,
  )
} catch (error) {
  console.error("Error during conversion:", error)
  process.exit(1)
}
