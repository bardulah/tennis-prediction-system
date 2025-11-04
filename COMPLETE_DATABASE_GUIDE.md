# Complete Tennis Prediction System - Database Operations Guide

## Overview
This guide traces the complete end-to-end flow of the tennis prediction system and shows **exactly what data** gets inserted into the **Neon PostgreSQL database** at each step.

---

## 🏁 PHASE 1: MORNING WORKFLOW (Predictions Generation)

### Step 1: Web Scraping
**Source**: Flashscore.com  
**Output**: Raw match data (no scores)
**File**: `matches-YYYY-MM-DD-strip-scores.json`

**Data Structure**:
```json
[
  {
    "tournament": "Tournament Name",
    "country": "Country",
    "surface": "Hard",
    "player1": "Player A",
    "nationality1": "Country A",
    "player2": "Player B", 
    "nationality2": "Country B",
    "odds1": "1.50",
    "odds2": "2.50",
    "score": "",              // Empty - no scores yet
    "winner": "",            // Empty - not played yet
    "match_date": "2025-11-04"
  }
]
```

### Step 2: n8n Morning Workflow Processing
**Input**: Scraped match data via webhook  
**Processing**: AI analysis with historical context

#### Database Operation 1: System Health Check
```sql
-- Reads from system_metadata table
SELECT 
  days_operated,
  learning_phase,
  overall_accuracy,
  data_quality_score,
  pinecone_record_count,
  total_predictions_made
FROM system_metadata 
WHERE id = 1;
```

#### Database Operation 2: Query Player 1 Stats
```sql
-- Reads historical stats for player 1
SELECT 
  player_name,
  total_matches,
  total_wins,
  win_rate_overall,
  win_rate_clay,
  win_rate_hard,
  recent_form_last_5,
  momentum_score,
  giant_killer_score
FROM players 
WHERE player_name = 'Player A'
LIMIT 1;
```

#### Database Operation 3: Query Player 2 Stats
```sql
-- Reads historical stats for player 2  
SELECT 
  player_name,
  total_matches,
  total_wins,
  win_rate_overall,
  win_rate_clay, 
  win_rate_hard,
  recent_form_last_5,
  momentum_score,
  giant_killer_score
FROM players 
WHERE player_name = 'Player B'
LIMIT 1;
```

#### Database Operation 4: Query Learning Insights
```sql
-- Reads recent learning patterns (last 14 days)
SELECT 
  log_date,
  learning_type,
  description,
  learning_data,
  impact_score
FROM learning_log
WHERE log_date >= CURRENT_DATE - INTERVAL '14 days'
  AND learning_type IN ('pattern_discovery', 'confidence_calibration')
ORDER BY log_date DESC, impact_score DESC
LIMIT 10;
```

#### Database Operation 5: AI Analysis & Predictions
**Output**: AI-generated prediction  
**AI Model**: OpenAI/Gemini  

#### Database Operation 6: Store Predictions ⭐
```sql
-- MAIN INSERT - Stores AI prediction in database
INSERT INTO predictions (
  match_id,
  prediction_day,
  tournament,
  surface,
  player1,
  player2,
  odds_player1,
  odds_player2,
  predicted_winner,
  confidence_score,
  reasoning,
  risk_assessment,
  value_bet,
  recommended_action,
  data_quality_score,
  learning_phase,
  days_operated,
  system_accuracy_at_prediction,
  player1_data_available,
  player2_data_available,
  surface_data_available,
  similar_matches_count
) VALUES (
  'Tournament_PlayerA_PlayerB_2025-11-04',
  '2025-11-04',
  'Tournament Name',
  'Hard', 
  'Player A',
  'Player B',
  1.50,
  2.50,
  'Player A',              -- AI prediction
  75,                     -- Confidence score
  'Player A has better recent form...', -- AI reasoning
  'medium',                -- Risk assessment
  true,                    -- Value bet
  'bet',                   -- Recommended action
  85,                      -- Data quality score
  'phase2_pattern_recognition', -- Learning phase
  45,                     -- Days operated
  68.5,                   -- System accuracy
  true,                    -- Player 1 data available
  true,                    -- Player 2 data available  
  true,                    -- Surface data available
  3                       -- Similar matches found
)
ON CONFLICT (match_id) DO UPDATE SET
  confidence_score = EXCLUDED.confidence_score,
  reasoning = EXCLUDED.reasoning,
  predicted_winner = EXCLUDED.predicted_winner;
```

