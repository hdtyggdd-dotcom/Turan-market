import Anthropic from "@anthropic-ai/sdk";

// Bounding input and output makes a request-count budget a bounded usage budget.
export const MAX_ADVICE_INPUT_CHARS = 16_000;
export const adviceProvider = {
  async generate(prompt: string, system?: string, maxTokens = 1024) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 25_000, maxRetries: 0 });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content: prompt.slice(0, MAX_ADVICE_INPUT_CHARS) }],
    });
    return response.content.filter(block => block.type === "text").map(block => block.text).join("\n").trim();
  },
};
