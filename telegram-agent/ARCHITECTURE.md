# Architecture: Tennis Telegram AI Agent

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     TELEGRAM USER                           │
│                   (Your Telegram Chat)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ Message
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT API                         │
│                  (Telegram Servers)                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              telegram-bot.js (Node.js)                      │
│         ┌──────────────────────────────────────┐           │
│         │  Message Handler                     │           │
│         │  - Receives Telegram messages        │           │
│         │  - Sends typing indicator            │           │
│         │  - Calls Claude agent                │           │
│         └────────────┬─────────────────────────┘           │
└──────────────────────┼────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│           Claude Agent (Anthropic API)                      │
│         ┌──────────────────────────────────────┐           │
│         │  Natural Language Understanding      │           │
│         │  - Parses user intent                │           │
│         │  - Selects appropriate tools         │           │
│         │  - Agentic loop for multi-step ops   │           │
│         └─────────────┬────────────────────────┘           │
└──────────────────────┼────────────────────────────────────────┘
                       │ Tool Calls
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
  │ Database    │ │ Perplexity  │ │ Gemini LLM   │
  │ Queries     │ │ API         │ │ API          │
  │ (PostgreSQL)│ │ (Web Search)│ │ (Analysis)   │
  └─────────────┘ └─────────────┘ └──────────────┘
        │              │              │
        ↓              ↓              ↓
  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
  │ Neon DB     │ │ Perplexity  │ │ Google Cloud │
  │ Tennis Data │ │ Servers     │ │ Gemini API   │
  └─────────────┘ └─────────────┘ └──────────────┘
```

## Component Details

### 1. **Telegram Bot (telegram-bot.js)**

The entry point for user interactions.

**Key Responsibilities:**
- Listen for messages via Telegram Bot API (polling)
- Create Claude agent with tool definitions
- Manage agentic loop for multi-turn conversations
- Handle tool execution results
- Format responses and send back to Telegram
- Handle message length limits (4096 chars)

**Flow:**
```
Message Received
    ↓
Send "typing..." indicator
    ↓
Call Claude with tools + message
    ↓
Claude returns tool calls or text?
    ├─ Tool calls → Execute tools → Add results to message history
    ├─ Repeat until final response
    └─ Text response → Format and send to Telegram
    ↓
Response sent
```

### 2. **Claude Agent Loop**

Claude handles the intelligence and decision-making.

**System Prompt Behavior:**
```
"You are a helpful tennis prediction assistant that helps users
query predictions and analyze matchups. You have access to a
database of tennis predictions and can use AI analysis tools."
```

**Decision Making:**
- Parses natural language: "Give me all 'bet' predictions with odds >1.5"
- Selects best tool: `get_predictions` with filters
- Constructs tool input: `{ action: "bet", min_odds: 1.5 }`
- Interprets results and formats response

**Tool Selection Examples:**
```
User: "Show me value bets for today"
→ Claude selects: get_value_bets
  input: { limit: 10, date: null }

User: "How's our accuracy on Australian Open?"
→ Claude selects: get_tournament_stats
  input: { tournament: "Australian Open", days: 30 }

User: "Analyze Nadal vs Djokovic head-to-head"
→ Claude selects: analyze_matchup
  input: { player1: "Nadal", player2: "Djokovic",
           focus: "head-to-head", llm: "perplexity" }
```

### 3. **Database Tools (in mcp-server.js)**

Direct access to your tennis prediction database.

**Available Tools:**

#### get_predictions
Retrieves predictions with flexible filtering.
```sql
SELECT p.*, lm.* FROM predictions p
LEFT JOIN live_matches lm ON p.match_id = lm.match_id
WHERE p.prediction_day = CURRENT_DATE
  AND p.recommended_action = 'bet'
  AND p.confidence_score >= 60
  AND p.odds > 1.5
