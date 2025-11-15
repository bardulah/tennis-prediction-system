require("dotenv").config();
const { Anthropic } = require("@anthropic-ai/sdk");
const { Pool } = require("pg");

const client = new Anthropic();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tool definitions (same as in bot)
const TOOLS = [
  {
    name: "get_predictions",
    description:
      "Get tennis predictions from the database with optional filters.",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["bet", "monitor", "skip"],
          description: "Filter by recommended action",
        },
        min_confidence: {
          type: "number",
          description: "Filter by minimum confidence score (0-100)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_value_bets",
    description: "Get all predictions identified as value bets.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of value bets to return (default: 10)",
        },
      },
      required: [],
    },
  },
];

async function executeTool(toolName, toolInput) {
  try {
    switch (toolName) {
      case "get_predictions": {
        const result = await pool.query(
          `SELECT
            p.prediction_id, p.player1, p.player2, p.tournament,
            p.predicted_winner, p.odds_player1, p.odds_player2,
            p.confidence_score, p.recommended_action
          FROM predictions p
          WHERE p.prediction_day = CURRENT_DATE
          ORDER BY p.confidence_score DESC
          LIMIT $1`,
          [toolInput.limit || 20]
        );

        let predictions = result.rows;
        if (toolInput.min_confidence) {
          predictions = predictions.filter(
            (p) => p.confidence_score >= toolInput.min_confidence
          );
        }

        const formatted = predictions.map((p) => {
          const predictedOdds =
            p.predicted_winner === p.player1
              ? parseFloat(p.odds_player1)
              : parseFloat(p.odds_player2);
          return `${p.player1} vs ${p.player2} - ${p.predicted_winner} @ ${predictedOdds.toFixed(2)} (${p.confidence_score}% confidence)`;
        });

        if (formatted.length === 0) {
          return "No predictions found matching your criteria.";
        }

        return `Found ${formatted.length} predictions:\n${formatted.slice(0, 10).join("\n")}${
          formatted.length > 10 ? `\n...and ${formatted.length - 10} more` : ""
        }`;
      }

      case "get_value_bets": {
        const result = await pool.query(
          `SELECT
            p.player1, p.player2, p.tournament,
            p.predicted_winner, p.odds_player1, p.odds_player2,
            p.confidence_score
          FROM predictions p
          WHERE p.value_bet = true
            AND p.prediction_day = CURRENT_DATE
          ORDER BY p.confidence_score DESC
          LIMIT $1`,
          [toolInput.limit || 10]
        );

        if (result.rows.length === 0) {
          return "No value bets found for today.";
        }

        const formatted = result.rows.map((p) => {
          const predictedOdds =
            p.predicted_winner === p.player1
              ? parseFloat(p.odds_player1)
              : parseFloat(p.odds_player2);
          return `${p.player1} vs ${p.player2} - ${p.predicted_winner} @ ${predictedOdds.toFixed(2)} (${p.confidence_score}%)`;
        });

        return `Value Bets for Today:\n${formatted.join("\n")}`;
      }

      default:
        return `Tool ${toolName} not implemented`;
    }
  } finally {
    // Don't close pool yet
  }
}

async function testAgentWorkflow() {
  console.log("Testing Agent Workflow...\n");

  const testQueries = [
    "Show me today's predictions",
    "What are the best value bets?",
    "Get predictions with at least 80% confidence",
  ];

  for (const query of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Query: "${query}"`);
    console.log(`${'='.repeat(60)}`);

    const messages = [
      {
        role: "user",
        content: query,
      },
    ];

    let response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `You are a helpful tennis prediction assistant. You have access to tools to query prediction data.`,
      tools: TOOLS,
      messages: messages,
    });

    console.log(`\n[Claude Response] Stop Reason: ${response.stop_reason}`);

    let iterationCount = 0;
    while (response.stop_reason === "tool_use" && iterationCount < 5) {
      iterationCount++;
      const toolUseBlock = response.content.find((b) => b.type === "tool_use");

      if (!toolUseBlock) break;

      console.log(`\n[Tool Call] ${toolUseBlock.name}`);
      console.log(`[Tool Input]`, JSON.stringify(toolUseBlock.input, null, 2));

      let toolResult;
      try {
        toolResult = await executeTool(toolUseBlock.name, toolUseBlock.input);
      } catch (error) {
        toolResult = `Error: ${error.message}`;
      }

      console.log(`[Tool Result] ${toolResult.substring(0, 200)}...`);

      messages.push({
        role: "assistant",
        content: response.content,
      });

      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          },
        ],
      });

      response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are a helpful tennis prediction assistant. You have access to tools to query prediction data.`,
        tools: TOOLS,
        messages: messages,
      });

      console.log(`[Claude Response] Stop Reason: ${response.stop_reason}`);
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const finalResponse = textBlock?.text || "No response generated";

    console.log(`\n[Final Response]`);
    console.log(finalResponse);
  }

  await pool.end();
  console.log("\n✓ Agent workflow test complete");
  process.exit(0);
}

testAgentWorkflow().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
