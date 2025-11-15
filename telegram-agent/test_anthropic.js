require("dotenv").config();
const { Anthropic } = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function test() {
  try {
    console.log("Testing Anthropic Claude API...");
    
    const response = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Say 'Hello, Tennis Agent is working!' in exactly those words.",
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (textContent && textContent.text.includes("Hello, Tennis Agent is working!")) {
      console.log("✓ Anthropic API Connected!");
      console.log(`  Model: claude-opus-4-1`);
      console.log(`  Response: "${textContent.text}"`);
      console.log(`  Stop reason: ${response.stop_reason}`);
    } else {
      console.log("✓ Anthropic API Connected (different response)!");
      console.log(`  Response: "${textContent?.text}"`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`✗ Anthropic API Error: ${error.message}`);
    // Try with sonnet instead
    console.log("\nTrying with claude-3-5-sonnet...");
    
    try {
      const response2 = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Say hello.",
          },
        ],
      });
      console.log("✓ claude-3-5-sonnet works!");
      process.exit(0);
    } catch (e) {
      console.error(`✗ Also failed: ${e.message}`);
      process.exit(1);
    }
  }
}

test();
