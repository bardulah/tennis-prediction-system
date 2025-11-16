-- Evening Workflow SQL Queries
-- Phase 2: Results existence filtering

-- Query 1: Enhanced Prediction Matching (modified)
-- Replace the existing "Find Matching Prediction" query
-- Add results existence check to prevent redundant updates

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
WHERE player1 = $player1
  AND player2 = $player2
  AND tournament = $tournament
  AND prediction_day = CURRENT_DATE  -- Only today's predictions
LIMIT 1;

-- Expected result format:
-- {
--   "prediction_id": 12345,
--   "predicted_winner": "Player A", 
--   "confidence_score": 75,
--   "actual_winner": null,  -- NULL if not processed yet
--   "has_results": 0,           -- 0 if not processed, 1 if already has results
--   "match_date": "2025-11-16",
--   "surface": "Hard",
--   "odds_player1": 1.50,
--   "odds_player2": 2.50
-- }

-- Query 2: Update Prediction Results (modified)
-- Add safety condition to only update unprocessed predictions
-- Replace the existing UPDATE query

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
  AND actual_winner IS NULL  -- CRITICAL: Only update if not already processed
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

-- Query 3: Get Completed Predictions for Summary (existing - no changes needed)
-- This query remains the same as current workflow

SELECT 
    COUNT(*) as total_updated,
    SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) as correct_predictions,
    SUM(CASE WHEN prediction_correct = FALSE THEN 1 ELSE 0 END) as incorrect_predictions,
    ROUND(AVG(confidence_score), 2) as avg_confidence,
    ROUND(AVG(confidence_score) FILTER (WHERE prediction_correct), 2) as avg_confidence_correct,
    ROUND(AVG(confidence_score) FILTER (WHERE prediction_correct = FALSE), 2) as avg_confidence_incorrect,
    COUNT(CASE WHEN confidence_score >= 60 THEN 1 END) as high_confidence_count,
    COUNT(CASE WHEN confidence_score >= 50 AND confidence_score < 60 THEN 1 END) as medium_confidence_count,
    COUNT(CASE WHEN confidence_score < 50 THEN 1 END) as low_confidence_count
FROM predictions
WHERE prediction_day = CURRENT_DATE
  AND actual_winner IS NOT NULL;

-- Query 4: Learning Log Entry (existing - no changes needed)
-- This query remains the same as current workflow

INSERT INTO learning_log (
    log_date,
    log_type,
    description,
    learning_data,
    impact_score
) VALUES (
    CURRENT_DATE,
    'daily_accuracy_update',
    $description,
    $learning_data,
    5
);

-- Query 5: System Metadata Update (existing - no changes needed)  
-- This query remains the same as current workflow

UPDATE system_metadata
SET
    days_operated = days_operated + 1,
    overall_accuracy = $new_accuracy,
    total_predictions_made = total_predictions_made + $new_predictions,
    correct_predictions = correct_predictions + $new_correct,
    incorrect_predictions = incorrect_predictions + $new_incorrect,
    avg_confidence_when_correct = $new_avg_confidence_correct,
    avg_confidence_when_incorrect = $new_avg_confidence_incorrect,
    last_result_date = CURRENT_DATE,
    last_update = NOW()
WHERE id = 1
RETURNING *;

-- Filter Logic for Evening Workflow:
-- In n8n, modify the "If" node that checks for prediction found:
-- OLD Condition: Always proceed if prediction found
-- NEW Condition: Proceed only if prediction found AND has_results = 0

-- This ensures we only update predictions that don't have actual_winner populated yet
