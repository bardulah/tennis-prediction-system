# 🚀 Quick Start Guide

Get your Telegram AI agent running in 5 minutes!

## Step 1: Create a Telegram Bot (2 min)

1. Open Telegram → Search for **@BotFather**
2. Send `/newbot`
3. Follow the prompts:
   - Name: "Tennis Prediction Agent" (or whatever you want)
   - Username: "tennis_bot_12345" (must be unique, end with `_bot`)
4. Copy the token you receive (looks like: `123456:ABC-DEF...`)

## Step 2: Prepare API Keys (2 min)

You'll need:
- **Anthropic (Claude)**: Get from [console.anthropic.com](https://console.anthropic.com) - Required ⭐
- **Perplexity**: Get from [perplexity.ai/api](https://perplexity.ai/api) - Optional (for web search)
- **Google (Gemini)**: Get from [console.cloud.google.com](https://console.cloud.google.com) - Optional

> Don't have these yet? Start without them and add later!

## Step 3: Setup (1 min)

```bash
cd telegram-agent

# Copy example config
cp .env.example .env

# Edit with your credentials
nano .env  # or use your editor
```

Fill in:
```env
TELEGRAM_BOT_TOKEN=your_token_from_botfather
DATABASE_URL=your_neon_db_url (should already be set)
ANTHROPIC_API_KEY=your_claude_key
# Optional:
# PERPLEXITY_API_KEY=your_perplexity_key
# GOOGLE_API_KEY=your_google_key
```

## Step 4: Run! (1 sec)

```bash
npm start
```

You should see:
```
✓ Bot is running and listening for messages
```

## Step 5: Test It!

Open Telegram, find your bot, and try:

```
"Give me all predictions with action 'bet' and odds >1.5"
```

**That's it!** 🎉

## Common Queries to Try

### Get Predictions
- "Show me today's predictions"
- "Give me all 'bet' predictions for today"
- "What predictions have >70% confidence?"
- "Show predictions for clay courts"

### Analyze Matches
- "Analyze Djokovic vs Alcaraz"
- "Compare Nadal vs Federer on clay"
- "Who should win between Serena and Venus?"

### Get Stats
- "How's our accuracy on the Australian Open?"
- "Show me value bets for today"
- "What's our prediction accuracy rate?"

## Troubleshooting

### "Bot is not responding"
✓ Check bot is running: See `npm start` output
✓ Check token is correct: Copy from BotFather again
✓ Check internet: Should have connectivity

### "Bot found but error occurs"
✓ Check `.env` file: All required keys present?
✓ Check database: `DATABASE_URL` correct?
✓ Check logs: Run with `npm run dev` for verbose output

### "Database connection failed"
✓ Copy `DATABASE_URL` from your Neon dashboard
✓ Ensure you're not missing this value in `.env`

## Next Steps

### Want Better Analysis?
Add Perplexity API key for real-time web search in matchup analysis:
1. Get key from [perplexity.ai](https://perplexity.ai/api)
2. Add to `.env`: `PERPLEXITY_API_KEY=pplx-...`
3. Restart bot: `Ctrl+C` then `npm start`
4. Try: "Analyze Sinner vs Alcaraz" 🔍

### Want to Deploy 24/7?
See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Linux systemd service
- Docker deployment
- Heroku/Railway/DigitalOcean

### Want More Features?
See [README.md](./README.md) for:
- All available tools
- Architecture details
- Security best practices

## Architecture at a Glance

```
Your Message
    ↓
Telegram Bot (Node.js)
    ↓
Claude AI Agent
    ├─ Understands your question
    ├─ Picks the right tool
    └─ Executes: Query database OR Call LLM
    ↓
Your Answer
    ↓
Telegram
```

## API Costs

- **Claude**: ~$0.01 per message (very cheap)
- **Perplexity**: Free tier available
- **Gemini**: Free tier available
- **Telegram**: Completely free

Budget estimate: **<$1/month** with moderate usage

## Files Created

```
telegram-agent/
├── telegram-bot.js      # Main bot file
├── mcp-server.js        # Tool implementations
├── package.json         # Dependencies
├── .env                 # Your secrets (DON'T COMMIT!)
├── .env.example         # Template
├── .gitignore           # Git ignore rules
├── README.md            # Full documentation
├── DEPLOYMENT.md        # Deployment guide
├── test-queries.js      # Test your setup
└── QUICK_START.md       # This file!
```

## Commands

```bash
# Start bot
npm start

# Development mode (with logs)
npm run dev

# Test your setup
node test-queries.js

# View bot logs (if running as service)
journalctl -u tennis-telegram-bot -f
```

## Need Help?

1. Check [README.md](./README.md) for detailed docs
2. Review logs: `npm run dev` shows everything
3. Test queries: `node test-queries.js` validates setup
4. See [DEPLOYMENT.md](./DEPLOYMENT.md) for production issues

---

**Congratulations! You now have an AI agent in Telegram!** 🤖

Happy querying! 📊
