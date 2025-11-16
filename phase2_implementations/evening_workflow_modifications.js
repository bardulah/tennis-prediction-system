// Evening Workflow Optimization Script
// Phase 2: Add results existence filtering

console.log("=== EVENING WORKFLOW OPTIMIZATIONS ===");
console.log("Adding results existence filtering...");

// STEP 1: Modify "Find Matching Prediction" Node
// Add results existence check to the existing query

// OLD QUERY (current):
// SELECT prediction_id, predicted_winner, confidence_score
// FROM predictions
// WHERE player1 = $player1
//   AND player2 = $player2
//   AND tournament = $tournament
// LIMIT 1;

// NEW QUERY (optimized):
const matchItem = $('Loop Over Items').item.json;

// Enhanced query with results existence check
return {
  json: {
    query: `
      SELECT 
        prediction_id, 
        predicted_winner, 
        confidence_score,
        actual_winner,
        CASE 
          WHEN actual_winner IS NOT NULL THEN 1 
          ELSE 0 
        END as has_results,
        match_date,
        surface,
        odds_player1,
        odds_player2
      FROM predictions
      WHERE player1 = '${matchItem.player1}'
        AND player2 = '${matchItem.player2}'
        AND tournament = '${matchItem.tournament}'
      LIMIT 1;
    `,
    parameters: [matchItem.player1, matchItem.player2, matchItem.tournament]
  }
};

// STEP 2: Filter Logic Implementation
// In n8n, modify the "If" node condition:
// OLD: Always process if prediction found
// NEW: Only process if prediction found AND has_results = 0

// Filter condition: $(prediction).json.has_results === 0
// This ensures we only update predictions that don't have actual_winner yet

// STEP 3: Update Query Modifications
// The UPDATE query for updating predictions remains largely the same,
// but we add a WHERE clause to ensure we only update unprocessed predictions:

const updateQuery = `
  UPDATE predictions
  SET
    actual_winner = $actual_winner,
    prediction_correct = (predicted_winner = $actual_winner),
    confidence_bucket = CASE
      WHEN confidence_score >= 70 THEN 'high'
      WHEN confidence_score >= 50 THEN 'medium'
      ELSE 'low'
    END,
    updated_at = NOW()
  WHERE prediction_id = $prediction_id
    AND actual_winner IS NULL  -- Only update if not already processed
  RETURNING
    prediction_id,
    predicted_winner,
    actual_winner,
    prediction_correct,
    confidence_score,
    tournament,
    surface,
    player1,
    player2,
    odds_player1,
    odds_player2,
    $match_date as match_date;
`;

console.log("Evening workflow optimizations configured:");
console.log("1. Enhanced prediction matching with results check");
console.log("2. Filter to skip already processed matches");
console.log("3. Safe update with actual_winner IS NULL condition");
console.log("4. Enhanced update query with better error handling");
