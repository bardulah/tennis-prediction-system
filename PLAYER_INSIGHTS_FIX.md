# Player Insights Fix - Complete SQL Query

## The Problem
Your current "Store Player Insights" query has `LIMIT 1` which only inserts insights for 1 player per execution, causing the table to have only 3 rows total.

## The Solution
Remove `LIMIT 1` from the SQL query to allow multiple players to get insights.

## Fixed SQL Query

```sql
-- ✅ CORRECTED - Remove LIMIT 1
INSERT INTO player_insights (
  player_name,
  insight_type,
  insight_description,
  confidence,
  supporting_data,
  discovered_date,
  is_active
)
SELECT
  p.player_name,
  '{{ $json.insight_type }}',
  '{{ $json.insight_description }}',
  {{ $json.confidence }},
  '{{ $json.supporting_data }}'::jsonb,
  '{{ $json.discovered_date }}',
  true
FROM players p
WHERE '{{ $json.insight_description }}' ILIKE '%' || p.player_name || '%'
  AND p.total_matches > 0
ON CONFLICT (player_name, insight_type, discovered_date) DO NOTHING;
```

## What Changed
- **REMOVED**: `LIMIT 1` constraint
- **RESULT**: All matching players get insights
- **IMPACT**: Should generate hundreds of player insights instead of just 3

## Expected Result
- Before: 3 rows (1 player only)
- After: 150-300+ rows (multiple players per failed prediction)

## How to Apply
1. Open your n8n evening workflow
2. Find the "Store Player Insights" node
3. Replace the SQL query with the corrected version above
4. Save and test

This simple change should fix the player insights extraction issue!
