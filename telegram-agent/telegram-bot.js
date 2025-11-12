#!/usr/bin/env node

/**
 * Telegram Bot for Tennis Prediction Agent
 * Forwards messages to Claude agent and returns responses
 */

const TelegramBot = require("node-telegram-bot-api");
const { Anthropic } = require("@anthropic-ai/sdk");
const { spawn } = require("child_process");
const path = require("path");

// Initialize Telegram bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Initialize Anthropic SDK
const client = new Anthropic();

// Store MCP server process
let mcpServerProcess = null;

// Start MCP server
function startMCPServer() {
  return new Promise((resolve, reject) => {
    mcpServerProcess = spawn("node", [path.join(__dirname, "mcp-server.js")], {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    mcpServerProcess.stderr.on("data", (data) => {
      console.log(`[MCP Server] ${data}`);
      resolve();
    });

    setTimeout(resolve, 2000);
  });
}

// Process message with Claude Agent
async function processMessage(userId, userMessage) {
  try {
    // Send typing indicator
    await bot.sendChatAction(userId, "typing");

    // Create Claude agent with tools from MCP server
    const tools = [
      {
        name: "get_predictions",
        description:
          "Get tennis predictions from the database with optional filters. Returns predictions for today or specified date with details like players, odds, confidence, and recommended action.",
        input_schema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["bet", "monitor", "skip"],
              description: "Filter by recommended action",
            },
            min_odds: {
              type: "number",
              description: "Filter by minimum predicted odds (e.g., 1.5, 2.0)",
            },
            min_confidence: {
              type: "number",
              description: "Filter by minimum confidence score (0-100)",
            },
            date: {
              type: "string",
              description: "Date in YYYY-MM-DD format (defaults to today)",
            },
            tournament: {
              type: "string",
              description: "Filter by tournament name",
            },
            surface: {
              type: "string",
              enum: ["hard", "clay", "grass"],
              description: "Filter by court surface",
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
        name: "get_prediction_details",
        description:
          "Get detailed analysis of a specific prediction including live status, odds, and historical data.",
        input_schema: {
          type: "object",
          properties: {
            prediction_id: {
              type: "string",
              description: "The prediction ID to fetch details for",
            },
          },
          required: ["prediction_id"],
        },
      },
      {
        name: "analyze_matchup",
        description:
          "Analyze a tennis matchup using Perplexity or Gemini AI. Provides insights on player statistics, recent form, head-to-head records, and other factors.",
        input_schema: {
          type: "object",
          properties: {
            player1: {
              type: "string",
              description: "First player name",
            },
            player2: {
              type: "string",
              description: "Second player name",
            },
            llm: {
              type: "string",
              enum: ["perplexity", "gemini"],
              description: "Which LLM to use for analysis (default: perplexity)",
            },
            focus: {
              type: "string",
              description:
                "Specific aspect to analyze (e.g., 'head-to-head', 'recent-form', 'surface-preference')",
            },
          },
          required: ["player1", "player2"],
        },
      },
      {
        name: "get_tournament_stats",
        description:
          "Get statistics for a specific tournament including prediction accuracy, average confidence, and value bets.",
        input_schema: {
          type: "object",
          properties: {
            tournament: {
              type: "string",
              description: "Tournament name to get stats for",
            },
            days: {
              type: "number",
              description: "Number of days back to analyze (default: 30)",
            },
          },
          required: ["tournament"],
        },
      },
      {
        name: "get_value_bets",
        description:
          "Get all predictions identified as value bets (favorable odds relative to confidence).",
        input_schema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of value bets to return (default: 10)",
            },
            date: {
              type: "string",
              description: "Date in YYYY-MM-DD format (defaults to today)",
            },
          },
          required: [],
        },
      },
    ];

    // Agentic loop with Claude
    const messages = [
      {
        role: "user",
        content: userMessage,
      },
    ];

    let response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: `You are a helpful tennis prediction assistant that helps users query predictions and analyze matchups.
You have access to a database of tennis predictions and can use AI analysis tools.
Be conversational and natural. Format your responses for Telegram with markdown formatting where appropriate.
When showing data, present it clearly and concisely.`,
      tools: tools,
      messages: messages,
    });

    // Handle tool use in agentic loop
    while (response.stop_reason === "tool_use") {
      const toolUseBlock = response.content.find((b) => b.type === "tool_use");

      if (!toolUseBlock) break;

      console.log(`[Tool Call] ${toolUseBlock.name}`, toolUseBlock.input);

      // Execute tool
      let toolResult;
      try {
        toolResult = await executeTool(toolUseBlock.name, toolUseBlock.input);
      } catch (error) {
        toolResult = `Error executing tool: ${error.message}`;
      }

      // Add assistant response and tool result to messages
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

      // Continue conversation
      response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: `You are a helpful tennis prediction assistant that helps users query predictions and analyze matchups.
You have access to a database of tennis predictions and can use AI analysis tools.
Be conversational and natural. Format your responses for Telegram with markdown formatting where appropriate.
When showing data, present it clearly and concisely.`,
        tools: tools,
        messages: messages,
      });
    }

    // Extract final text response
    const textBlock = response.content.find((b) => b.type === "text");
    const finalResponse = textBlock?.text || "I couldn't generate a response.";

    return finalResponse;
  } catch (error) {
    console.error("Error processing message:", error);
    return `Sorry, I encountered an error: ${error.message}`;
  }
}

