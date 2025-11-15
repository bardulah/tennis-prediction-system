# SIMPLIFIED DIRECT FIX - Replace agents.py with this minimal version

from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from tools import (
    get_predictions, 
    analyze_matchup, 
    get_value_bets, 
    run_morning_workflow, 
    run_evening_workflow, 
    run_live_scraper, 
    get_workflow_status
)

# Create FunctionTool instances
get_predictions_tool = FunctionTool(get_predictions)
analyze_matchup_tool = FunctionTool(analyze_matchup)
get_value_bets_tool = FunctionTool(get_value_bets)
run_morning_workflow_tool = FunctionTool(run_morning_workflow)
run_evening_workflow_tool = FunctionTool(run_evening_workflow)
run_live_scraper_tool = FunctionTool(run_live_scraper)
get_workflow_status_tool = FunctionTool(get_workflow_status)

GEMINI_MODEL = "gemini-2.5-flash"

def create_prediction_agent() -> LlmAgent:
    """Single agent that handles ALL queries - no complex routing."""
    return LlmAgent(
        name="tennis_agent",
        description="A comprehensive tennis prediction and analysis agent.",
        instruction="""You are a tennis prediction and workflow agent. You handle ALL tennis-related queries and system workflows.

IMPORTANT: You have access to these tools:
- get_predictions: Get tennis predictions from database
- get_value_bets: Get value betting opportunities  
- analyze_matchup: AI analysis of matchups (requires TWO player names)
- run_morning_workflow: Execute morning data scraping workflow (supports forward scraping)
- run_evening_workflow: Execute evening results scraping workflow  
- run_live_scraper: Update live scores and match statuses
- get_workflow_status: Check status of workflow executions and output files

COMMAND HANDLING:
- For ANY query mentioning a player name (like "Cirpanli", "Djokovic"), use get_predictions tool
- Only use analyze_matchup if user explicitly mentions TWO players with "vs" or "versus"
- For workflow commands, use the appropriate workflow tools

COMMAND EXAMPLES:
- "run morning scraper" → use run_morning_workflow
- "start evening workflow" → use run_evening_workflow  
- "update live scores" → use run_live_scraper
- "check workflow status" → use get_workflow_status
- "scrap tomorrow matches" → use run_morning_workflow(days_forward=1)
- "scrap next 3 days matches" → use run_morning_workflow(days_forward=3)
- "recent predictions involving cirpanli" → use get_predictions
- "Cirpanli analysis" → use get_predictions  
- "Djokovic vs Nadal" → use analyze_matchup
- "show me value bets" → use get_value_bets

FORWARD SCRAPING CAPABILITIES:
- NOW SUPPORTED: Full forward scraping with `--days-forward` mode
- Available for 1-7 days ahead (reasonable limit for data availability)
- Uses "next" navigation button on Flashscore
- Output files: `matches-YYYY-MM-DD-forward-Nd.json`
- Examples: tomorrow (1 day), next 3 days, next week

Always provide helpful responses and never ask for additional information unless absolutely necessary.""",
        model=GEMINI_MODEL,
        tools=[
            get_predictions_tool, 
            get_value_bets_tool, 
            analyze_matchup_tool,
            run_morning_workflow_tool,
            run_evening_workflow_tool,
            run_live_scraper_tool,
            get_workflow_status_tool
        ],
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
