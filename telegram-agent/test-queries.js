#!/usr/bin/env node

/**
 * Test script for Telegram agent tools
 * Run this to test database queries without the bot
 */

const { Pool } = require("pg");
const axios = require("axios");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testGetPredictions() {
  console.log("\n=== Testing get_predictions ===");

  const result = await pool.query(`
    SELECT
      p.prediction_id, p.player1, p.player2, p.tournament, p.surface,
      p.predicted_winner, p.odds_player1, p.odds_player2,
      p.confidence_score, p.recommended_action, p.prediction_day,
      p.value_bet
    FROM predictions p
    WHERE p.prediction_day = CURRENT_DATE
    AND p.recommended_action = 'bet'
    ORDER BY p.confidence_score DESC
    LIMIT 5
  `);

  console.log(`Found ${result.rows.length} 'bet' predictions for today:`);
  result.rows.forEach((p, idx) => {
    const predictedOdds =
      p.predicted_winner === p.player1 ? p.odds_player1 : p.odds_player2;
    console.log(
      `${idx + 1}. ${p.player1} vs ${p.player2} - ${p.predicted_winner} @ ${predictedOdds.toFixed(2)} (${p.confidence_score}%)`
    );
  });

  return result.rows.length > 0;
}

async function testValueBets() {
  console.log("\n=== Testing get_value_bets ===");

  const result = await pool.query(`
    SELECT
      p.prediction_id, p.player1, p.player2, p.tournament,
      p.predicted_winner, p.odds_player1, p.odds_player2,
      p.confidence_score
    FROM predictions p
    WHERE p.value_bet = true
    AND p.prediction_day = CURRENT_DATE
    LIMIT 5
  `);

  console.log(`Found ${result.rows.length} value bets for today:`);
  result.rows.forEach((p, idx) => {
    const predictedOdds =
      p.predicted_winner === p.player1 ? p.odds_player1 : p.odds_player2;
    console.log(
      `${idx + 1}. ${p.player1} vs ${p.player2} - ${p.predicted_winner} @ ${predictedOdds.toFixed(2)} (${p.confidence_score}%)`
    );
  });

  return result.rows.length > 0;
}

async function testTournamentStats() {
  console.log("\n=== Testing get_tournament_stats ===");

  const result = await pool.query(`
    SELECT DISTINCT tournament
    FROM predictions
    WHERE prediction_day >= CURRENT_DATE - interval '30 days'
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    console.log("No tournaments found in last 30 days");
    return false;
  }

  const tournament = result.rows[0].tournament;

  const statsResult = await pool.query(
    `
    SELECT
      COUNT(*) as total_predictions,
      COUNT(CASE WHEN p.value_bet THEN 1 END) as value_bets,
      ROUND(AVG(p.confidence_score)::numeric, 2) as avg_confidence,
      ROUND(COUNT(CASE WHEN p.prediction_correct THEN 1 END)::numeric /
            NULLIF(COUNT(CASE WHEN p.prediction_correct IS NOT NULL THEN 1 END), 0) * 100, 2) as accuracy
    FROM predictions p
    WHERE p.tournament ILIKE $1
      AND p.prediction_day >= CURRENT_DATE - interval '30 days'
  `,
    [tournament]
  );

  const stats = statsResult.rows[0];
  console.log(`\nStats for ${tournament} (last 30 days):`);
  console.log(`  Total Predictions: ${stats.total_predictions}`);
  console.log(`  Value Bets: ${stats.value_bets}`);
  console.log(`  Avg Confidence: ${stats.avg_confidence}%`);
  console.log(`  Accuracy: ${stats.accuracy || "N/A"}%`);

  return true;
}

async function testLiveMatches() {
  console.log("\n=== Testing live match data ===");

  const result = await pool.query(`
    SELECT
      p.player1, p.player2, p.tournament,
      lm.live_status, lm.live_score, lm.actual_winner
    FROM predictions p
    LEFT JOIN live_matches lm ON p.match_id = lm.match_id
    WHERE p.prediction_day = CURRENT_DATE
    AND lm.live_status IS NOT NULL
    LIMIT 5
  `);

  console.log(`Found ${result.rows.length} matches with live data:`);
  result.rows.forEach((p, idx) => {
    console.log(
      `${idx + 1}. ${p.player1} vs ${p.player2} - ${p.live_status}${
        p.live_score ? ` (${p.live_score})` : ""
      }${p.actual_winner ? ` - Winner: ${p.actual_winner}` : ""}`
    );
  });

  return result.rows.length > 0;
}

async function testPerplexity() {
  console.log("\n=== Testing Perplexity API ===");

  if (!process.env.PERPLEXITY_API_KEY) {
    console.log("⚠️  PERPLEXITY_API_KEY not set, skipping");
    return false;
  }

  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "pplx-70b-online",
        messages: [
          {
            role: "user",
            content: "Who won the last Djokovic vs Alcaraz tennis match?",
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        },
      }
    );

    console.log("✓ Perplexity API working");
    console.log(`Response: ${response.data.choices[0].message.content.substring(0, 200)}...`);
    return true;
  } catch (error) {
    console.error("✗ Perplexity API error:", error.message);
    return false;
  }
}

async function testGemini() {
  console.log("\n=== Testing Gemini API ===");

  if (!process.env.GOOGLE_API_KEY) {
    console.log("⚠️  GOOGLE_API_KEY not set, skipping");
    return false;
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Who won the last Djokovic vs Alcaraz tennis match?",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }
    );

    console.log("✓ Gemini API working");
    console.log(`Response: ${response.data.candidates[0].content.parts[0].text.substring(0, 200)}...`);
    return true;
  } catch (error) {
    console.error("✗ Gemini API error:", error.message);
    return false;
  }
}

async function main() {
  console.log("🧪 Tennis Telegram Agent - Test Suite");
  console.log("=====================================\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  console.log(`📦 Testing with database: ${process.env.DATABASE_URL.split("@")[1]}`);

  try {
    // Test database connection
    const conn = await pool.connect();
    console.log("✓ Database connected");
    conn.release();

    // Run tests
    const results = {
      "Get Predictions": await testGetPredictions(),
      "Get Value Bets": await testValueBets(),
      "Tournament Stats": await testTournamentStats(),
      "Live Matches": await testLiveMatches(),
      "Perplexity API": await testPerplexity(),
      "Gemini API": await testGemini(),
    };

    // Summary
    console.log("\n\n=== Test Summary ===");
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? "✓" : "✗"} ${test}`);
    });

    console.log(`\n${passed}/${total} tests passed`);

    if (passed >= 4) {
      console.log("\n✨ System ready for Telegram bot deployment!");
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
