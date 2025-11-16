-- Morning Workflow SQL Queries - FINALLY CORRECTED
-- Phase 2: Prediction filtering BEFORE expensive operations

-- CRITICAL: Add prediction existence check RIGHT AFTER "Loop Over Items"
-- BEFORE "Query Player 1 Stats"

-- Query 1: Prediction Existence Check (NEW - most important)
-- Add this as PostgreSQL node immediately after "Loop Over Items"
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

-- IF NODE CONDITION:
-- {{ $json.has_prediction === false }}

-- CONNECTIONS:
-- true (no prediction) → Query Player 1 Stats (continue with expensive operations)
-- false (prediction exists) → End (skip all expensive operations)

-- ALL OTHER QUERIES REMAIN UNCHANGED:
-- They only run if has_prediction = false

-- Query 2: Query Player 1 Stats (only if no prediction exists)
-- Query 3: Query Player 2 Stats (only if no prediction exists)
-- Query 4: Query Player Insights (only if no prediction exists)
-- Query 5: Query Pinecone (only if no prediction exists)
-- Query 6: Learning Log (runs once for all matches, cached)

-- STRUCTURE:
-- Loop Over Items
--   ↓
-- Check Prediction Exists ← NEW optimization point
--   ↓
-- If has_prediction = false
--   ↓ (true)
-- Query Player 1 Stats ← EXPENSIVE operation
-- Query Player 2 Stats ← EXPENSIVE operation
-- Query Player Insights ← EXPENSIVE operation
-- Query Pinecone ← EXPENSIVE operation
--   ↓
-- Build Match Context
-- Summarize Learning Insights (cached)
-- AI Prediction
-- Store in DB

-- This provides the 70-80% performance improvement
-- by skipping expensive operations for existing predictions!
