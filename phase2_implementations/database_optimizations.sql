#!/usr/bin/env bash

# Phase 2: Database Schema Optimizations
# Add indexes for efficient workflow filtering

echo "=== PHASE 2 DATABASE OPTIMIZATIONS ==="
echo "Adding indexes for workflow efficiency..."

# Add database connection
DATABASE_URL="postgresql://neondb_owner:********************************@ep-muddy-frost-123456.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"

echo "1. Adding prediction existence indexes..."

# Add index on predictions.match_id for fast lookups
psql "$DATABASE_URL" -c "
CREATE INDEX IF NOT EXISTS idx_predictions_match_id 
ON predictions(match_id);
"

# Add index on predictions.actual_winner for filtering processed matches
psql "$DATABASE_URL" -c "
CREATE INDEX IF NOT EXISTS idx_predictions_actual_winner 
ON predictions(actual_winner) 
WHERE actual_winner IS NULL;
"

# Add index on predictions.prediction_day for date filtering
psql "$DATABASE_URL" -c "
CREATE INDEX IF NOT EXISTS idx_predictions_prediction_day 
ON predictions(prediction_day);
"

echo "2. Verifying indexes created..."

psql "$DATABASE_URL" -c "
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'predictions' 
AND indexname LIKE 'idx_predictions_%'
ORDER BY indexname;
"

echo ""
echo "✅ Database optimizations complete!"
echo ""
echo "New indexes created:"
echo "  - idx_predictions_match_id (for fast match lookups)"
echo "  - idx_predictions_actual_winner (for filtering unprocessed)"
echo "  - idx_predictions_prediction_day (for date filtering)"
echo ""
echo "These indexes will improve workflow performance significantly!"
