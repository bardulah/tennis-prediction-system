// Morning Workflow Optimization Script
// Phase 2: Add match_id construction and prediction filtering

console.log("=== MORNING WORKFLOW OPTIMIZATIONS ===");
console.log("Adding match_id construction and prediction filtering...");

// STEP 1: Modify "Build Match Context" Node
// Add match_id construction at the beginning

const matchItem = $('Loop Over Items').item.json;

// Helper function to clean player names (remove nationality brackets)
function cleanPlayerName(name) {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

// Extract match_date from incoming data (with fallback to current date)
const matchDate = matchItem.match_date || new Date().toISOString().split('T')[0];

// Construct match_id for efficient lookup
const matchId = `${matchItem.tournament}_${cleanPlayerName(matchItem.player1)}_${cleanPlayerName(matchItem.player2)}_${matchDate}`
  .replace(/[^a-zA-Z0-9_]/g, '_');

console.log(`Constructed match_id: ${matchId}`);

// STEP 2: Add prediction existence check
// This will be handled by a new PostgreSQL node that queries:
// SELECT COUNT(*) FROM predictions WHERE match_id = $match_id
// If count > 0, skip processing this match

// Add match_id to the context for later filtering
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
    
    // NEW: match_id for efficient filtering
    match_id: matchId,
    
    // System metadata (for reference)
    has_prediction: false  // Will be set by filter node
  }
};

// STEP 3: Filter Logic Implementation
// In n8n, add an "If" node after match_id construction:
// Condition: $json.has_prediction === false
// This will skip matches that already have predictions
