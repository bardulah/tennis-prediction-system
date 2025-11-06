# 📈 Key Metrics & Analytics Guide

Complete guide to metrics, KPIs, and analytical insights for the Tennis Prediction System.

---

## 🎯 Core Performance Metrics

### 1. Overall Accuracy
**Definition**: Percentage of correct predictions across all matches

**SQL**:
```sql
SELECT overall_accuracy
FROM system_metadata
WHERE id = 1;
```

**Target**: >55% (industry benchmark)
**Good**: 55-65%
**Excellent**: >65%

### 2. Accuracy by Confidence Level

**High Confidence (60%+)**:
```sql
SELECT
  ROUND(
    100.0 * SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) /
    COUNT(*), 2
  ) as accuracy
FROM predictions
WHERE confidence_score >= 60
  AND actual_winner IS NOT NULL;
```
**Target**: >70%

**Medium Confidence (50-59%)**:
```sql
-- Same query with: WHERE confidence_score >= 50 AND confidence_score < 60
```
**Target**: >55%

**Low Confidence (<50%)**:
```sql
-- Same query with: WHERE confidence_score < 50
```
**Target**: >45%

### 3. Prediction Volume
**Definition**: Number of predictions made per day

**SQL**:
```sql
SELECT
  prediction_date,
  COUNT(*) as daily_predictions
FROM predictions
GROUP BY prediction_date
ORDER BY prediction_date DESC
LIMIT 30;
```

**Expected Range**: 10-50 per day (varies by tournament season)

---

## 📊 Player Performance Metrics

### 4. Win Rate Overall
**Definition**: Player's overall win percentage

**SQL**:
```sql
SELECT
  player_name,
  total_matches,
  ROUND(win_rate_overall::numeric, 2) as win_pct
FROM players
WHERE total_matches >= 10
ORDER BY win_rate_overall DESC;
```

**Interpretation**:
- >70%: Elite player
- 60-70%: Top tier
- 50-60%: Solid player
- <50%: Struggling

### 5. Surface-Specific Win Rates

**Clay Courts**:
```sql
SELECT
  player_name,
  ROUND(win_rate_clay::numeric, 2) as clay_win_pct
FROM players
WHERE total_matches >= 15
ORDER BY win_rate_clay DESC;
```

**Hard Courts** & **Grass Courts**: Similar queries with respective columns

**Use Case**: Identify surface specialists

### 6. Giant Killer Score
**Definition**: Ability to beat favorites (0-10 scale)

**SQL**:
```sql
SELECT
  player_name,
  ROUND(giant_killer_score::numeric, 2) as gk_score,
  ROUND(vs_favorites_win_rate::numeric, 1) as upset_rate
FROM players
WHERE giant_killer_score > 0
ORDER BY giant_killer_score DESC
LIMIT 20;
```

**Interpretation**:
- >7: Exceptional giant killer
- 5-7: Strong underdog performer
- 3-5: Moderate upset potential
- <3: Rarely upsets favorites

### 7. Momentum Score
**Definition**: Recent performance trend (0-10 scale)

**SQL**:
```sql
SELECT
  player_name,
  ROUND(momentum_score::numeric, 1) as momentum,
  recent_form_last_5
FROM players
WHERE momentum_score IS NOT NULL
ORDER BY momentum_score DESC
LIMIT 20;
```

**Interpretation**:
- >7: Hot streak
- 5-7: Good form
- 3-5: Average form
- <3: Cold streak

---

## 🔍 Match Insight Metrics

### 8. Upset Frequency
**Definition**: Percentage of matches where underdog wins

**SQL**:
```sql
SELECT
  COUNT(CASE WHEN is_upset THEN 1 END) as upsets,
  COUNT(*) as total_matches,
  ROUND(
    100.0 * COUNT(CASE WHEN is_upset THEN 1 END) / COUNT(*), 2
  ) as upset_pct
FROM matches
WHERE match_date >= CURRENT_DATE - INTERVAL '30 days';
```

**Typical Range**: 20-35% (varies by surface and tournament)

### 9. Odds Accuracy
**Definition**: How well betting odds predict outcomes

