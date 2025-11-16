-- Morning Workflow SQL Queries - CORRECTED
-- Phase 2: Prediction existence filtering
-- Based on actual workflow: Player1 Stats → Player2 Stats → Insights → Pinecone → Build Context → AI → Store

-- Query 1: Prediction Existence Check (NEW - most important optimization)
-- Add this as a PostgreSQL node RIGHT AFTER match_id construction
-- Position: Before Query Player 1 Stats
-- This filters out expensive operations for already predicted matches

SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END as has_prediction,
    COUNT(*) as prediction_count,
    string_agg(
        prediction_id::text || ':' || predicted_winner || '@' || confidence_score || '%',
        '; '
    ) as existing_predictions
FROM predictions 
WHERE match_id = $match_id
LIMIT 1;

-- Query 2: Query Player 1 Stats (existing - no changes needed)
-- This runs only if has_prediction = false

SELECT
    player_name,
    total_matches,
    total_wins,
    total_losses,
    win_rate_overall,
    win_rate_clay,
    win_rate_hard,
    win_rate_grass,
    recent_form_last_5,
    recent_form_last_10,
    wins_last_5,
    wins_last_10,
    momentum_score,
    upset_wins_count,
    upset_losses_count,
    favorite_wins_count,
    favorite_losses_count,
    giant_killer_score,
    avg_odds_when_winning,
    avg_odds_when_losing,
    vs_favorites_win_rate,
    vs_underdogs_win_rate,
    last_match_date
FROM players
WHERE player_name = $player1
LIMIT 1;

-- Query 3: Query Player 2 Stats (existing - no changes needed)
-- This runs only if has_prediction = false

SELECT
    player_name,
    total_matches,
    total_wins,
    total_losses,
    win_rate_overall,
    win_rate_clay,
    win_rate_hard,
    win_rate_grass,
    recent_form_last_5,
    recent_form_last_10,
    wins_last_5,
    wins_last_10,
    momentum_score,
    upset_wins_count,
    upset_losses_count,
    favorite_wins_count,
    favorite_losses_count,
    giant_killer_score,
    avg_odds_when_winning,
    avg_odds_when_losing,
    vs_favorites_win_rate,
    vs_underdogs_win_rate,
    last_match_date
FROM players
WHERE player_name = $player2
LIMIT 1;

-- Query 4: Query Player Insights (existing - no changes needed)
-- This runs only if has_prediction = false

SELECT
    player_name,
    insight_type,
    insight_description,
    confidence,
    supporting_data,
    discovered_date
FROM player_insights
WHERE
    (player_name = $player1
     OR player_name = $player2)
    AND is_active = true
    AND discovered_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY discovered_date DESC;

-- Query 5: Learning Log Summary (existing - no changes needed)
-- This runs once for all matches (cached, outside the loop)

SELECT
    learning_type,
    description,
    impact_score,
    learning_data
FROM learning_log
WHERE log_date >= CURRENT_DATE - INTERVAL '14 days'
  AND log_type IN ('pattern_discovery', 'insight_validation', 'confidence_calibration')
ORDER BY impact_score DESC, log_date DESC;

-- CRITICAL IMPLEMENTATION NOTE:
-- The prediction existence check (Query 1) should be inserted between:
--   1. Loop Over Items (produces match data with match_id)
--   2. Query Player 1 Stats (expensive operation)
--
-- If has_prediction = true, the workflow should skip to the end
-- and not execute the expensive queries (Player1 Stats, Player2 Stats, Insights, Pinecone, AI)
--
-- This provides the major performance improvement for repeated runs!
