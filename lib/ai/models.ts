import { openai } from "@ai-sdk/openai";
import { fireworks } from "@ai-sdk/fireworks";
import {
	customProvider,
	extractReasoningMiddleware,
	wrapLanguageModel,
} from "ai";

export const DEFAULT_CHAT_MODEL: string = "tscircuit-docs";

export const myProvider = customProvider({
	languageModels: {
		"chat-model-small": openai("gpt-4o-mini"),
		"chat-model-large": openai("gpt-4o"),
		"chat-model-reasoning": wrapLanguageModel({
			model: fireworks("accounts/fireworks/models/deepseek-r1"),
			middleware: extractReasoningMiddleware({ tagName: "think" }),
		}),
		"title-model": openai("gpt-4-turbo"),
		"block-model": openai("gpt-4o-mini"),
		"tscircuit-docs": openai("gpt-4o-mini"),
	},
	imageModels: {
		// 'small-model': openai.image('dall-e-2'),
		// 'large-model': openai.image('dall-e-3'),
	},
});

interface ChatModel {
	id: string;
	name: string;
	description: string;
}

export const chatModels: Array<ChatModel> = [
	{
		id: "tscircuit-docs",
		name: "Circuit Engineer (small)",
		description: "Small-model smart assistant for questions about tscircuit",
	},
	{
		id: "tscircuit-docs-large",
		name: "Circuit Engineer (large)",
		description: "Large-model smart assistant for questions about tscircuit",
	},
];
