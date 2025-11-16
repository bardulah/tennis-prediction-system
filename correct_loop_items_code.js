// CORRECTED JavaScript for "Loop Over Items" node
// Replace the existing code in this node with this:

// Helper function to clean player names (remove nationality brackets)
function cleanPlayerName(name) {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

// Get the current match data from the loop
const matchItem = $input.item.json;

// Extract match_date from incoming data (with fallback to current date)
const matchDate = matchItem.match_date || new Date().toISOString().split('T')[0];

// Construct match_id for efficient lookup
const matchId = `${matchItem.tournament}_${cleanPlayerName(matchItem.player1)}_${cleanPlayerName(matchItem.player2)}_${matchDate}`
  .replace(/[^a-zA-Z0-9_]/g, '_');

// Return match data with match_id for filtering
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
    match_id: matchId
  }
};

// This replaces whatever code is currently in the "Loop Over Items" node
// The key change is using $input.item.json instead of matchItem