**SQL**:
```sql
SELECT
  COUNT(CASE WHEN favorite_won THEN 1 END) as favorites_won,
  COUNT(*) as total,
  ROUND(
    100.0 * COUNT(CASE WHEN favorite_won THEN 1 END) / COUNT(*), 2
  ) as favorite_win_pct
FROM matches
WHERE match_date >= CURRENT_DATE - INTERVAL '30 days';
```

**Expected**: 65-75% (favorites should win most matches)

### 10. Prediction vs Odds Comparison
**Definition**: How AI predictions compare to betting markets

**SQL**:
```sql
SELECT
  COUNT(CASE
    WHEN predicted_winner != favorite
      AND prediction_correct THEN 1
  END) as ai_beats_odds,
  COUNT(CASE
    WHEN predicted_winner = favorite
      AND prediction_correct THEN 1
  END) as ai_agrees_odds,
  COUNT(*) as total
FROM predictions p
JOIN matches m ON m.prediction_id = p.prediction_id
WHERE p.actual_winner IS NOT NULL
  AND p.prediction_date >= CURRENT_DATE - INTERVAL '30 days';
```

**KPI**: AI should beat odds >10% of the time for value

---

## 🎓 Learning System Metrics

### 11. Learning Phase
**Definition**: Current stage of AI learning

**SQL**:
```sql
SELECT
  learning_phase,
  days_operated,
  CASE
    WHEN learning_phase = 'phase1_data_collection' THEN '1-7 days: Gathering data'
    WHEN learning_phase = 'phase2_pattern_recognition' THEN '8-21 days: Learning patterns'
    ELSE '22+ days: Mature system'
  END as phase_description
FROM system_metadata
WHERE id = 1;
```

**Phases**:
1. **Phase 1** (Days 1-7): Data collection, accuracy 40-50%
2. **Phase 2** (Days 8-21): Pattern recognition, accuracy 50-60%
3. **Phase 3** (Days 22+): Mature predictions, accuracy 55-70%

### 12. Data Quality Score
**Definition**: Completeness of player data (0-100)

**SQL**:
```sql
SELECT
  AVG(data_quality_score) as avg_quality,
  COUNT(CASE WHEN player1_data_available AND player2_data_available THEN 1 END) as both_known,
  COUNT(*) as total
FROM predictions
WHERE prediction_date >= CURRENT_DATE - INTERVAL '7 days';
```

**Target**:
- >80: Excellent data
- 60-80: Good data
- <60: Limited data

### 13. Pinecone Record Growth
**Definition**: Vector database size (historical matches)

**SQL**:
```sql
SELECT
  pinecone_record_count as total_records,
  pinecone_record_count / NULLIF(days_operated, 0) as avg_daily_growth
FROM system_metadata
WHERE id = 1;
```

**Expected Growth**: 10-50 records/day

---

## 💰 Business Intelligence Metrics

### 14. High-Confidence ROI
**Definition**: Success rate of high-confidence predictions

**SQL**:
```sql
SELECT
  COUNT(*) as high_conf_predictions,
  SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) as correct,
  ROUND(
    100.0 * SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) / COUNT(*), 2
  ) as accuracy,
  -- Simulated ROI (assuming 1 unit bet per prediction)
  SUM(CASE
    WHEN prediction_correct AND predicted_winner = player1 THEN odds_player1 - 1
    WHEN prediction_correct AND predicted_winner = player2 THEN odds_player2 - 1
    ELSE -1
  END) as simulated_roi
FROM predictions
WHERE confidence_score >= 65
  AND actual_winner IS NOT NULL;
```

**Target**: Positive ROI

### 15. Confidence Calibration
**Definition**: Are confidence scores realistic?

**SQL**:
```sql
SELECT
  FLOOR(confidence_score / 10) * 10 as confidence_bucket,
  COUNT(*) as predictions,
  ROUND(
    100.0 * SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) / COUNT(*), 2
  ) as actual_accuracy
FROM predictions
WHERE actual_winner IS NOT NULL
GROUP BY FLOOR(confidence_score / 10)
ORDER BY confidence_bucket DESC;
```

**Well-Calibrated**: actual_accuracy ≈ confidence_bucket

---

## 🏆 Tournament-Specific Metrics

### 16. Accuracy by Tournament Type
**SQL**:
```sql
SELECT
  tournament,
  COUNT(*) as predictions,
  ROUND(
    100.0 * SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) / COUNT(*), 2
  ) as accuracy
FROM predictions
WHERE actual_winner IS NOT NULL
GROUP BY tournament
HAVING COUNT(*) >= 10
ORDER BY accuracy DESC;
```

