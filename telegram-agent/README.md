# Tennis Prediction Telegram Agent

An AI-powered Telegram bot that lets you casually chat with an agent to query tennis predictions, analyze matchups, and get insights from your prediction database.

**Status**: ✅ Production Ready - Fully Tested & Deployed

## Features

✨ **Natural Language Queries**
- "Give me all predictions with action 'bet' and odds >1.5 for today"
- "Show me value bets"
- "What are the best value bets today?"
- "Get predictions with at least 80% confidence"

🔍 **Database Tools**
- Get predictions with flexible filters (action, odds, confidence, date, tournament, surface)
- View detailed prediction information
- Get tournament statistics
- Identify value bets

🤖 **LLM Analysis**
- Analyze matchups using Perplexity (with real-time web search)
- Or use Gemini for detailed analysis
- Focus on specific aspects (head-to-head, recent form, surface preference)

📊 **Live Updates**
- Shows match status (not started, live, completed)
- Displays live scores
- Shows actual winners and prediction correctness

🚀 **Agentic Architecture**
- Claude Sonnet 4 (latest model) processes user intent
- Automatically selects and executes appropriate tools
- Handles multi-step interactions
- Generates natural conversational responses

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Telegram account
- Database credentials (Neon PostgreSQL)
- API keys:
  - Anthropic (Claude) - required
  - Perplexity - optional, for web-search-based analysis
  - Google (Gemini) - optional, alternative LLM

### 2. Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Copy your bot token

### 3. Install Dependencies

```bash
cd telegram-agent
npm install
```

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
GOOGLE_API_KEY=AIzaSy...
```

### 5. Start the Bot

```bash
npm start
```

You should see:
```
✓ Bot is running and listening for messages
Telegram API key: 123456789:ABCd...
```

### 6. Chat with Your Agent

Open Telegram and find your bot. Start chatting!

## Example Conversations

### Query Predictions
```
You: Give me all predictions with action 'bet' and odds >1.5 for today

Agent: Found 8 predictions:

1. Djokovic vs Sinner
   Australian Open • Hard
   Djokovic @ 1.65 (72%)
   Action: bet • ✓ Value Bet

2. Swiatek vs Sabalenka
   Australian Open • Hard
   Swiatek @ 2.10 (68%)
   Action: bet

...
```

### Analyze a Matchup
```
You: Analyze Nadal vs Alcaraz matchup, focus on recent form

Agent: *Analysis: Nadal vs Alcaraz* (via perplexity)

Recent form favors Alcaraz significantly. He has won 4 of their last 5 meetings in 2024, including dominant performances on hard courts. Nadal's recent form shows inconsistency, particularly with injury concerns...
```

### Get Value Bets
```
You: Show me today's value bets

Agent: *Value Bets for Today*

1. *Tsitsipas vs Fritz*
   Monte Carlo Masters
   Tsitsipas @ 1.95 (74% confidence)

2. *Krejcikova vs Muchova*
   WTA 1000
   Krejcikova @ 1.62 (69% confidence)

...
```

### Tournament Stats
```
You: How's our accuracy in the Australian Open?

Agent: *Tournament Stats: Australian Open*
*(Last 30 days)*

Total Predictions: 24
Value Bets: 6
Avg Confidence: 68%
Accuracy: 72%
```

## Available Tools

### get_predictions
Query predictions with filters:
- `action`: 'bet', 'monitor', or 'skip'
- `min_odds`: 1.5, 2.0, etc.
- `min_confidence`: 50, 60, 70, etc.
- `date`: 'YYYY-MM-DD' (defaults to today)
- `tournament`: Tournament name
- `surface`: 'hard', 'clay', or 'grass'
- `limit`: Max results (default: 20)

### get_prediction_details
Get full details for a specific prediction:
- Match details with live status
- Odds and confidence
- Current score and actual winner (if completed)
- Prediction correctness

### analyze_matchup
Analyze a tennis matchup using AI:
- `player1`, `player2`: Player names
- `llm`: 'perplexity' (default) or 'gemini'
- `focus`: Optional aspect to focus on

### get_tournament_stats
Get tournament statistics:
- `tournament`: Tournament name
- `days`: Days to look back (default: 30)

### get_value_bets
Get value bet predictions:
- `limit`: Max results (default: 10)
- `date`: Specific date (default: today)

## Architecture

```
Telegram User
    ↓
Telegram Bot API
    ↓
telegram-bot.js (Node.js)
    ↓
Claude Agent (via Anthropic SDK)
    ├─ Tool Execution
    │  ├─ Database Queries (PostgreSQL)
    │  └─ LLM Analysis (Perplexity/Gemini)
    ↓
Response Generation
    ↓
Telegram Response
```

## Troubleshooting

### Bot not responding
1. Check `TELEGRAM_BOT_TOKEN` is correct
2. Ensure bot is running: `npm start`
3. Check logs for errors

### Database connection failed
1. Verify `DATABASE_URL` is correct
2. Check your Neon dashboard for active connections
3. Ensure IP is whitelisted if applicable

### LLM analysis not working
- Perplexity/Gemini are optional - bot works without them
- Check API keys if you want to enable them
- Check API key validity and quota

### Long message not sending
- Telegram has a 4096 character limit per message
- Bot automatically splits long responses
- If still failing, check your internet connection

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| TELEGRAM_BOT_TOKEN | Yes | Telegram bot token from BotFather |
| DATABASE_URL | Yes | PostgreSQL connection string (Neon) |
| ANTHROPIC_API_KEY | Yes | Claude API key |
| PERPLEXITY_API_KEY | Yes | For web-search-based matchup analysis |
| GOOGLE_API_KEY | No | For Gemini LLM analysis (alternative) |
| NODE_ENV | No | 'production' or 'development' |
| PORT | No | Server port (default: 3004) |
| WEBHOOK_URL | No | Webhook URL for webhook mode (e.g., https://telegram.curak.xyz/webhook) |
| TELEGRAM_CHAT_ID | No | Your chat ID for testing |

## Security Notes

- **Never commit `.env` files** with real credentials
- **Use environment variables** for all secrets
- **Restrict bot access** if needed (Telegram doesn't have built-in auth)
- **Log sensitive data carefully** - avoid logging full API keys
- **Rate limit** if needed (add throttling for high-volume usage)

## Future Enhancements

- [ ] User-specific preferences and saved queries
- [ ] Betting slip generation and tracking
- [ ] Push notifications for live matches
- [ ] Custom analysis templates
- [ ] Multi-language support
- [ ] Inline query support for quick lookups
- [ ] Prediction history and ROI tracking

## License

MIT
