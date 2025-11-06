# 📊 Metabase Dashboard Configurations

Pre-configured dashboard templates for Tennis Predictions analytics.

## Dashboard 1: System Performance Overview

**Purpose**: Monitor overall prediction system accuracy and performance

### Visualizations

#### 1. Overall Accuracy Trend (Line Chart)
```sql
SELECT
  date,
  daily_accuracy,
  high_conf_accuracy,
  medium_conf_accuracy,
  low_conf_accuracy
FROM prediction_accuracy
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date ASC;
```

**Configuration**:
- X-axis: `date`
- Y-axis: All accuracy columns
- Chart type: Line chart with multiple series
- Display: Show legend, gridlines

#### 2. Predictions by Confidence Level (Pie Chart)
```sql
SELECT
  CASE
    WHEN confidence_score >= 60 THEN 'High (60%+)'
    WHEN confidence_score >= 50 THEN 'Medium (50-59%)'
    ELSE 'Low (<50%)'
  END as confidence_level,
  COUNT(*) as total
FROM predictions
WHERE prediction_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY confidence_level;
```

**Configuration**:
- Dimension: `confidence_level`
- Metric: `total`
- Chart type: Pie chart
- Colors: Green (High), Yellow (Medium), Red (Low)

#### 3. Daily Prediction Volume (Bar Chart)
```sql
SELECT
  prediction_date as date,
  COUNT(*) as predictions,
  SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) as correct,
  SUM(CASE WHEN NOT prediction_correct THEN 1 ELSE 0 END) as incorrect
FROM predictions
WHERE prediction_date >= CURRENT_DATE - INTERVAL '14 days'
  AND actual_winner IS NOT NULL
GROUP BY prediction_date
ORDER BY prediction_date ASC;
```

**Configuration**:
- X-axis: `date`
- Y-axis: `correct`, `incorrect` (stacked)
- Chart type: Stacked bar chart
- Colors: Green (correct), Red (incorrect)

#### 4. System Health Metrics (Metrics)
```sql
SELECT
  days_operated,
  learning_phase,
  overall_accuracy,
  total_predictions_made,
  pinecone_record_count,
  data_quality_score
FROM system_metadata
WHERE id = 1;
```

**Configuration**:
- Display type: Number metrics in grid
- Format:
  - `overall_accuracy`: Percentage
  - `data_quality_score`: Percentage
  - Others: Numbers with commas

---

## Dashboard 2: Player Analytics

**Purpose**: Analyze player performance and identify patterns

### Visualizations

#### 1. Top 20 Players by Win Rate (Bar Chart)
```sql
SELECT
  player_name,
  total_matches,
  ROUND(win_rate_overall::numeric, 1) as win_rate
FROM players
WHERE total_matches >= 15
ORDER BY win_rate_overall DESC
LIMIT 20;
```

**Configuration**:
- X-axis: `player_name`
- Y-axis: `win_rate`
- Chart type: Horizontal bar chart
- Sort: Descending by win_rate
- Color: Gradient (low to high)

#### 2. Win Rate by Surface (Grouped Bar Chart)
```sql
SELECT
  player_name,
  ROUND(win_rate_clay::numeric, 1) as clay,
  ROUND(win_rate_hard::numeric, 1) as hard,
  ROUND(win_rate_grass::numeric, 1) as grass
FROM players
WHERE total_matches >= 20
ORDER BY win_rate_overall DESC
LIMIT 15;
```

**Configuration**:
- X-axis: `player_name`
- Y-axis: `clay`, `hard`, `grass`
- Chart type: Grouped bar chart
- Colors: Orange (clay), Blue (hard), Green (grass)

#### 3. Giant Killers Leaderboard (Table)
```sql
SELECT
  player_name,
  total_matches,
  ROUND(giant_killer_score::numeric, 2) as giant_killer_score,
  ROUND(vs_favorites_win_rate::numeric, 1) as vs_favorites_pct,
  recent_form_last_5,
  ROUND(momentum_score::numeric, 1) as momentum
FROM players
WHERE giant_killer_score > 4
  AND total_matches >= 10
ORDER BY giant_killer_score DESC
LIMIT 20;
```

**Configuration**:
- Display type: Table
- Formatting:
  - `giant_killer_score`: 2 decimals
  - `vs_favorites_pct`: Percentage
  - `momentum`: 1 decimal
