require("dotenv").config();
const { Anthropic } = require("@anthropic-ai/sdk");

const client = new Anthropic();

async function test(model) {
  try {
    await client.messages.create({
      model: model,
      max_tokens: 10,
      messages: [{ role: "user", content: "test" }],
    });
    console.log(`✓ ${model}`);
    return true;
  } catch (e) {
    console.log(`✗ ${model}`);
    return false;
  }
}

async function main() {
  const models = [
    "claude-opus-4-1-20250805",
    "claude-sonnet-4-20250514",
    "claude-3-5-sonnet-20241022",
  ];

  for (const model of models) {
    await test(model);
  }
  process.exit(0);
}

main();