```

**Tool Input Schema:**
```json
{
  "action": "bet|monitor|skip",
  "min_odds": 1.5,
  "min_confidence": 60,
  "date": "2024-11-12",
  "tournament": "Australian Open",
  "surface": "hard|clay|grass",
  "limit": 20
}
```

#### get_value_bets
Finds predictions with favorable odds relative to confidence.
```sql
SELECT * FROM predictions
WHERE value_bet = true
AND prediction_day = CURRENT_DATE
```

#### get_tournament_stats
Calculates tournament performance metrics.
```sql
SELECT
  COUNT(*) as total_predictions,
  COUNT(CASE WHEN value_bet THEN 1 END) as value_bets,
  AVG(confidence_score) as avg_confidence,
  COUNT(CASE WHEN prediction_correct THEN 1 END) /
    COUNT(CASE WHEN prediction_correct IS NOT NULL THEN 1 END) * 100
    as accuracy
FROM predictions
WHERE tournament ILIKE 'Australian%'
```

#### analyze_matchup
Calls external LLM for detailed analysis.

**Inputs:**
```json
{
  "player1": "Djokovic",
  "player2": "Sinner",
  "llm": "perplexity|gemini",
  "focus": "head-to-head|recent-form|surface-preference"
}
```

**Example LLM Query:**
```
"Analyze the tennis matchup between Djokovic and Sinner.
Focus on recent-form. Provide insights on their playing style,
recent form, head-to-head record, and prediction."
```

### 4. **External APIs**

#### Perplexity API
- **Purpose**: Web-search-based AI analysis
- **Model**: pplx-70b-online
- **Cost**: Free tier + paid
- **Usage**: Real-time matchup analysis with current info

**Example:**
```javascript
POST https://api.perplexity.ai/chat/completions
{
  "model": "pplx-70b-online",
  "messages": [{
    "role": "user",
    "content": "Analyze Djokovic vs Sinner matchup"
  }]
}
```

#### Gemini API
- **Purpose**: Alternative LLM for analysis
- **Model**: gemini-pro
- **Cost**: Free tier + paid
- **Usage**: Detailed analysis without web search

**Example:**
```javascript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
{
  "contents": [{
    "parts": [{ "text": "Analyze Djokovic vs Sinner matchup" }]
  }]
}
```

### 5. **Data Flow Example**

**User Query:** "Give me all 'bet' predictions with odds >1.5"

```
1. Telegram Message Received
   User: "Give me all 'bet' predictions with odds >1.5"

2. telegram-bot.js processes
   → Sends typing indicator
   → Calls Claude.messages.create() with tools

3. Claude Agent
   → Understands: user wants filtered predictions
   → Selects tool: get_predictions
   → Creates input: {
       action: "bet",
       min_odds: 1.5,
       limit: 20
     }
   → Return type: tool_use

4. telegram-bot.js executes tool
   → Calls executeTool("get_predictions", {...})
   → Queries database with filters
   → Returns formatted results

5. Claude continues (agentic loop)
   → Receives tool results
   → Formats response for Telegram
   → Return type: text (stop_reason = "end_turn")

6. telegram-bot.js sends response
   → Formats markdown
   → Handles message length
   → Sends to Telegram

7. User sees in Telegram
   "Found 8 predictions:

   1. Djokovic vs Sinner
      Australian Open • Hard
      Djokovic @ 1.65 (72%)
      Action: bet • ✓ Value Bet"
```

## Tool Execution Details

### Database Tool Execution

```javascript
// In telegram-bot.js executeTool()
async function executeTool(toolName, toolInput) {
  const pool = new Pool({ connectionString: DATABASE_URL });

  switch(toolName) {
    case "get_predictions":
      // Build dynamic query based on filters
      let query = "SELECT ... FROM predictions p LEFT JOIN live_matches lm";
      let params = [];

      if (toolInput.action) query += " AND p.recommended_action = $N";
      if (toolInput.min_odds) filter after fetch (calculated field);
      if (toolInput.min_confidence) query += " AND p.confidence_score >= $N";
      // ... more filters

      const result = await pool.query(query, params);

      // Format results for readability
      return formatPredictionsTable(result.rows);
  }
}
```

### LLM Tool Execution

```javascript
case "analyze_matchup":
  const query = `Analyze the tennis matchup between ${player1} and ${player2}...`;

  if (llm === "perplexity") {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "pplx-70b-online",
        messages: [{ role: "user", content: query }],
        temperature: 0.7,
        max_tokens: 1000
      }
    );
    return response.data.choices[0].message.content;
  }
