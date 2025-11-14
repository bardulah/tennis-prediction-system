# SIMPLIFIED DIRECT FIX - Replace agents.py with this minimal version

from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from tools import get_predictions, analyze_matchup, get_value_bets

# Create FunctionTool instances
get_predictions_tool = FunctionTool(get_predictions)
analyze_matchup_tool = FunctionTool(analyze_matchup)
get_value_bets_tool = FunctionTool(get_value_bets)

GEMINI_MODEL = "gemini-2.5-flash"

def create_prediction_agent() -> LlmAgent:
    """Single agent that handles ALL queries - no complex routing."""
    return LlmAgent(
        name="tennis_agent",
        description="A comprehensive tennis prediction and analysis agent.",
        instruction="""You are a tennis prediction agent. You handle ALL tennis-related queries.

IMPORTANT: You have access to these tools:
- get_predictions: Get tennis predictions from database
- get_value_bets: Get value betting opportunities  
- analyze_matchup: AI analysis of matchups (requires TWO player names)

CRITICAL INSTRUCTIONS:
- For ANY query mentioning a player name (like "Cirpanli", "Djokovic"), use get_predictions tool
- Only use analyze_matchup if user explicitly mentions TWO players with "vs" or "versus"
- Never ask for opponents - show available data or explain if not found

EXAMPLES:
- "recent predictions involving cirpanli" → use get_predictions
- "Cirpanli analysis" → use get_predictions  
- "Djokovic vs Nadal" → use analyze_matchup
- "show me value bets" → use get_value_bets

Always provide helpful responses and never ask for additional information unless absolutely necessary.""",
        model=GEMINI_MODEL,
        tools=[get_predictions_tool, get_value_bets_tool, analyze_matchup_tool],
    )

def create_analysis_agent() -> LlmAgent:
    """Keep this for compatibility but won't be used."""
    return LlmAgent(
        name="analysis_agent",
        description="Unused - all queries go to prediction agent.",
        instruction="This agent is not used - all queries route to prediction_agent.",
        model=GEMINI_MODEL,
        tools=[analyze_matchup_tool],
    )

def create_dispatcher_agent(prediction_agent: LlmAgent, analysis_agent: LlmAgent) -> LlmAgent:
    """Simple dispatcher - routes most queries to prediction agent."""
    return LlmAgent(
        name="dispatcher",
        description="Routes queries to the tennis agent.",
        instruction="Route ALL queries to the prediction_agent (tennis_agent). The prediction agent handles everything including player analysis.",
        model=GEMINI_MODEL,
        sub_agents=[prediction_agent, analysis_agent],
    )
