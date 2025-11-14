# Tennis Telegram Agent - Architecture Documentation

## System Overview

The Tennis Telegram Agent is a production-ready AI-powered Telegram bot that uses Claude's agentic architecture to process natural language queries and execute database/API operations to retrieve tennis prediction insights.

**Current Status**: ✅ Production Deployed (November 12, 2025)

## Technology Stack

### Core Components
- **Runtime**: Node.js 25.1.0
- **Bot Framework**: node-telegram-bot-api (Webhook mode)
- **LLM**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Database**: PostgreSQL (Neon)
- **Web Server**: Express.js
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt Certbot

### External APIs
- **Anthropic Claude API**: Agent orchestration and conversational AI
- **Perplexity API**: Real-time web search for matchup analysis (sonar model)
- **Telegram Bot API**: Message delivery via webhooks
- **Google Gemini API**: Optional alternative LLM for analysis

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Telegram User                          │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│            Telegram Bot API (Webhooks)                   │
│  setWebhook: https://telegram.curak.xyz/webhook        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  Nginx Reverse Proxy (telegram.curak.xyz:443)           │
│  - SSL/TLS Termination (Let's Encrypt)                  │
│  - Rate Limiting                                         │
│  - Request Validation                                    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  Express.js Webhook Server (localhost:3004)             │
│  - POST /webhook (receives Telegram updates)            │
│  - GET /health (status check)                           │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  Claude Agent (Agentic Loop)                            │
│  - Intent Understanding                                 │
│  - Tool Selection                                        │
│  - Response Generation                                   │
└─────┬──────────────────────┬──────────────────────┬─────┘
      │                      │                      │
      ▼                      ▼                      ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL  │  │ Perplexity API   │  │ Anthropic API    │
│  (Neon)      │  │ (Web Search)      │  │ (Claude)         │
│              │  │                  │  │                  │
│ - Predictions│  │ - Match Analysis │  │ - Tool Calling   │
│ - Tournaments│  │ - Real-time Data │  │ - Orchestration  │
│ - Live Scores│  │ - Web Insights   │  │                  │
└──────────────┘  └──────────────────┘  └──────────────────┘
```

## Request Flow

### 1. Message Reception
User sends message → Telegram API validates → Pushes to webhook (POST https://telegram.curak.xyz/webhook) → Nginx validates SSL/TLS → Forwards to Express.js

### 2. Message Processing
Express.js webhook handler extracts chat_id and message text → Validates format → Initiates async processing → Returns 200 OK immediately

### 3. Agent Orchestration (Agentic Loop)
Claude receives message with tools → Analyzes intent and calls tool → Executes tool and returns result → Claude continues loop → Final text response generated

### 4. Response Delivery
Generate text response → Split if > 4096 characters → Send via bot.sendMessage() → Telegram delivers to user

## Tool Definitions

### 1. get_predictions
Query predictions with optional filters (action, odds, confidence, date, tournament, surface, limit)

### 2. get_value_bets
Get predictions identified as value bets with optional limit and date

### 3. analyze_matchup
Analyze tennis matchup using Perplexity (sonar model) or Gemini with optional focus

### 4. get_tournament_stats
Get tournament-level statistics including accuracy and confidence metrics

## Model Versions (Latest - November 12, 2025)

| Component | Model | Status |
|-----------|-------|--------|
| LLM | claude-sonnet-4-20250514 | ✅ Active |
| Web Search | Perplexity sonar | ✅ Active |
| Alternative | Gemini Pro | ✅ Available |
| Deprecated | claude-3-5-sonnet-20241022 | ⚠️ Removed |
| Deprecated | pplx-70b-online | ⚠️ Replaced |

## Deployment Status

### Current Configuration
- **Server**: curak.xyz VPS
- **Domain**: telegram.curak.xyz
- **Port**: 3004 (internal), 443 (external)
- **Process Manager**: PM2 (PID 1195600)
- **Memory**: 27.4MB
- **Status**: Online and healthy

### Environment Variables Configured
✅ TELEGRAM_BOT_TOKEN  
✅ DATABASE_URL (Neon PostgreSQL)  
✅ ANTHROPIC_API_KEY  
✅ PERPLEXITY_API_KEY  
✅ TELEGRAM_CHAT_ID  
✅ PORT=3004  
✅ WEBHOOK_URL  

### SSL/TLS Certificate
- Issued: November 12, 2025
- Valid Until: February 10, 2026
- Issuer: Let's Encrypt
- Auto-renewal: Enabled

## Testing Results (November 12, 2025)

All components tested and verified:

| Test | Result |
|------|--------|
| Health Endpoint | ✅ Returns 200 OK |
| Database | ✅ 3,381 predictions loaded |
| Anthropic API | ✅ claude-sonnet-4 responding |
| Perplexity API | ✅ sonar model working |
| Telegram Webhook | ✅ Properly registered |
| Agent Workflow | ✅ End-to-end functional |

### Verified Queries
- "Show me today's predictions" → Retrieved 20 predictions
- "What are the best value bets?" → Retrieved value bets
- "Get predictions with at least 80% confidence" → Proper filtering

## Performance Characteristics

- **Response Time**: 2-5 seconds typical
- **Memory Usage**: ~27MB
- **CPU Usage**: < 0.1% idle
- **Database Queries**: < 500ms
- **API Calls**: 1-3 seconds

## Security Features

- ✅ API keys stored in .env (excluded from git)
- ✅ Environment variables loaded via dotenv
- ✅ Parameterized SQL queries (no injection)
- ✅ HTTPS for all external calls
- ✅ SSL/TLS with certificate validation
- ✅ Database connection with sslmode=require
- ✅ Error handling prevents credential exposure

## Files Reference

### Core Application
- `telegram-bot-webhook.js`: Main bot (406 lines)
- `ecosystem.config.js`: PM2 configuration
- `package.json`: Dependencies

### Testing & Utilities
- `test_database.js`: Database connectivity
- `test_anthropic.js`: Claude API test
- `test_perplexity.js`: Perplexity API test
- `check_webhook.js`: Webhook status
- `test_agent_workflow.js`: End-to-end test

### Configuration Files
- Nginx: `/etc/nginx/sites-available/curak.xyz`
- SSL Certs: `/etc/letsencrypt/live/telegram.curak.xyz/`
- PM2 Logs: `/var/log/pm2/tennis-telegram-agent-{out,err}-6.log`

## Key Fixes Applied

1. **Perplexity Model Update**: pplx-70b-online → sonar
2. **Claude Model Update**: claude-3-5-sonnet → claude-sonnet-4
3. **Data Type Handling**: Added parseFloat() for odds (VARCHAR → numeric)
4. **Environment Loading**: Added dotenv configuration

## Agentic Loop Architecture

The bot uses Claude's tool_use feature for intelligent agent behavior:

```
1. User sends query
2. Claude receives: query + system prompt + tool definitions
3. Claude analyzes intent
4. Claude calls appropriate tool(s)
5. Tool executes (database/API call)
6. Claude receives tool result
7. If more tools needed: go to step 4
8. If done: Claude generates natural response
9. Response sent to user
```

This enables:
- Natural language understanding
- Automatic tool selection
- Multi-step interactions
- Intelligent response generation
- Error recovery

## Monitoring & Maintenance

### Daily Checks
```bash
# View bot status
pm2 status

# Check logs
pm2 logs tennis-telegram-agent --lines 50

# Health endpoint
curl https://telegram.curak.xyz/health
```

### Monthly Tasks
- Review API usage and costs
- Check certificate renewal status
- Monitor database performance
- Update dependencies if needed

### Recommended Enhancements
- Add Sentry for error tracking
- Implement Redis caching
- Add user preference persistence
- Setup uptime monitoring
- Implement detailed analytics

## Deployment Timeline

- Initial Implementation: October 2025
- Webhook Migration: November 12, 2025
- Environment Configuration: November 12, 2025 (17:03-18:25)
- Model Updates: November 12, 2025
- Full Testing: November 12, 2025 (18:45-18:51)
- Production Ready: November 12, 2025 (18:51)