- Conditional formatting: Highlight high giant_killer_score

#### 4. Form vs Momentum (Scatter Plot)
```sql
SELECT
  player_name,
  momentum_score,
  win_rate_overall,
  total_matches,
  recent_form_last_5
FROM players
WHERE total_matches >= 10
  AND momentum_score IS NOT NULL;
```

**Configuration**:
- X-axis: `momentum_score`
- Y-axis: `win_rate_overall`
- Bubble size: `total_matches`
- Chart type: Scatter plot
- Tooltip: Show `player_name`, `recent_form_last_5`

---

## Dashboard 3: Match Insights

**Purpose**: Deep dive into match results and prediction performance

### Visualizations

#### 1. Upset Frequency Over Time (Line Chart)
```sql
SELECT
  DATE(match_date) as date,
  COUNT(*) as total_matches,
  SUM(CASE WHEN is_upset THEN 1 ELSE 0 END) as upsets,
  ROUND(100.0 * SUM(CASE WHEN is_upset THEN 1 ELSE 0 END) / COUNT(*), 1) as upset_pct
FROM matches
WHERE match_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(match_date)
ORDER BY date ASC;
```

**Configuration**:
- X-axis: `date`
- Y-axis: `upset_pct` (line), `upsets` (bars)
- Chart type: Combo chart
- Format: `upset_pct` as percentage

#### 2. Prediction Accuracy by Tournament (Table)
```sql
SELECT
  tournament,
  COUNT(*) as predictions,
  SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) as correct,
  ROUND(
    100.0 * SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) / COUNT(*),
    1
  ) as accuracy_pct,
  AVG(confidence_score) as avg_confidence
FROM predictions
WHERE actual_winner IS NOT NULL
  AND prediction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tournament
HAVING COUNT(*) >= 5
ORDER BY accuracy_pct DESC;
```

**Configuration**:
- Display type: Table
- Sort: By `accuracy_pct` descending
- Conditional formatting:
  - Green: accuracy_pct >= 60
  - Yellow: accuracy_pct 50-59
  - Red: accuracy_pct < 50

#### 3. Confidence vs Success Rate (Scatter Plot)
```sql
SELECT
  confidence_score,
  prediction_correct::int as was_correct,
  tournament,
  CONCAT(player1, ' vs ', player2) as matchup
FROM predictions
WHERE actual_winner IS NOT NULL
  AND prediction_date >= CURRENT_DATE - INTERVAL '14 days';
```

**Configuration**:
- X-axis: `confidence_score`
- Y-axis: `was_correct` (0 or 1)
- Chart type: Scatter plot with jitter
- Color: By `tournament`
- Add trend line

#### 4. High-Value Opportunities (Table)
```sql
SELECT
  prediction_date,
  tournament,
  player1,
  player2,
  predicted_winner,
  confidence_score,
  reasoning,
  odds_player1,
  odds_player2
FROM predictions
WHERE confidence_score >= 65
  AND prediction_date >= CURRENT_DATE
ORDER BY confidence_score DESC, prediction_date ASC
LIMIT 10;
```

**Configuration**:
- Display type: Table with expandable rows
- Show `reasoning` in expanded view
- Highlight confidence >= 70 in bold

---

## Dashboard 4: Business Intelligence

**Purpose**: ROI tracking and strategic insights

### Visualizations

#### 1. Accuracy by Confidence Bucket (Funnel Chart)
```sql
SELECT
  CASE
    WHEN confidence_score >= 70 THEN 'Very High (70%+)'
    WHEN confidence_score >= 60 THEN 'High (60-69%)'
    WHEN confidence_score >= 50 THEN 'Medium (50-59%)'
    ELSE 'Low (<50%)'
  END as bucket,
  COUNT(*) as total,
  SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) as correct,
  ROUND(
    100.0 * SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) / COUNT(*),
    1
  ) as accuracy
FROM predictions
WHERE actual_winner IS NOT NULL
GROUP BY bucket
ORDER BY
  CASE
    WHEN confidence_score >= 70 THEN 1
    WHEN confidence_score >= 60 THEN 2
    WHEN confidence_score >= 50 THEN 3
    ELSE 4
  END;
```

**Configuration**:
- Chart type: Funnel or horizontal bar
- Display: Total, accuracy percentage
- Colors: Gradient from green to red