// Execute tool (mock implementation - would call actual MCP tools)
async function executeTool(toolName, toolInput) {
  const { Pool } = require("pg");
  const axios = require("axios");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    switch (toolName) {
      case "get_predictions": {
        let query = `
          SELECT
            p.prediction_id, p.player1, p.player2, p.tournament, p.surface,
            p.predicted_winner, p.odds_player1, p.odds_player2,
            p.confidence_score, p.recommended_action, p.prediction_day,
            p.value_bet, p.learning_phase,
            lm.live_status, lm.live_score, lm.actual_winner
          FROM predictions p
          LEFT JOIN live_matches lm ON p.match_id = lm.match_id
          WHERE p.prediction_day = COALESCE($1::date, CURRENT_DATE)
        `;

        const params = [toolInput.date || null];
        let paramCount = 1;

        if (toolInput.action) {
          paramCount++;
          query += ` AND p.recommended_action = $${paramCount}`;
          params.push(toolInput.action);
        }

        if (toolInput.min_confidence) {
          paramCount++;
          query += ` AND p.confidence_score >= $${paramCount}`;
          params.push(toolInput.min_confidence);
        }

        if (toolInput.tournament) {
          paramCount++;
          query += ` AND p.tournament ILIKE $${paramCount}`;
          params.push(`%${toolInput.tournament}%`);
        }

        if (toolInput.surface) {
          paramCount++;
          query += ` AND p.surface = $${paramCount}`;
          params.push(toolInput.surface);
        }

        const result = await pool.query(query + " ORDER BY p.confidence_score DESC LIMIT $" + (paramCount + 1), [
          ...params,
          toolInput.limit || 20,
        ]);

        let predictions = result.rows;
        if (toolInput.min_odds) {
          predictions = predictions.filter((p) => {
            const predictedOdds =
              p.predicted_winner === p.player1
                ? p.odds_player1
                : p.odds_player2;
            return predictedOdds >= toolInput.min_odds;
          });
        }

        const formatted = predictions.map((p) => {
          const predictedOdds =
            p.predicted_winner === p.player1
              ? p.odds_player1
              : p.odds_player2;
          return {
            id: p.prediction_id,
            matchup: `${p.player1} vs ${p.player2}`,
            tournament: p.tournament,
            surface: p.surface,
            prediction: `${p.predicted_winner} @ ${predictedOdds.toFixed(2)}`,
            confidence: `${p.confidence_score}%`,
            action: p.recommended_action,
            value_bet: p.value_bet ? "✓ Value Bet" : "",
            status: p.live_status || "not started",
            result: p.actual_winner ? `Winner: ${p.actual_winner}` : "",
          };
        });

        if (formatted.length === 0) {
          return "No predictions found matching your criteria.";
        }

        let output = `Found ${formatted.length} predictions:\n\n`;
        formatted.slice(0, 10).forEach((p, idx) => {
          output += `${idx + 1}. *${p.matchup}*\n`;
          output += `   ${p.tournament} • ${p.surface}\n`;
          output += `   ${p.prediction} (${p.confidence})\n`;
          output += `   Action: ${p.action}${p.value_bet ? ` • ${p.value_bet}` : ""}\n\n`;
        });

        if (formatted.length > 10) {
          output += `\n...and ${formatted.length - 10} more`;
        }

        return output;
      }

      case "analyze_matchup": {
        const llm = toolInput.llm || "perplexity";
        const query = `Analyze the tennis matchup between ${toolInput.player1} and ${toolInput.player2}${
          toolInput.focus ? `. Focus on ${toolInput.focus}` : ""
        }. Provide insights on their playing style, recent form, and prediction.`;

        if (llm === "perplexity") {
          const response = await axios.post(
            "https://api.perplexity.ai/chat/completions",
            {
              model: "pplx-70b-online",
              messages: [
                {
                  role: "user",
                  content: query,
                },
              ],
              temperature: 0.7,
              max_tokens: 1000,
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
              },
            }
          );
          return response.data.choices[0].message.content;
        } else if (llm === "gemini") {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
              contents: [
                {
                  parts: [
                    {
                      text: query,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
              },
            }
          );
          return response.data.candidates[0].content.parts[0].text;
        }
        break;
      }

      case "get_value_bets": {
        const result = await pool.query(
          `
          SELECT
            p.prediction_id, p.player1, p.player2, p.tournament,
            p.predicted_winner, p.odds_player1, p.odds_player2,
            p.confidence_score, p.learning_phase
          FROM predictions p
          WHERE p.value_bet = true
            AND p.prediction_day = COALESCE($1::date, CURRENT_DATE)
          ORDER BY p.confidence_score DESC
          LIMIT $2
        `,
          [toolInput.date || null, toolInput.limit || 10]
        );

        if (result.rows.length === 0) {
          return `No value bets found for ${toolInput.date || "today"}.`;
        }

        let output = `*Value Bets for ${toolInput.date || "Today"}*\n\n`;
        result.rows.forEach((p, idx) => {
          const predictedOdds =
            p.predicted_winner === p.player1
              ? p.odds_player1
              : p.odds_player2;
          output += `${idx + 1}. *${p.player1} vs ${p.player2}*\n`;
          output += `   ${p.tournament}\n`;
          output += `   ${p.predicted_winner} @ ${predictedOdds.toFixed(2)} (${p.confidence_score}% confidence)\n\n`;
        });

        return output;
      }

      default:
        return `Tool ${toolName} not yet implemented`;
    }
  } finally {
    await pool.end();
  }
}

// Handle incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (!userMessage) return;

  console.log(`[${chatId}] ${msg.from.first_name}: ${userMessage}`);

  const response = await processMessage(chatId, userMessage);

  // Split long messages (Telegram has a 4096 char limit)
  const maxLength = 4096;
  if (response.length > maxLength) {
    const chunks = response.match(new RegExp(`.{1,${maxLength}}`, "g")) || [];
    for (const chunk of chunks) {
      await bot.sendMessage(chatId, chunk, { parse_mode: "Markdown" });
    }
  } else {
    await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  }
});

// Handle errors
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

// Start bot
async function main() {
  console.log("Starting Telegram bot...");

  // Verify environment variables
  const required = [
    "TELEGRAM_BOT_TOKEN",
    "DATABASE_URL",
    "ANTHROPIC_API_KEY",
  ];
  const missing = required.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error("Missing environment variables:", missing.join(", "));
    process.exit(1);
  }

  console.log("✓ Bot is running and listening for messages");
  console.log(`Telegram API key: ${process.env.TELEGRAM_BOT_TOKEN.slice(0, 10)}...`);
}

main().catch(console.error);

// Handle shutdown gracefully
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  if (mcpServerProcess) {
    mcpServerProcess.kill();
  }
  process.exit(0);
});
