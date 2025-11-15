# ADK v1.18.0 Architecture Fixes - Completed Nov 13, 2025

## Summary

The Tennis Prediction Agent has been successfully refactored to use the correct Google ADK v1.18.0 API architecture. All critical issues have been resolved.

## Issues Fixed

### 1. ✅ Import Statements (FIXED)
**Issue**: Code used incorrect `google_adk` imports instead of `google.adk`  
**Files Fixed**:
- main.py
- agents.py  
- tools.py
- mcp_server.py
- evaluation/run_evaluation.py

### 2. ✅ API Architecture Mismatch (FIXED)
**Issue**: Code attempted to use non-existent ADK classes

**Problems & Solutions**:

| Problem | Solution |
|---------|----------|
| `AgentService` and `AgentServiceFactory` don't exist | Use `Runner` class for executing agents |
| `GeminiModel` class with `api_key` and `model_id` | Pass model as string: `model="gemini-2.5-flash"` |
| FunctionTool with `name` parameter | FunctionTool only takes function, name inferred from docstring |
| Agent names with spaces (e.g., "Prediction Agent") | Agent names must be valid identifiers (e.g., `prediction_agent`) |
| Non-existent `MCPToolset` for MCP server | Removed MCP server - tools pass directly to agents |

## Architecture Corrections

### Before (Incorrect)
```python
from google.adk import Agent, AgentService, AgentServiceFactory
from google.adk.models import GeminiModel
from google.adk.mcp import MCPToolset

model = GeminiModel(api_key=GOOGLE_API_KEY, model_id="gemini-2.5-flash")
agent_service = AgentServiceFactory.create(agent=dispatcher_agent)
response = agent_service.run(user_message, session)
```

### After (Correct)
```python
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.adk.tools import FunctionTool

agent = LlmAgent(
    name="tennis_dispatcher",  # Valid identifier
    model="gemini-2.5-flash",  # String, not object
    tools=[tool1, tool2],  # Direct FunctionTools
)
session_service = DatabaseSessionService(db_url=DATABASE_URL)
runner = Runner(agent=agent, session_service=session_service)

async for event in runner.run_async(
    user_id=user_id,
    session_id=None,
    new_message=user_message
):
    # Handle events
    pass
```

## Files Modified

### 1. agents.py
- Removed model object creation
- Fixed agent names to be valid Python identifiers  
- Simplified agent factory functions
- Tools now created as FunctionTool directly from functions

### 2. main.py
- Replaced `AgentService`/`AgentServiceFactory` with `Runner`
- Updated message handling to use `runner.run_async()`
- Proper event streaming from runner
- All imports corrected to `google.adk`

### 3. tools.py
- Simplified FunctionTool creation (no name/description params)
- Kept all three tool functions intact with proper docstrings

### 4. mcp_server.py
- Simplified to just export tool functions
- Note: ADK v1.18.0 doesn't use separate MCP server in this pattern

### 5. evaluation/run_evaluation.py
- Updated to use `Runner` instead of non-existent evaluation API
- Uses `InMemorySessionService` for testing
- Proper async iteration over runner events

## Verification

All files have been verified:
- ✅ Syntax validation passed (py_compile)
- ✅ Module imports work correctly in venv
- ✅ Agent creation successful
- ✅ All dependencies available in venv

## Running the Agent

```bash
# Terminal 1: Start MCP tool server (if needed)
cd /opt/tennis-scraper/telegram-agent/adk-agent
source venv/bin/activate
python mcp_server.py  # Informational only

# Terminal 2: Start the Telegram agent
cd /opt/tennis-scraper/telegram-agent/adk-agent
source venv/bin/activate
python main.py
```

## Next Steps

1. Ensure `.env` file has all required variables:
   - `TELEGRAM_BOT_TOKEN`
   - `GOOGLE_API_KEY`
   - `WEBHOOK_URL`
   - `DATABASE_URL`

2. Run the agent using the commands above

3. Test with Telegram bot to verify end-to-end functionality

## Known Limitations

- The evaluation framework in `run_evaluation.py` is simplified and may need enhancement for comprehensive testing
- MCP server integration is not used in current architecture (tools integrated directly)
