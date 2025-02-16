import { myProvider } from "@/lib/ai/models";
import {  updateDocumentPrompt } from "@/lib/ai/prompts/prompts";
import { createDocumentHandler } from "@/lib/blocks/server";
import { streamObject } from "ai";
import { z } from "zod";

/**
 * @deprecated
 */
export const sheetDocumentHandler = createDocumentHandler<"sheet">({
	kind: "sheet",
	onCreateDocument: async ({ title, dataStream }) => {
		let draftContent = "";

		const { fullStream } = streamObject({
			model: myProvider.languageModel("block-model"),
			system: "",
			prompt: title,
			schema: z.object({
				csv: z.string().describe("CSV data"),
			}),
		});

		for await (const delta of fullStream) {
			const { type } = delta;

			if (type === "object") {
				const { object } = delta;
				const { csv } = object;

				if (csv) {
					dataStream.writeData({
						type: "sheet-delta",
						content: csv,
					});

					draftContent = csv;
				}
			}
		}

		dataStream.writeData({
			type: "sheet-delta",
			content: draftContent,
		});

		return draftContent;
	},
	onUpdateDocument: async ({ document, description, dataStream }) => {
		let draftContent = "";

		const { fullStream } = streamObject({
			model: myProvider.languageModel("block-model"),
			system: updateDocumentPrompt(document.content, "sheet"),
			prompt: description,
			schema: z.object({
				csv: z.string(),
			}),
		});

		for await (const delta of fullStream) {
			const { type } = delta;

			if (type === "object") {
				const { object } = delta;
				const { csv } = object;

				if (csv) {
					dataStream.writeData({
						type: "sheet-delta",
						content: csv,
					});

					draftContent = csv;
				}
			}
		}

		return draftContent;
	},
});
