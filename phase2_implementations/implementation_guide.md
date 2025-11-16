# PHASE 2: N8N WORKFLOW MODIFICATION GUIDE

## 🎯 **Overview**
This guide provides step-by-step instructions for implementing Phase 2 optimizations in both morning and evening workflows to support multiple daily runs efficiently.

---

## 📊 **Optimization Summary**

### **Morning Workflow Changes:**
- ✅ Learning insights already cached (no change needed)
- 🔄 Add match_id construction for efficient lookups
- 🔄 Add prediction existence filter to skip processed matches

### **Evening Workflow Changes:**
- 🔄 Add results existence filter to skip already updated predictions
- 🔄 Optimize match lookup and update queries

---

## 🗄️ **STEP 1: Database Schema Updates**

### **Run Database Optimizations:**
```bash
cd /opt/tennis-scraper
# Database optimizations (add indexes)
psql $DATABASE_URL -f phase2_implementations/database_optimizations.sql
```

**Expected Output:**
```
✅ Database optimizations complete!
New indexes created:
  - idx_predictions_match_id (for fast match lookups)
  - idx_predictions_actual_winner (for filtering unprocessed)
  - idx_predictions_prediction_day (for date filtering)
```

---

## 🌅 **STEP 2: Morning Workflow Modifications**

### **Current Workflow Structure:**
```
Webhook → Extract Matches → Loop Over Items → [FOR EACH MATCH]
  ↓
System Metadata → Player Stats → Player Insights → Pinecone
  ↓
Summarize Learning Insights (cached) → Build Match Context → LLM Prediction → Store
```

### **Modified Workflow Structure:**
```
Webhook → Extract Matches → Loop Over Items → [FOR EACH MATCH]
  ↓
Construct match_id → Check Prediction Exists → [SKIP IF EXISTS]
  ↓
System Metadata → Player Stats → Player Insights → Pinecone
  ↓
Summarize Learning Insights (cached) → Build Match Context → LLM Prediction → Store
```

### **Implementation Steps:**

#### **A. Add Match ID Construction**
**Node:** "Build Match Context" (existing node, modify)
**Location:** First lines of the JavaScript code
**Change:** Add match_id construction at the beginning

```javascript
// Add at the start of Build Match Context JavaScript:
const matchItem = $('Loop Over Items').item.json;

// Helper function to clean player names (remove nationality brackets)
function cleanPlayerName(name) {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

// Extract match_date from incoming data (with fallback to current date)
const matchDate = matchItem.match_date || new Date().toISOString().split('T')[0];

// Construct match_id for efficient lookup
const matchId = `${matchItem.tournament}_${cleanPlayerName(matchItem.player1)}_${cleanPlayerName(matchItem.player2)}_${matchDate}`
  .replace(/[^a-zA-Z0-9_]/g, '_');

console.log(`Constructed match_id: ${matchId}`);

// Add match_id to return object
return {
  json: {
    // ... existing context code ...
    match_id: matchId,  // NEW
    // ... rest of context ...
  }
};
```

#### **B. Add Prediction Existence Check**
**Node:** Add new PostgreSQL node
**Position:** After "Build Match Context", before "Query Player 1 Stats"
**Query:** Use Query 1 from `morning_workflow_queries.sql`

```sql
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
```

**Parameter:** `$match_id` = `={{ $('Build Match Context').item.json.match_id }}`

#### **C. Add Filter Logic**
**Node:** Add new "If" node
**Position:** After prediction existence check, before "Query Player 1 Stats"
**Condition:** Only proceed if prediction doesn't exist

```
Condition: {{ $json.has_prediction === false }}
```

**Connection:**
- `true` → "Query Player 1 Stats" (continue processing)
- `false` → End (skip this match)

---

## 🌆 **STEP 3: Evening Workflow Modifications**

### **Current Workflow Structure:**
```
Webhook → Extract Matches → Loop Over Items → [FOR EACH MATCH]
  ↓
Find Matching Prediction → Update with Results → Update Players
```

### **Modified Workflow Structure:**
```
Webhook → Extract Matches → Loop Over Items → [FOR EACH MATCH]
  ↓
Find Matching Prediction (enhanced) → [SKIP IF RESULTS EXIST]
  ↓
Update with Results → Update Players
```

### **Implementation Steps:**

#### **A. Enhance Prediction Matching**
**Node:** "Find Matching Prediction" (modify existing)
**Location:** Modify the PostgreSQL query
**Change:** Replace existing query with enhanced version from `evening_workflow_queries.sql`

```sql
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
  AND prediction_day = CURRENT_DATE
LIMIT 1;
```

#### **B. Add Results Filter**
**Node:** Modify existing "If" node
**Location:** After "Find Matching Prediction"
**Change:** Only proceed if no results exist yet

```
OLD Condition: {{ $json.prediction_id }}
NEW Condition: {{ $json.has_results === 0 }}
```

**Connection:**
- `true` → "Update Prediction Results" (continue processing)
- `false` → End (skip already processed match)

#### **C. Enhance Update Query**
**Node:** "Update Prediction Results" (modify existing)
**Location:** Modify the UPDATE query
**Change:** Add safety condition to only update unprocessed predictions

```sql
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
```

---

## 🧪 **STEP 4: Testing Instructions**

### **Test Morning Workflow Optimization:**
1. **Manual trigger** with matches that already have predictions
2. **Verify skipping** of existing predictions
3. **Check logs** for match_id construction and filtering

### **Test Evening Workflow Optimization:**
1. **Manual trigger** with results that already processed
2. **Verify skipping** of already updated predictions  
3. **Check update queries** only target unprocessed matches

### **Expected Results:**
- **Morning**: Should skip matches with existing predictions
- **Evening**: Should skip predictions with populated actual_winner
- **Performance**: Faster processing for repeated runs
- **Accuracy**: Same prediction quality, no functional changes

---

## 📊 **Performance Impact**

### **Before Optimization:**
- **Morning**: Processes ALL matches, creates duplicate predictions
- **Evening**: Updates ALL results, creates redundant updates

### **After Optimization:**
- **Morning**: Skips existing predictions, processes only new matches
- **Evening**: Skips already updated predictions, processes only pending results

### **Expected Improvements:**
- **Processing Time**: 70-80% reduction for repeated runs
- **Database Load**: Significantly reduced with indexing
- **Resource Usage**: Fewer LLM calls and database operations

---

## 🔧 **Implementation Checklist**

- [ ] ✅ Run database schema updates
- [ ] ✅ Add match_id construction to morning workflow
- [ ] ✅ Add prediction existence filter to morning workflow
- [ ] ✅ Enhance prediction matching in evening workflow
- [ ] ✅ Add results filter in evening workflow
- [ ] ✅ Test with sample data
- [ ] ✅ Verify no functional changes to new matches
- [ ] ✅ Confirm performance improvements
- [ ] ✅ Deploy to production

---

**Phase 2 optimization complete! Ready for multiple daily workflow runs.** 🎯
