-- Morning Workflow SQL Queries
-- Phase 2: Prediction existence filtering

-- Query 1: Prediction Existence Check
-- Add this as a new PostgreSQL node in the morning workflow
-- Position: After "Build Match Context", before "Query Player 1 Stats"

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

-- Query 2: System Health Check (existing - no changes needed)
-- This query remains the same as current workflow

SELECT
    id,
    days_operated,
    learning_phase,
    overall_accuracy,
    data_quality_score,
    pinecone_record_count,
    total_predictions_made
FROM system_metadata
WHERE id = 1;

-- Query 3: Player 1 Stats (existing - no changes needed)
-- This query remains the same as current workflow

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

-- Query 4: Player 2 Stats (existing - no changes needed)
-- This query remains the same as current workflow

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

-- Query 5: Player Insights (existing - no changes needed)
-- This query remains the same as current workflow

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

-- Query 6: Learning Log Summary (existing - no changes needed)
-- This query remains the same as current workflow

SELECT
    learning_type,
    description,
    impact_score,
    learning_data
FROM learning_log
WHERE log_date >= CURRENT_DATE - INTERVAL '14 days'
  AND log_type IN ('pattern_discovery', 'insight_validation', 'confidence_calibration')
ORDER BY impact_score DESC, log_date DESC;