**Insight**: Identify which tournaments AI predicts best

### 17. Surface Performance
**SQL**:
```sql
SELECT
  surface,
  COUNT(*) as predictions,
  ROUND(
    100.0 * SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) / COUNT(*), 2
  ) as accuracy
FROM predictions
WHERE actual_winner IS NOT NULL
GROUP BY surface
ORDER BY accuracy DESC;
```

**Expected**: Hard court easiest, grass court hardest

---

## 📉 Risk Metrics

### 18. Consecutive Losses
**Definition**: Longest losing streak

**SQL**:
```sql
WITH streaks AS (
  SELECT
    prediction_date,
    prediction_correct,
    SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END)
      OVER (ORDER BY prediction_date) as streak_group
  FROM predictions
  WHERE actual_winner IS NOT NULL
  ORDER BY prediction_date
)
SELECT
  MAX(streak_length) as max_losing_streak
FROM (
  SELECT
    streak_group,
    COUNT(*) as streak_length
  FROM streaks
  WHERE NOT prediction_correct
  GROUP BY streak_group
) sub;
```

**Alert**: If >10 consecutive losses

### 19. Volatility Score
**Definition**: Consistency of predictions over time

**SQL**:
```sql
SELECT
  STDDEV(daily_accuracy) as accuracy_volatility
FROM prediction_accuracy
WHERE date >= CURRENT_DATE - INTERVAL '30 days';
```

**Target**: <10 (more stable = better)

---

## 🔔 Alert Thresholds

Set up alerts in Metabase for:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Overall Accuracy | <50% for 3+ days | Review system |
| High-Conf Accuracy | <60% | Adjust confidence scoring |
| Data Quality | <70% | Improve data collection |
| Daily Predictions | <5 | Check scraper |
| Consecutive Losses | >10 | Pause predictions |
| Pinecone Growth | 0 for 2+ days | Check upload workflow |

---

## 📊 Recommended KPI Dashboard

**Top-Level Metrics** (refresh every hour):
1. Overall Accuracy (current)
2. Today's Predictions (count)
3. High-Confidence Accuracy (last 7 days)
4. Learning Phase & Days Operated

**Charts**:
1. 30-day accuracy trend (line)
2. Confidence distribution (pie)
3. Predictions by surface (bar)
4. Top 10 players by performance (table)

---

## 🎯 Success Criteria

**Week 1 (Data Collection)**:
- [ ] 50+ total predictions
- [ ] 40%+ overall accuracy
- [ ] 500+ Pinecone records

**Week 2-3 (Pattern Recognition)**:
- [ ] 100+ total predictions
- [ ] 50%+ overall accuracy
- [ ] 60%+ high-confidence accuracy
- [ ] 1000+ Pinecone records

**Week 4+ (Mature System)**:
- [ ] 200+ total predictions
- [ ] 55%+ overall accuracy
- [ ] 65%+ high-confidence accuracy
- [ ] Positive simulated ROI
- [ ] <15% accuracy volatility

---

## 🔍 Advanced Analytics

### Cohort Analysis
Track prediction accuracy by player experience level, tournament round, time of day, etc.

### A/B Testing
Compare different AI models or confidence thresholds

### Survival Analysis
Player longevity in tournaments based on AI predictions

### Network Analysis
Player matchup patterns and rivalry predictions

---

## 📚 Resources

- **SQL Cookbook**: See DASHBOARDS.md for ready-to-use queries
- **Database Schema**: See ../database/schema.sql
- **Metabase Docs**: https://www.metabase.com/docs/latest/
- **Statistics Guide**: Understand confidence intervals and p-values

---

## 💡 Pro Tips

1. **Always filter WHERE actual_winner IS NOT NULL** for accuracy metrics
2. **Use rolling averages** (7-day, 30-day) for trend analysis
3. **Segment by confidence level** for better insights
4. **Track both volume AND accuracy** - high accuracy with low volume isn't useful
5. **Monitor data quality** - garbage in, garbage out
6. **Compare to baseline** - betting odds are your benchmark
7. **Track over time** - single-day metrics can be misleading

---

_Last Updated: 2025-11-06_
