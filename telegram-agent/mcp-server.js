#!/usr/bin/env node

/**
 * MCP Server for Tennis Prediction Agent
 * Provides tools for database queries and LLM analysis
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} = require("@modelcontextprotocol/sdk/types.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { Pool } = require("pg");
const axios = require("axios");

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// LLM API clients
const perplexityClient = axios.create({
  baseURL: "https://api.perplexity.ai",
  headers: {
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    "Content-Type": "application/json",
  },
});

const geminiClient = axios.create({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/models",
  headers: {
    "Content-Type": "application/json",
  },
});

// Create MCP server
const server = new Server({
  name: "tennis-agent-server",
  version: "1.0.0",
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_predictions",
        description:
          "Get tennis predictions from the database with optional filters. Returns predictions for today or specified date with details like players, odds, confidence, and recommended action.",
        inputSchema: {
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
        inputSchema: {
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
        inputSchema: {
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
        inputSchema: {
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
        inputSchema: {
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
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request;

    switch (name) {
      case "get_predictions":
        return await handleGetPredictions(args);
      case "get_prediction_details":
        return await handleGetPredictionDetails(args);
      case "analyze_matchup":
        return await handleAnalyzeMatchup(args);
      case "get_tournament_stats":
        return await handleGetTournamentStats(args);
      case "get_value_bets":
        return await handleGetValueBets(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool implementations
async function handleGetPredictions(args) {
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

  const params = [args.date || null];
  let paramCount = 1;

  if (args.action) {
    paramCount++;
    query += ` AND p.recommended_action = $${paramCount}`;
    params.push(args.action);
  }

  if (args.min_confidence) {
    paramCount++;
    query += ` AND p.confidence_score >= $${paramCount}`;
    params.push(args.min_confidence);
  }

  if (args.tournament) {
    paramCount++;
    query += ` AND p.tournament ILIKE $${paramCount}`;
    params.push(`%${args.tournament}%`);
  }

  if (args.surface) {
    paramCount++;
    query += ` AND p.surface = $${paramCount}`;
    params.push(args.surface);
  }

  // Calculate odds if min_odds is specified
  let predictions = [];
  const result = await pool.query(query + " ORDER BY p.confidence_score DESC LIMIT $" + (paramCount + 1), [
    ...params,
    args.limit || 20,
  ]);

  // Filter by odds after fetching (since it's calculated)
  predictions = result.rows;
  if (args.min_odds) {
    predictions = predictions.filter((p) => {
      const predictedOdds =
        p.predicted_winner === p.player1 ? p.odds_player1 : p.odds_player2;
      return predictedOdds >= args.min_odds;
    });
  }

  const formatted = predictions.map((p) => {
    const predictedOdds =
      p.predicted_winner === p.player1 ? p.odds_player1 : p.odds_player2;
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

  return {
    content: [
      {
        type: "text",
        text: formatPredictionsTable(formatted),
      },
    ],
  };
}

async function handleGetPredictionDetails(args) {
  const result = await pool.query(
    `
    SELECT
      p.prediction_id, p.player1, p.player2, p.tournament, p.surface,
      p.predicted_winner, p.odds_player1, p.odds_player2,
      p.confidence_score, p.recommended_action, p.prediction_day,
      p.value_bet, p.learning_phase, p.prediction_correct,
      lm.live_status, lm.live_score, lm.actual_winner
    FROM predictions p
    LEFT JOIN live_matches lm ON p.match_id = lm.match_id
    WHERE p.prediction_id = $1
  `,
    [args.prediction_id]
  );

  if (result.rows.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "Prediction not found",
        },
      ],
      isError: true,
    };
  }

  const p = result.rows[0];
  const predictedOdds =
    p.predicted_winner === p.player1 ? p.odds_player1 : p.odds_player2;

  const details = `
*Prediction Details*

*Matchup:* ${p.player1} vs ${p.player2}
*Tournament:* ${p.tournament}
*Surface:* ${p.surface}

*Prediction:* ${p.predicted_winner} @ ${predictedOdds.toFixed(2)}
*Confidence:* ${p.confidence_score}%
*Action:* ${p.recommended_action}
*Value Bet:* ${p.value_bet ? "Yes ✓" : "No"}

*Status:* ${p.live_status || "Not Started"}
${p.live_score ? `*Score:* ${p.live_score}` : ""}
${p.actual_winner ? `*Winner:* ${p.actual_winner}` : ""}
${p.prediction_correct !== null ? `*Result:* ${p.prediction_correct ? "✅ Correct" : "❌ Wrong"}` : ""}

*Learning Phase:* ${p.learning_phase || "N/A"}
*Date:* ${p.prediction_day}
`;

  return {
    content: [
      {
        type: "text",
        text: details,
      },
    ],
  };
}

async function handleAnalyzeMatchup(args) {
  const llm = args.llm || "perplexity";
  const query = `Analyze the tennis matchup between ${args.player1} and ${args.player2}${
    args.focus ? `. Focus on ${args.focus}` : ""
  }. Provide insights on their playing style, recent form, head-to-head record, and prediction.`;

  try {
    let analysis = "";

    if (llm === "perplexity") {
      const response = await perplexityClient.post("/chat/completions", {
        model: "pplx-70b-online",
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      analysis = response.data.choices[0].message.content;
    } else if (llm === "gemini") {
      const response = await geminiClient.post(
        `/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
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
      analysis = response.data.candidates[0].content.parts[0].text;
    }

    return {
      content: [
        {
          type: "text",
          text: `*Analysis: ${args.player1} vs ${args.player2}* (via ${llm})\n\n${analysis}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to analyze matchup: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetTournamentStats(args) {
  const daysBack = args.days || 30;
  const result = await pool.query(
    `
    SELECT
      COUNT(*) as total_predictions,
      COUNT(CASE WHEN p.value_bet THEN 1 END) as value_bets,
      ROUND(AVG(p.confidence_score)::numeric, 2) as avg_confidence,
      ROUND(COUNT(CASE WHEN p.prediction_correct THEN 1 END)::numeric /
            NULLIF(COUNT(CASE WHEN p.prediction_correct IS NOT NULL THEN 1 END), 0) * 100, 2) as accuracy
    FROM predictions p
    WHERE p.tournament ILIKE $1
      AND p.prediction_day >= CURRENT_DATE - ($2 || ' days')::interval
  `,
    [args.tournament, daysBack]
  );

  const stats = result.rows[0];
  const summary = `
*Tournament Stats: ${args.tournament}*
*(Last ${daysBack} days)*

Total Predictions: ${stats.total_predictions}
Value Bets: ${stats.value_bets}
Avg Confidence: ${stats.avg_confidence}%
Accuracy: ${stats.accuracy || "N/A"}%
`;

  return {
    content: [
      {
        type: "text",
        text: summary,
      },
    ],
  };
}

async function handleGetValueBets(args) {
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
    [args.date || null, args.limit || 10]
  );

  const formatted = result.rows.map((p) => {
    const predictedOdds =
      p.predicted_winner === p.player1 ? p.odds_player1 : p.odds_player2;
    return {
      matchup: `${p.player1} vs ${p.player2}`,
      tournament: p.tournament,
      prediction: `${p.predicted_winner} @ ${predictedOdds.toFixed(2)}`,
      confidence: `${p.confidence_score}%`,
    };
  });

  return {
    content: [
      {
        type: "text",
        text: `*Value Bets for ${args.date || "Today"}*\n\n${formatted.map((b) => `• ${b.matchup}\n  ${b.tournament} • ${b.prediction} (${b.confidence} confidence)`).join("\n")}`,
      },
    ],
  };
}

// Helper function to format predictions as table
function formatPredictionsTable(predictions) {
  if (predictions.length === 0) {
    return "No predictions found matching your criteria.";
  }

  let output = `*Found ${predictions.length} predictions:*\n\n`;

  predictions.forEach((p, idx) => {
    output += `${idx + 1}. *${p.matchup}*\n`;
    output += `   Tournament: ${p.tournament} • Surface: ${p.surface}\n`;
    output += `   Prediction: ${p.prediction} (${p.confidence} confidence)\n`;
    output += `   Action: ${p.action}${p.value_bet ? ` • ${p.value_bet}` : ""}\n`;
    if (p.status !== "not started") {
      output += `   Status: ${p.status}${p.result ? ` • ${p.result}` : ""}\n`;
    }
    output += "\n";
  });

  return output;
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tennis Agent MCP Server running on stdio");
}

main().catch(console.error);
