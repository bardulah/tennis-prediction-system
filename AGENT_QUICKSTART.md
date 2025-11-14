# Tennis Prediction Agent - Quick Start

## Prerequisites

- `.env` file configured with:
  - `TELEGRAM_BOT_TOKEN`
  - `GOOGLE_API_KEY`
  - `WEBHOOK_URL`
  - `DATABASE_URL`
  - Optional: `PERPLEXITY_API_KEY`

## Starting the Agent

```bash
cd /opt/tennis-scraper/telegram-agent/adk-agent
source venv/bin/activate
python main.py
```

The agent will:
1. ✅ Start FastAPI server on port 3004
2. ✅ Set Telegram webhook
3. ✅ Wait for messages
4. ✅ Process user queries through the dispatcher agent
5. ✅ Route to specialized agents (prediction or analysis)
6. ✅ Execute database queries and API calls
7. ✅ Return formatted responses to Telegram

## Testing the Agent (without Telegram)

```bash
cd /opt/tennis-scraper/telegram-agent/adk-agent
source venv/bin/activate
python3 << 'EOF'
import asyncio
import os
from agents import create_prediction_agent, create_analysis_agent, create_dispatcher_agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

# Load environment
with open('.env') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            os.environ[k] = v.strip('"\'')

async def test():
    pred = create_prediction_agent()
    analysis = create_analysis_agent()
    dispatcher = create_dispatcher_agent(pred, analysis)
    
    session_service = InMemorySessionService()
    runner = Runner(agent=dispatcher, app_name="agents", session_service=session_service)
    
    user_id = "test_user"
    session_id = "test_session"
    
    await session_service.create_session(app_name="agents", user_id=user_id, session_id=session_id)
    
    message = Content(parts=[Part(text="What predictions do you have for today?")])
    
    print("Agent Response:")
    async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=message):
        if hasattr(event, 'text') and event.text:
            print(event.text, end="", flush=True)

asyncio.run(test())
EOF
```

## Architecture

### Multi-Agent System
- **Dispatcher Agent** - Routes user queries to appropriate sub-agents
- **Prediction Agent** - Handles prediction queries, value bets
- **Analysis Agent** - Provides detailed matchup analysis

### Available Tools
1. `get_predictions()` - Fetch tennis predictions with filters
2. `get_value_bets()` - Get favorable odds predictions
3. `analyze_matchup()` - Analyze specific player matchups

### Data Flow
```
User Message
    ↓
Telegram Webhook (Port 3004)
    ↓
Dispatcher Agent
    ↓
[Prediction Agent | Analysis Agent]
    ↓
Tool Execution (DB + API calls)
    ↓
Response Formatting
    ↓
Telegram Reply
```

## Troubleshooting

### "Session not found" Error
- Make sure you're using `run_async()` with proper app_name="agents"
- Sessions must be created before running

### "column does not exist" Error in Database
- Update SQL queries in `tools.py` to match your actual database schema
- Verify `live_matches` table structure

### No Response from Agent
- Check API keys are set in `.env`
- Verify database connectivity
- Check logs for tool execution errors

### Agent Won't Start
```bash
# Check if venv is activated
which python3  # Should show path in venv

# Verify imports
python3 -c "from google.adk.agents import LlmAgent; print('OK')"

# Check dependencies
pip list | grep google-adk
```

## Logs

The agent logs messages to console:
- `[user_id] User: {message}` - Incoming message
- `[user_id] Agent: {response}` - Agent response
- Errors and warnings from tools/API calls

## Performance Notes

- Events may come in bursts (function calls, responses, text parts)
- Tool execution time depends on database and external API performance
- Streaming responses are sent as they're generated

## Next Steps

1. **Fix Database Schema** - Align `tools.py` queries with actual schema
2. **Add More Tools** - Create additional FunctionTools for new capabilities
3. **Enhance Analysis** - Add more AI models for analysis (currently Perplexity/Gemini)
4. **Persistent Memory** - Migrate from InMemorySessionService to DatabaseSessionService with proper schema
