require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const result = await pool.query("SELECT COUNT(*) as count FROM predictions");
    console.log(`✓ Database Connected!`);
    console.log(`  Total predictions: ${result.rows[0].count}`);
    
    const todayPredictions = await pool.query(
      "SELECT COUNT(*) as count FROM predictions WHERE prediction_day = CURRENT_DATE"
    );
    console.log(`  Today's predictions: ${todayPredictions.rows[0].count}`);
    
    const liveMatches = await pool.query(
      "SELECT COUNT(*) as count FROM live_matches"
    );
    console.log(`  Live matches in DB: ${liveMatches.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error(`✗ Database Error: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

test();
