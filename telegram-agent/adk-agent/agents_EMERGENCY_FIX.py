# EMERGENCY FIX: Replace agents.py with this content to fix the routing issue

from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from tools import get_predictions, analyze_matchup, get_value_bets

# Create FunctionTool instances from the tools
get_predictions_tool = FunctionTool(get_predictions)
analyze_matchup_tool = FunctionTool(analyze_matchup)
get_value_bets_tool = FunctionTool(get_value_bets)

GEMINI_MODEL = "gemini-2.5-flash"

def create_prediction_agent() -> LlmAgent:
    """Creates an agent specialized in fetching tennis predictions."""
    return LlmAgent(
        name="prediction_agent",
        description="Fetches tennis predictions and analyzes single players.",
        instruction="""You are a tennis prediction agent. Handle single player queries.

CRITICAL: For player-specific queries, use the available tools to provide information about that player.

Available tools:
- get_predictions: Fetch predictions with filters
- get_value_bets: Get value betting opportunities

For queries like "Cirpanli", "Djokovic", or any single player name:
- Use get_predictions tool and explain if no data found
- Provide helpful responses about the player
- NEVER ask for opponents

For "recent predictions involving [player]":
- Use get_predictions and explain the player's data""",
        model=GEMINI_MODEL,
        tools=[get_predictions_tool, get_value_bets_tool],
    )

def create_analysis_agent() -> LlmAgent:
    """Creates an agent specialized in analyzing matchups."""
    return LlmAgent(
        name="analysis_agent", 
        description="Analyzes tennis matchups using external AI models.",
        instruction="You are an analysis agent. Your job is to use the analyze_matchup tool to provide detailed analysis of tennis matchups between TWO players.",
        model=GEMINI_MODEL,
        tools=[analyze_matchup_tool],
    )

def create_dispatcher_agent(prediction_agent: LlmAgent, analysis_agent: LlmAgent) -> LlmAgent:
    """Creates a dispatcher agent with EXPLICIT routing rules."""
    return LlmAgent(
        name="tennis_dispatcher",
        description="The main dispatcher agent that routes user requests to the appropriate sub-agent.",
        instruction="""🚨 CRITICAL: You are a ROUTER only. Route ALL requests to sub-agents.

**ROUTING RULES:**

🚨 SINGLE PLAYER REQUESTS → prediction_agent (PREDICTION AGENT):
- ANY query with ONE player name → prediction_agent
- Examples: "Cirpanli analysis", "recent predictions Cirpanli", "Djokovic performance"
- "show me [player]" → prediction_agent  
- "analyze [player]" → prediction_agent
- "[player] matchups" → prediction_agent

🚨 TWO PLAYER REQUESTS → analysis_agent (ANALYSIS AGENT):
- Queries with TWO player names → analysis_agent
- Examples: "Djokovic vs Nadal", "Cirpanli vs opponent"
- "head to head [player1] [player2]" → analysis_agent

🚨 GENERAL REQUESTS → prediction_agent:
- "predictions", "value bets", "today's matches" → prediction_agent

🚨 NEVER ask for opponents! Route single-player queries to prediction_agent.

Route ALL single-player requests to prediction_agent immediately.""",
        model=GEMINI_MODEL,
        sub_agents=[prediction_agent, analysis_agent],
    )