```

## Environment Variables

```env
# Required
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...  # BotFather
DATABASE_URL=postgresql://...         # Neon DB
ANTHROPIC_API_KEY=sk-ant-...          # Claude API

# Optional (for LLM analysis)
PERPLEXITY_API_KEY=pplx-...          # Web search analysis
GOOGLE_API_KEY=AIzaSy...              # Gemini analysis

# Optional (config)
NODE_ENV=production                   # App environment
```

## Error Handling

**At each layer:**

1. **Message Reception**
   - Invalid messages ignored
   - Malformed JSON handled gracefully

2. **Claude Agent**
   - Tool execution errors caught
   - Return error content in response
   - Agent can retry with different tool

3. **Database**
   - Connection errors caught
   - Pool cleanup on error
   - Partial results handled

4. **External APIs**
   - Timeout handling (30s default)
   - API key validation on startup
   - Graceful degradation (Perplexity optional)

5. **Response**
   - Message length limit (4096 chars)
   - Auto-split long responses
   - Markdown formatting errors handled

## Performance Considerations

**Database Queries:**
- Most queries use indexed columns (prediction_day, recommended_action)
- LEFT JOIN with live_matches efficient with proper indexes
- Results limited to prevent memory issues

**LLM Calls:**
- Perplexity web search: 2-5 seconds
- Gemini direct: 1-3 seconds
- Claude agent: 1-2 seconds per turn
- Total response time: 3-8 seconds typical

**API Limits:**
- Telegram: Unlimited messages
- Anthropic: Rate limited (depends on plan)
- Perplexity: Free tier has limits
- Google/Gemini: Free tier has limits

## Scaling

**For high volume:**

1. **Connection pooling**
   - Currently: Single pool per bot
   - Max connections: 20 (default)

2. **Caching**
   - Add Redis for frequent queries
   - Cache tournament stats (updates daily)
   - Cache analysis results (expire in 1 hour)

3. **Webhook instead of polling**
   - Current: Polling (simpler)
   - Alternative: Webhook (faster responses)

4. **Distributed bot**
   - Multiple bot instances
   - Load balance on Telegram webhook

## Security

**API Keys:**
- Stored in environment variables only
- Never logged or committed
- Rotated regularly in production

**Database:**
- Connection string in environment
- Parameterized queries (SQL injection prevention)
- Row-level security possible with roles

**Telegram:**
- Token kept secret
- Only authenticated bot can receive messages
- No user authentication needed (Telegram handles it)

## Testing

**test-queries.js validates:**
- Database connectivity
- Each tool function
- LLM API availability
- Sample queries work

**Run:**
```bash
node test-queries.js
```

**Output:**
```
✓ Get Predictions
✓ Get Value Bets
✓ Tournament Stats
✓ Live Matches
✓ Perplexity API (optional)
✓ Gemini API (optional)

✨ System ready for Telegram bot deployment!
```

## Files Breakdown

| File | Lines | Purpose |
|------|-------|---------|
| telegram-bot.js | ~350 | Main bot, message handling, agentic loop |
| mcp-server.js | ~450 | Tool implementations, database queries |
| package.json | 20 | Dependencies |
| test-queries.js | ~300 | System validation |
| README.md | ~300 | User documentation |
| QUICK_START.md | ~200 | Quick setup guide |
| DEPLOYMENT.md | ~300 | Production deployment |
| ARCHITECTURE.md | This file | System design |

## Summary

**Key Insight:**
The bot acts as a **natural language interface** to your tennis prediction system. Instead of writing SQL or API calls, users can casually chat on Telegram. Claude's agent capabilities understand intent, select the right tools, and orchestrate the conversation—making complex queries feel natural.

**The magic is:**
```
Natural Language → Claude Agent → Tool Selection → Data Access → Formatted Response
```

Simple yet powerful. 🚀
