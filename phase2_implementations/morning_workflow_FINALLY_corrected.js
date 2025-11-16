// Morning Workflow Optimization - FINALY CORRECTED
// Phase 2: Add prediction filtering BEFORE expensive operations

console.log("=== MORNING WORKFLOW OPTIMIZATION (FINALLY CORRECT) ===");

// THE CORRECT OPTIMIZATION POINT:
// Add prediction existence check RIGHT AFTER "Loop Over Items"
// BEFORE "Query Player 1 Stats"

// In n8n workflow, modify the structure:
// 1. Loop Over Items
// 2. NEW: Check Prediction Exists (PostgreSQL node)
// 3. NEW: If node - skip if prediction exists
// 4. Query Player 1 Stats ← This should be skipped for existing matches
// 5. Query Player 2 Stats ← This should be skipped for existing matches
// 6. Query Player Insights ← This should be skipped for existing matches
// 7. Query Pinecone ← This should be skipped for existing matches
// 8. Build Match Context
// 9. Summarize Learning Insights (cached)
// 10. AI Prediction
// 11. Store in DB

// IMPLEMENTATION:
// 1. Add PostgreSQL node after "Loop Over Items"
//    Query: SELECT COUNT(*) FROM predictions WHERE match_id = $match_id
// 2. Add "If" node after that
//    Condition: If count = 0 (no prediction exists)
// 3. Connect "true" output to "Query Player 1 Stats"
// 4. Connect "false" output to End (skip expensive operations)

// MATCH ID CONSTRUCTION:
// Since we need match_id before Query Player 1 Stats, 
// add match_id construction to "Loop Over Items" node output

// Add to Loop Over Items JavaScript:
const matchItem = $input.item.json;

// Helper function to clean player names
function cleanPlayerName(name) {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

// Extract match_date
const matchDate = matchItem.match_date || new Date().toISOString().split('T')[0];

// Construct match_id
const matchId = `${matchItem.tournament}_${cleanPlayerName(matchItem.player1)}_${cleanPlayerName(matchItem.player2)}_${matchDate}`
  .replace(/[^a-zA-Z0-9_]/g, '_');

// Return with match_id for filtering
return {
  json: {
    // Original match data
    tournament: matchItem.tournament,
    surface: matchItem.surface,
    match_date: matchDate,
    player1: matchItem.player1,
    player2: matchItem.player2,
    player1_nationality: matchItem.nationality1 || 'Unknown',
    player2_nationality: matchItem.nationality2 || 'Unknown',
    odds1: matchItem.odds1,
    odds2: matchItem.odds2,
    
    // NEW: match_id for filtering
    match_id: matchId
  }
};

// SQL for prediction check:
/*
SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END as has_prediction,
    COUNT(*) as prediction_count
FROM predictions 
WHERE match_id = $match_id
LIMIT 1;
*/

// IF node condition:
// {{ $json.has_prediction === false }}

// This will skip Query Player 1 Stats, Query Player 2 Stats, 
// Query Player Insights, Query Pinecone for existing matches
// providing the major performance improvement!