**Result**: Prediction stored in `predictions` table ✅

---

## 🌙 PHASE 2: EVENING WORKFLOW (Results & Learning)

### Step 3: Evening Web Scraping
**Source**: Flashscore.com (yesterday's matches)  
**Output**: Completed match data (with scores)
**File**: `matches-YYYY-MM-DD-finished.json`

**Data Structure**:
```json
[
  {
    "tournament": "Tournament Name",
    "country": "Country", 
    "surface": "Hard",
    "player1": "Player A",
    "nationality1": "Country A",
    "player2": "Player B",
    "nationality2": "Country B", 
    "odds1": "1.50",
    "odds2": "2.50",
    "score": "6-4 7-6",         // Actual scores
    "winner": "Player A",         // Actual winner
    "match_date": "2025-11-03"
  }
]
```

### Step 4: n8n Evening Workflow Processing
**Input**: Completed match data via webhook  
**Processing**: Validation + Learning + Analysis

#### Database Operation 7: Extract Matches from Webhook
**JavaScript processing**: Formats match data for database insertion

#### Database Operation 8: Insert Match Into Database ⭐
```sql
-- MAIN INSERT - Stores completed match in database
INSERT INTO matches (
  match_unique_id,
  tournament,
  country,
  surface,
  player1,
  player1_nationality,
  player2,
  player2_nationality,
  odds_player1,
  odds_player2,
  winner,
  loser,
  score,
  match_date,
  is_upset,
  odds_winner,
  odds_loser,
  implied_prob_player1,
  implied_prob_player2,
  favorite,
  favorite_won
) VALUES (
  'Tournament_PlayerA_PlayerB_2025-11-03',
  'Tournament Name',
  'Country',
  'Hard',
  'Player A',
  'Country A',           -- nationality1 field
  'Player B', 
  'Country B',          -- nationality2 field
  1.50,
  2.50,
  'Player A',           -- Actual winner
  'Player B',           -- Actual loser
  '6-4 7-6',           -- Actual score
  '2025-11-03'::date,
  false,                -- Not an upset (favorite won)
  1.50,                -- Winner's odds
  2.50,                -- Loser's odds
  66.67,               -- Implied prob player 1
  40.00,               -- Implied prob player 2  
  'Player A',           -- Favorite (lower odds)
  true                  -- Favorite won
)
ON CONFLICT (match_unique_id) DO UPDATE SET
  winner = EXCLUDED.winner,
  loser = EXCLUDED.loser,
  score = EXCLUDED.score,
  is_upset = EXCLUDED.is_upset;
```

**Result**: Match stored in `matches` table ✅  
**Bonus**: Player nationalities automatically updated ✅

#### Database Operation 9: Find Matching Predictions
```sql
-- Links the completed match to its earlier prediction
SELECT 
  prediction_id,
  predicted_winner,
  confidence_score
FROM predictions
WHERE player1 = 'Player A'
  AND player2 = 'Player B'
  AND tournament = 'Tournament Name'
LIMIT 1;
```

#### Database Operation 10: Update Prediction Accuracy ⭐
```sql
-- Updates the prediction with actual results
UPDATE predictions
SET
  actual_winner = 'Player A',              -- Actual result
  prediction_correct = (predicted_winner = 'Player A'), -- TRUE/FALSE
  confidence_bucket = 'high'                -- High/Medium/Low
WHERE prediction_id = 123;  -- From step 9
```

**Result**: Prediction updated with accuracy ✅

#### Database Operation 11: Calculate Daily Stats
```sql
-- Calculates daily performance metrics
WITH stats AS (
  SELECT
    COUNT(*) as total_preds,
    SUM(CASE WHEN prediction_correct = true THEN 1 ELSE 0 END) as correct_preds,
    SUM(CASE WHEN prediction_correct = false THEN 1 ELSE 0 END) as incorrect_preds,
    AVG(CASE WHEN prediction_correct = true THEN confidence_score ELSE NULL END) as avg_conf_correct,
    COUNT(CASE WHEN confidence_score >= 60 THEN 1 END) as high_conf_total
  FROM predictions
  WHERE actual_winner IS NOT NULL
)
SELECT * FROM stats;
```

#### Database Operation 12: Update System Metadata ⭐
```sql
-- Updates overall system performance
UPDATE system_metadata
SET
  days_operated = days_operated + 1,
  total_predictions_made = 156,           -- From predictions table
  correct_predictions = 107,             -- Updated count
  overall_accuracy = 68.59,              -- New accuracy %
  avg_confidence_when_correct = 72.5,
  avg_confidence_when_incorrect = 68.2,
  last_result_date = CURRENT_DATE
WHERE id = 1
RETURNING days_operated, learning_phase, overall_accuracy;
```

**Result**: System metadata updated ✅

#### Database Operation 13: LLM Learning Analysis
**AI Analysis**: Analyzes failed predictions to find patterns

#### Database Operation 14: Store Learning Insights ⭐
```sql
-- Stores discovered patterns and improvements
INSERT INTO learning_log (
  log_date,
  log_type,
  description,
  learning_data,
  impact_score
) VALUES (
  CURRENT_DATE,
  'pattern_discovery',
  'Young players under 25 performing better in finals',
  '{"affected_predictions": [123, 124, 125], "pattern": "youth_advantage"}',
  8
);
```

**Result**: Learning patterns stored ✅

---

## 📊 FINAL DATABASE STATE

### Tables Updated During Complete Cycle:

#### 1. `predictions` table
- **Morning**: 10 new predictions inserted
- **Evening**: 10 predictions updated with actual_winner + accuracy
- **Status**: Complete cycle

#### 2. `matches` table  
- **Evening**: 10 matches inserted
- **Data**: Complete match results with scores
- **Status**: Fresh data

#### 3. `players` table
- **Evening**: Automatic nationality updates from match data
- **Statistics**: Updated via triggers (if configured)
- **Status**: Enriched

#### 4. `system_metadata` table
- **Evening**: Updated accuracy metrics
- **Learning Phase**: May progress based on days operated
- **Status**: Current

#### 5. `learning_log` table
- **Evening**: New insights from failed predictions
- **Purpose**: Future prediction improvements
- **Status**: Growing dataset

---

## 🎯 Complete Daily Cycle Summary

**Morning (6 AM)**:
1. Scrape 20 today's matches (no scores)
2. Generate 20 AI predictions  
3. Store 20 predictions in database

**Evening (6 PM)**:
1. Scrape 20 yesterday's matches (with scores)
2. Validate 20 predictions against actual results
3. Update system accuracy metrics
4. Discover 2-5 new learning patterns
5. Store completed matches + insights

**Result**: Complete end-to-end AI learning system! 🎾⚡

---

## 🔍 Database Monitoring Queries

Check system health:

```sql
-- Check daily predictions
SELECT COUNT(*) as today_predictions 
FROM predictions 
WHERE prediction_day = CURRENT_DATE;

-- Check system accuracy
SELECT 
  learning_phase,
  overall_accuracy,
  days_operated
FROM system_metadata 
WHERE id = 1;

-- Check recent learning
SELECT COUNT(*) as recent_insights
FROM learning_log 
WHERE log_date >= CURRENT_DATE - INTERVAL '7 days';
```

This complete cycle runs **automatically twice daily** and continuously improves the AI prediction accuracy! 🎯
