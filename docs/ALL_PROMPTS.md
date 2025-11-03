# All AI Prompts Used in Tennis Prediction System

This document contains all prompts used in the n8n workflows for the tennis prediction system.

## Table of Contents
1. [Morning Workflow - AI Match Analysis](#morning-workflow---ai-match-analysis)
2. [Morning Workflow - Learning Insights Summarization](#morning-workflow---learning-insights-summarization)
3. [Evening Workflow - Learning Analysis](#evening-workflow---learning-analysis)

---

## Morning Workflow - AI Match Analysis

**Used in**: `morning phase v1.9 - optimized.json` → `AI node`

**Purpose**: Analyzes individual tennis matches using available data to generate predictions

### System Prompt
```
You are a tennis prediction expert. Analyze matches and provide structured predictions in JSON format. For cold-start scenarios (Day 0), rely primarily on odds and general tennis knowledge.
```

### Main Analysis Prompt
```
=  TOURNAMENT: {{ $json.tournament }}
  SURFACE: {{ $json.surface }}
  PLAYER 1: {{ $json.player1.name }} ({{ $json.player1.nationality }}) - Odds: {{ $json.player1.odds }}
  PLAYER 2: {{ $json.player2.name }} ({{ $json.player2.nationality }}) - Odds: {{ $json.player2.odds }}

  Odds Analysis:
  - {{ $json.player1.name }} implied probability: {{ $json.odds_analysis.player1_implied_prob }}%
  - {{ $json.player2.name }} implied probability: {{ $json.odds_analysis.player2_implied_prob }}%
  - Favorite: {{ $json.odds_analysis.favorite }}

  SYSTEM STATUS:
  - Days operated: {{ $json.system.days_operated }}
  - Learning phase: {{ $json.system.learning_phase }}
  - Data quality score: {{ $json.system.data_quality_score }}/100
  - Max confidence allowed: {{ $json.system.max_confidence }}%

  DATA AVAILABLE:
  - Player 1 stats: {{ $json.player1.has_stats }}
  - Player 2 stats: {{ $json.player2.has_stats }}
  - Similar historical matches: {{ $json.has_similar_matches }}

  PLAYER 1 ({{ $json.player1.name }}) STATS:
  {{ $json.player1.has_stats ? JSON.stringify($json.player1.stats, null, 2) : 'NO HISTORICAL DATA AVAILABLE' }}

  PLAYER 2 ({{ $json.player2.name }}) STATS:
  {{ $json.player2.has_stats ? JSON.stringify($json.player2.stats, null, 2) : 'NO HISTORICAL DATA AVAILABLE' }}

  SIMILAR HISTORICAL MATCHES:
  {{ $json.has_similar_matches ? JSON.stringify($json.similar_matches, null, 2) : 'No similar historical matches found' }}

  LEARNING INSIGHTS (general patterns from last 14 days):
  {{ $json.learning_insights.has_insights ? 'Patterns: ' + $json.learning_insights.relevant_patterns.join('; ') + (($json.learning_insights.confidence_adjustments && $json.learning_insights.confidence_adjustments.length > 0) ? '\nAdjustments: ' + $json.learning_insights.confidence_adjustments.join('; ') : '') + '\n\nNOTE: Player stats have been pre-adjusted based on learned signal weights (' + $json.learning_insights.signal_boosts.join(', ') + ')' : 'No learning insights available yet' }}

  INSTRUCTIONS:
  1. Analyze the match using ALL available data
  2. Note that if learning insights are present, player stats have been PRE-ADJUSTED (boosted) based on discovered patterns. Use these adjusted values directly.
  3. If player stats are available (has_stats: true), USE THEM HEAVILY in your analysis:
     - Compare win rates, especially surface-specific (win_rate_surface)
     - Analyze recent form (recent_form) and momentum (momentum_score)
     - Consider giant killer scores (giant_killer_score = ability to beat favorites)
     - Factor in performance vs favorites (vs_favorites_rate) based on current odds
  4. If similar_matches data is present, learn from historical patterns:
     - Look at match_summary for context
     - Note upset patterns (was_upset: true/false)
     - Compare odds ranges to current match
  5. If data quality < 30, rely more heavily on odds
  6. Your confidence MUST NOT exceed {{ $json.system.max_confidence }}%

  Respond with ONLY a JSON object in this exact format (no markdown, no code blocks). Important: DO NOT put anything else in the predicted_winner field other than the player name. no nationality, just the player name:
  {
    "predicted_winner": "player name",
    "confidence_score": 0.50,
    "reasoning": "brief explanation using available data",
    "risk_assessment": "low/medium/high",
    "value_bet": true/false,
    "recommended_action": "bet/skip/monitor"
  }
```

**Expected Output Format**:
```json
{
  "predicted_winner": "player name",
  "confidence_score": 0.50,
  "reasoning": "brief explanation using available data",
  "risk_assessment": "low/medium/high",
  "value_bet": true/false,
  "recommended_action": "bet/skip/monitor"
}
```

**Key Features**:
- Dynamic confidence limits based on learning phase (60% → 75% → 100%)
- Integration of historical player statistics
- Similar match pattern analysis via Pinecone
- Learning insights application with signal boosting
- Risk assessment and betting recommendations

---

## Morning Workflow - Learning Insights Summarization

**Used in**: `morning phase v1.9 - optimized.json` → `Summarize Learning Insights`

**Purpose**: Processes 14-day learning log data to extract actionable patterns for current predictions

### System Prompt
```
You are a concise tennis prediction pattern analyst. Focus on general insights that apply broadly to many matches.
```

### Learning Analysis Prompt
```
=Learning Insights from Last 14 Days:
{{ JSON.stringify($input.all().map(item => ({
  type: item.json.learning_type,
  description: item.json.description,
  impact: item.json.impact_score,
  data: item.json.learning_data
})), null, 2) }}

Task: Summarize these learning insights into a concise, actionable summary for tennis match predictions.

Focus on:
1. **Key Patterns**: What general patterns have we discovered? (e.g., "Giant killers perform better on clay")
2. **Signal Boosts**: Which player stats should be amplified in predictions? (e.g., "boost giant_killer_score", "boost surface_specialist")
3. **Confidence Rules**: Any caps or adjustments to confidence scores? (e.g., "Cap ITF tournaments at 60%")

Output Format (JSON):
{
  "relevant_patterns": [
    "Pattern 1 (max 100 chars)",
    "Pattern 2 (max 100 chars)",
    "Pattern 3 (max 100 chars)"
  ],
  "signal_boosts": [
    "boost giant_killer",
    "boost surface_specialist"
  ],
  "confidence_adjustments": [
    "Cap ITF at 60%",
    "Reduce confidence for returning players"
  ]
}

Guidelines:
- Be concise (max 100 chars per insight)
- Focus on GENERAL insights that apply to MANY matches
- Don't include match-specific details (players, specific tournaments)
- Prioritize high-impact insights
- Limit to top 5 patterns, top 3 boosts, top 3 adjustments
- If no insights, return empty arrays

Return ONLY the JSON object, no additional text.
```

**Expected Output Format**:
```json
{
  "relevant_patterns": [
    "Pattern 1 (max 100 chars)",
    "Pattern 2 (max 100 chars)",
    "Pattern 3 (max 100 chars)"
  ],
  "signal_boosts": [
    "boost giant_killer",
    "boost surface_specialist"
  ],
  "confidence_adjustments": [
    "Cap ITF at 60%",
    "Reduce confidence for returning players"
  ]
}
```

**Key Features**:
- Pattern discovery from historical failures
- Signal boosting recommendations for player statistics
- Confidence calibration rules
- Maximum 100-character insights for clarity
- Focus on generalizable patterns

---

## Evening Workflow - Learning Analysis

**Used in**: `evening routine v2.2.json` → `LLM Learning Analysis`

**Purpose**: Analyzes failed predictions to discover systematic errors and improvement opportunities

### System Prompt
```
You are an expert tennis prediction analyst. Analyze failed predictions to identify patterns, systematic errors, and improvement opportunities. Always respond with valid JSON only.
```

### Failed Prediction Analysis Prompt
```
=Analyze today's failed predictions and identify learning opportunities.

  Failed Predictions:
  {{ JSON.stringify($('Get Failed Predictions').all().map(item => item.json), null, 2) }}

  Daily Stats:
  {{ JSON.stringify($('Calculate Daily Stats').item.json, null, 2) }}

  Respond with JSON in this exact format:
  {
    "summary": "Brief 2-3 sentence summary of today's performance",
    "key_failures": [
      {
        "prediction_id": 123,
        "failure_reason": "Why this prediction failed",
        "learning": "What we learned",
        "impact_score": 8
      }
    ],
    "patterns_discovered": [
      {
        "pattern_type": "surface_specialist | giant_killer | odds_bias | other",
        "description": "Pattern description",
        "affected_predictions": [123, 456],
        "recommendation": "How to adjust future predictions"
      }
    ],
    "confidence_calibration": {
      "high_confidence_analysis": "Analysis of 60%+ confidence predictions",
      "recommended_adjustment": "Increase/Decrease confidence by X% for Y scenarios"
    },
    "action_items": [
      "Specific actionable improvement for future predictions"
    ]
  }
```

**Expected Output Format**:
```json
{
  "summary": "Brief 2-3 sentence summary of today's performance",
  "key_failures": [
    {
      "prediction_id": 123,
      "failure_reason": "Why this prediction failed",
      "learning": "What we learned",
      "impact_score": 8
    }
  ],
  "patterns_discovered": [
    {
      "pattern_type": "surface_specialist | giant_killer | odds_bias | other",
      "description": "Pattern description",
      "affected_predictions": [123, 456],
      "recommendation": "How to adjust future predictions"
    }
  ],
  "confidence_calibration": {
    "high_confidence_analysis": "Analysis of 60%+ confidence predictions",
    "recommended_adjustment": "Increase/Decrease confidence by X% for Y scenarios"
  },
  "action_items": [
    "Specific actionable improvement for future predictions"
  ]
}
```

**Key Features**:
- Failed prediction analysis
- Pattern type categorization (surface_specialist, giant_killer, odds_bias, other)
- Confidence calibration recommendations
- Actionable improvement items
- Impact scoring for prioritization

---

## Summary

The tennis prediction system uses **3 main AI prompts** across **2 workflows**:

1. **Morning Workflow**: 
   - Match analysis for predictions
   - Learning insights summarization

2. **Evening Workflow**: 
   - Failed prediction learning analysis

### Key AI Integration Points:
- **OpenAI/Gemini LLM** for sophisticated reasoning
- **Dynamic confidence scaling** based on system learning phase
- **Pattern discovery** from prediction accuracy tracking
- **Signal boosting** for enhanced player statistics
- **Vector similarity matching** via Pinecone integration

### Data Flow:
1. **Morning**: Raw match data → AI analysis → Predictions → Database storage
2. **Evening**: Match results → Validation → Learning analysis → Pattern discovery
3. **Continuous**: 14-day learning insights → Morning predictions (enhanced with discovered patterns)

This multi-prompt system enables sophisticated AI-powered tennis predictions with continuous learning and improvement capabilities.
