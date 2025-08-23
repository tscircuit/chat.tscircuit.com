import { z } from "zod";
import { streamObject } from "ai";
import { myProvider } from "@/lib/ai/models";
import { codePrompt, updateDocumentPrompt } from "@/lib/ai/prompts/prompts";
import { createDocumentHandler } from "@/lib/blocks/server";

export const codeDocumentHandler = createDocumentHandler<"code">({
	kind: "code",
	onCreateDocument: async ({ title, dataStream }) => {
		let draftContent = "";

		const { fullStream } = streamObject({
			model: myProvider.languageModel("block-model"),
			system: codePrompt,
			prompt: title,
			temperature: 1, // GPT-5 only supports temperature value of 1
			schema: z.object({
				code: z.string(),
			}),
		});

		for await (const delta of fullStream) {
			const { type } = delta;

			if (type === "object") {
				const { object } = delta;
				const { code } = object;

				if (code) {
					dataStream.writeData({
						type: "code-delta",
						content: code ?? "",
					});

					draftContent = code;
				}
			}
		}

		return draftContent;
	},
	onUpdateDocument: async ({ document, description, dataStream }) => {
		let draftContent = "";

		const { fullStream } = streamObject({
			model: myProvider.languageModel("block-model"),
			system: updateDocumentPrompt(document.content, "code"),
			prompt: description,
			temperature: 1, // GPT-5 only supports temperature value of 1
			schema: z.object({
				code: z.string(),
			}),
		});

		for await (const delta of fullStream) {
			const { type } = delta;

			if (type === "object") {
				const { object } = delta;
				const { code } = object;

				if (code) {
					dataStream.writeData({
						type: "code-delta",
						content: code ?? "",
					});

					draftContent = code;
				}
			}
		}

		return draftContent;
	},
});