#### 2. Learning Phase Progress (Gauge/Indicator)
```sql
SELECT
  learning_phase,
  days_operated,
  CASE
    WHEN learning_phase = 'phase1_data_collection' THEN 33
    WHEN learning_phase = 'phase2_pattern_recognition' THEN 66
    ELSE 100
  END as progress_pct,
  overall_accuracy
FROM system_metadata
WHERE id = 1;
```

**Configuration**:
- Display type: Gauge or progress bar
- Show: `learning_phase`, `days_operated`, `overall_accuracy`
- Goal: 100% progress

#### 3. Data Quality Over Time (Line Chart)
```sql
SELECT
  prediction_date as date,
  AVG(data_quality_score) as avg_quality,
  COUNT(CASE WHEN player1_data_available AND player2_data_available THEN 1 END) as both_players_known,
  COUNT(*) as total
FROM predictions
WHERE prediction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY prediction_date
ORDER BY date ASC;
```

**Configuration**:
- X-axis: `date`
- Y-axis: `avg_quality` (line)
- Chart type: Line chart with area fill
- Goal line at 80

#### 4. Pinecone Growth (Area Chart)
```sql
-- Note: This requires historical tracking. For now, use current count
SELECT
  CURRENT_DATE as date,
  pinecone_record_count as records
FROM system_metadata
WHERE id = 1;

-- Better alternative: Track in prediction_accuracy table
SELECT
  date,
  high_conf_predictions + medium_conf_predictions + low_conf_predictions as daily_additions,
  SUM(high_conf_predictions + medium_conf_predictions + low_conf_predictions)
    OVER (ORDER BY date) as cumulative_records
FROM prediction_accuracy
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date ASC;
```

**Configuration**:
- X-axis: `date`
- Y-axis: `cumulative_records`
- Chart type: Area chart
- Color: Blue gradient

---

## Quick Setup Guide

### Create Dashboards in Metabase

1. **Navigate to Dashboards**
   - Click "+" → "New Dashboard"
   - Name it (e.g., "System Performance Overview")

2. **Add Questions**
   - Click "Add a question"
   - Choose "Native query" (SQL)
   - Paste SQL from above
   - Configure visualization settings
   - Save question

3. **Arrange Layout**
   - Drag and resize cards
   - Group related metrics
   - Add text cards for context

4. **Add Filters** (optional)
   - Date range filter
   - Tournament filter
   - Confidence threshold

5. **Share & Schedule**
   - Set permissions
   - Schedule email reports
   - Create public links (if needed)

---

## Filter Suggestions

### Global Filters for All Dashboards

**Date Range Filter**:
```sql
-- Add WHERE clause to queries
WHERE date BETWEEN {{start_date}} AND {{end_date}}
```

**Tournament Filter**:
```sql
-- Add WHERE clause
WHERE tournament IN {{tournament_list}}
```

**Confidence Threshold**:
```sql
-- Add WHERE clause
WHERE confidence_score >= {{min_confidence}}
```

---

## Best Practices

1. **Refresh Frequency**:
   - System Performance: Every 1 hour
   - Player Analytics: Every 6 hours
   - Match Insights: Every 1 hour
   - Business Intelligence: Every 24 hours

2. **Performance Optimization**:
   - Use indexes (already defined in schema)
   - Limit date ranges (last 30-90 days)
   - Cache frequently used queries

3. **Data Quality**:
   - Always filter WHERE actual_winner IS NOT NULL for accuracy metrics
   - Check for minimum sample sizes (e.g., total_matches >= 10)
   - Handle NULL values appropriately

4. **Visual Consistency**:
   - Use same color scheme across dashboards
   - Consistent date formats
   - Standard metric naming

---

## Next Steps

After creating these dashboards:

1. Set up automated email reports for daily summaries
2. Create alerts for:
   - Accuracy dropping below 50%
   - High-confidence predictions (>70%)
   - System errors or data quality issues
3. Build custom dashboards for specific tournaments
4. Add user segmentation for different stakeholders

---

## Support

For questions about:
- **Chart types**: See [Metabase Visualization Docs](https://www.metabase.com/docs/latest/questions/sharing/visualizations)
- **SQL queries**: See `../database/schema.sql` for table structures
- **Custom dashboards**: Refer to Metabase documentation
