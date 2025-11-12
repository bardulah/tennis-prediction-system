const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkResults() {
  try {
    // Check live_matches with results
    const liveResults = await pool.query(`
      SELECT COUNT(*) as count, COUNT(DISTINCT actual_winner) as unique_winners
      FROM live_matches 
      WHERE actual_winner IS NOT NULL
    `);
    console.log('Live Matches with Results:', liveResults.rows[0]);

    // Check predictions with results
    const predResults = await pool.query(`
      SELECT COUNT(*) as count, COUNT(DISTINCT actual_winner) as unique_winners
      FROM predictions 
      WHERE actual_winner IS NOT NULL
    `);
    console.log('Predictions with Results:', predResults.rows[0]);

    // Check if there's a mismatch
    const mismatch = await pool.query(`
      SELECT 
        l.match_identifier,
        l.actual_winner as live_winner,
        p.actual_winner as pred_winner,
        p.prediction_correct,
        p.predicted_winner
      FROM live_matches l
      LEFT JOIN predictions p ON p.match_id = l.match_identifier
      WHERE l.actual_winner IS NOT NULL
        AND (p.actual_winner IS NULL OR p.prediction_correct IS NULL)
      LIMIT 10
    `);
    console.log('\nSample Mismatches (results in live_matches but not synced to predictions):');
    console.log(JSON.stringify(mismatch.rows, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkResults();
