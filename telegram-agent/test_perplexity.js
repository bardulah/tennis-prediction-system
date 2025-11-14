require("dotenv").config();
const axios = require("axios");

async function test() {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      console.log("⊘ Perplexity API Key not configured (optional)");
      process.exit(0);
    }

    console.log("Testing Perplexity API...");

    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar",
        messages: [
          {
            role: "user",
            content: "Who won the most recent tennis Grand Slam?",
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.data.choices && response.data.choices[0]) {
      console.log("✓ Perplexity API Connected!");
      console.log(`  Model: sonar`);
      console.log(`  Response: "${response.data.choices[0].message.content.substring(0, 150)}..."`);
      process.exit(0);
    } else {
      console.error("✗ Unexpected response format");
      process.exit(1);
    }
  } catch (error) {
    console.error(`✗ Perplexity API Error: ${error.message}`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data:`, JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

test();
