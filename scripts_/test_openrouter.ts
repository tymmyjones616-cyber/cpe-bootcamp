import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: "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"
});

async function main() {
  console.log("Sending request to OpenRouter...");
  // Stream the response to get reasoning tokens in usage
  const stream = await openrouter.chat.send({
    model: "qwen/qwen3.6-plus:free",
    messages: [
      {
        role: "user",
        content: "How many r's are in the word 'strawberry'?"
      }
    ],
    stream: true
  });

  let response = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      response += content;
      process.stdout.write(content);
    }

    // Usage information comes in the final chunk
    if (chunk.usage) {
      // @ts-ignore - reasoningTokens might not be in the type yet
      console.log("\nReasoning tokens:", chunk.usage.reasoning_tokens || chunk.usage.reasoningTokens);
    }
  }
}

main().catch(console.error);
