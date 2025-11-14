# Quick Reference: ADK Architecture Fixes

## Key Changes Made

### 1. Imports
```python
# WRONG
from google.adk import Agent, AgentService, AgentServiceFactory
from google.adk.models import GeminiModel

# CORRECT  
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
```

### 2. Agent Creation
```python
# WRONG
model = GeminiModel(api_key=GOOGLE_API_KEY, model_id="gemini-2.5-flash")
agent = Agent(..., model=model)

# CORRECT
agent = LlmAgent(
    name="valid_identifier",  # No spaces!
    model="gemini-2.5-flash",  # String, not object
    tools=[tool1, tool2]
)
```

### 3. Agent Execution
```python
# WRONG
agent_service = AgentServiceFactory.create(agent=agent, session_service=...)
response = agent_service.run(user_message, session)

# CORRECT
runner = Runner(agent=agent, session_service=session_service)
async for event in runner.run_async(user_id=user_id, new_message=user_message):
    if hasattr(event, 'text') and event.text:
        response_text += event.text
```

### 4. FunctionTool Creation
```python
# WRONG
FunctionTool(name="get_predictions", description="...", func=get_predictions)

# CORRECT
FunctionTool(get_predictions)  # Name inferred from function name
```

## Critical Constraints
- **Agent names must be valid Python identifiers**: `prediction_agent` ✓, `Prediction Agent` ✗
- **Model is a string**: `"gemini-2.5-flash"` ✓, `GeminiModel(...)` ✗
- **Tools passed directly to agents**: No separate MCP server needed
- **Events handled via async iteration**: `async for event in runner.run_async(...)`

## Files Successfully Fixed
- ✅ main.py - Runner-based message handling
- ✅ agents.py - Correct LlmAgent creation
- ✅ tools.py - FunctionTool wrapper creation
- ✅ mcp_server.py - Simplified (tools integrated directly)
- ✅ evaluation/run_evaluation.py - Evaluation with Runner

## Verification Commands
```bash
source telegram-agent/adk-agent/venv/bin/activate

# Check imports
python3 -c "from agents import *; from tools import *; print('✓ All imports OK')"

# Check syntax
python3 -m py_compile agents.py main.py tools.py mcp_server.py evaluation/run_evaluation.py
```
