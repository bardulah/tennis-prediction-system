const llmResponse = $input.item.json;
const matchContext = $("Build Match Context").item.json;

// Generate match_id from match details
// Use match_date from context (which has fallback to current date)
const matchDate = matchContext.match_date;
const matchId = `${matchContext.tournament}_${cleanPlayerName(matchContext.player1.name)}_${cleanPlayerName(matchContext.player2.name)}_${matchDate}`.replace(/[^a-zA-Z0-9_]/g, '_');

// Extract and parse prediction
let prediction = llmResponse.message.content;

// If content is a string (wrapped in markdown), extract and parse JSON
if (typeof prediction === 'string') {
  let jsonString = prediction.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Clean up the JSON string before parsing
  jsonString = cleanJsonString(jsonString);
  
  try {
    prediction = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Failed to parse LLM JSON for match ${matchId}:\nError: ${error.message}\n\nRaw JSON string:\n${jsonString}`);
  }
}

// Helper function to clean JSON string before parsing
function cleanJsonString(jsonString) {
  if (!jsonString) return jsonString;
  
  return jsonString
    .replace(/\\n/g, ' ')          // Replace escaped newlines with spaces
    .replace(/\\t/g, ' ')           // Replace escaped tabs with spaces
    .replace(/\\r/g, ' ')           // Replace escaped carriage returns
    .replace(/\\\\/g, '\\')         // Fix double backslashes
    .replace(/\\"/g, '"')           // Fix escaped quotes
    .replace(/\\'/g, "'")           // Fix escaped single quotes
    .replace(/\\b/g, '')            // Remove backspace
    .replace(/\\f/g, '')            // Remove form feed
    .replace(/\\v/g, '')            // Remove vertical tab
    .replace(/\\ /g, ' ')           // Fix forward slashes
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

// Helper function to escape single quotes for SQL
function escapeSql(str) {
  if (!str) return '';
  return str.toString().replace(/'/g, "''");
}

// Helper function to clean player names (remove nationality brackets)
function cleanPlayerName(name) {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

// Cap confidence based on max_confidence from system
const maxConfidence = matchContext.system.max_confidence / 100;
if (prediction.confidence_score > maxConfidence) {
  prediction.confidence_score = maxConfidence;
  prediction.reasoning += ` [Confidence capped at ${matchContext.system.max_confidence}% due to ${matchContext.system.learning_phase}]`;
}

// Determine data limitations based on learning phase
let dataLimitations = '';
if (matchContext.system.days_operated < 7) {
  dataLimitations = 'Phase 1: Limited historical data, relying primarily on odds and available player stats';
} else if (matchContext.system.days_operated < 21) {
  dataLimitations = 'Phase 2: Emerging patterns, moderate historical data available';
} else {
  dataLimitations = 'Phase 3: Mature system with comprehensive historical data';
}

// Check if we have surface-specific data for either player
const surfaceDataAvailable = (matchContext.player1.has_stats && matchContext.player1.stats.win_rate_surface > 0) ||
                               (matchContext.player2.has_stats && matchContext.player2.stats.win_rate_surface > 0);

const output = {
  match_id: escapeSql(matchId),
  tournament: escapeSql(matchContext.tournament),
  surface: escapeSql(matchContext.surface),
  player_1: escapeSql(cleanPlayerName(matchContext.player1.name)),
  player_2: escapeSql(cleanPlayerName(matchContext.player2.name)),
  odds_player_1: matchContext.player1.odds,
  odds_player_2: matchContext.player2.odds,
  predicted_winner: escapeSql(cleanPlayerName(prediction.predicted_winner)),
  confidence_score: Math.round(prediction.confidence_score * 100),
  reasoning: escapeSql(prediction.reasoning),
  risk_assessment: escapeSql(prediction.risk_assessment),
  value_bet: prediction.value_bet,
  recommended_action: escapeSql(prediction.recommended_action),
  prediction_date: matchDate,
  data_quality_at_prediction: matchContext.system.data_quality_score,
  learning_phase_at_prediction: escapeSql(matchContext.system.learning_phase),

  // Additional context fields
  days_operated: matchContext.system.days_operated,
  system_accuracy_at_prediction: matchContext.system.overall_accuracy,
  data_limitations: escapeSql(dataLimitations),
  player1_data_available: matchContext.player1.has_stats,
  player2_data_available: matchContext.player2.has_stats,
  h2h_data_available: false, // Not implemented yet
  surface_data_available: surfaceDataAvailable,
  similar_matches_count: matchContext.similar_matches.length
};

return { json: output };
