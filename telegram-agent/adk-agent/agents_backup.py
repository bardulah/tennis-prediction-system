import asyncio
import json
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from tools import get_predictions, analyze_matchup, get_value_bets, get_player_matchups, analyze_player_performance

# Model constant
GEMINI_MODEL = "gemini-2.5-flash"

# Create FunctionTool instances from the tools
get_predictions_tool = FunctionTool(get_predictions)
analyze_matchup_tool = FunctionTool(analyze_matchup)
get_value_bets_tool = FunctionTool(get_value_bets)

# Enhanced player matching tools
get_player_matchups_tool = FunctionTool(get_player_matchups)
analyze_player_performance_tool = FunctionTool(analyze_player_performance)

# Enhanced query functions for database MCP integration
async def query_database_mcp(tool_name: str, arguments: dict) -> str:
    """
    Query the database MCP server for advanced analytics.
    This function interfaces with the database MCP server to provide
    sophisticated tennis data analysis capabilities.
    """
    try:
        # Import the database MCP server tools
        from database_mcp_server import server
        
        # Call the MCP tool
        result = await server.call_tool(tool_name, arguments)
        
        if hasattr(result, 'content') and result.content:
            return result.content[0].text if hasattr(result.content[0], 'text') else str(result.content[0])
        else:
            return "No result from database MCP server"
            
    except ImportError:
        return "Database MCP server not available. Please ensure database_mcp_server.py is running."
    except Exception as e:
        return f"Error querying database MCP: {str(e)}"

def create_database_query_tool() -> FunctionTool:
    """
    Create a function tool for database MCP queries.
    This allows agents to make sophisticated database queries through the MCP server.
    """
    async def query_database(
        query_type: str,
        **kwargs
    ) -> str:
        """
        Query the tennis database for various types of analysis.
        
        Args:
            query_type: Type of query (player_stats, tournament_analysis, head_to_head, 
                       form_analysis, surface_analysis, odds_analysis, value_opportunities, 
                       performance_trends)
            **kwargs: Query-specific parameters
        """
        
        # Map query types to MCP tool names
        query_mapping = {
            "player_stats": "get_player_stats",
            "tournament_analysis": "get_tournament_analysis", 
            "head_to_head": "get_head_to_head",
            "form_analysis": "get_form_analysis",
            "surface_analysis": "get_surface_analysis",
            "odds_analysis": "get_odds_analysis",
            "value_opportunities": "get_value_opportunities",
            "performance_trends": "get_performance_trends"
        }
        
        mcp_tool_name = query_mapping.get(query_type)
        if not mcp_tool_name:
            available_types = ", ".join(query_mapping.keys())
            return f"Invalid query type: {query_type}. Available types: {available_types}"
        
        try:
            return await query_database_mcp(mcp_tool_name, kwargs)
        except Exception as e:
            return f"Error executing {query_type} query: {str(e)}"
    
    return FunctionTool(query_database)

def create_prediction_agent() -> LlmAgent:
    """Creates an agent specialized in fetching tennis predictions."""
    # Add database query tool for enhanced capabilities
    database_query_tool = create_database_query_tool()
    
    return LlmAgent(
        name="prediction_agent",
        description="Fetches tennis match predictions from the database and performs advanced analytics.",
        instruction="""You are a tennis prediction agent with access to comprehensive prediction data and analytics tools. Your capabilities include:

1. Fetching tennis predictions with various filters
2. Identifying value betting opportunities
3. Performing advanced analytics (player stats, head-to-head, form analysis, etc.)
4. Player-specific analysis (matchups, performance, statistics)

CRITICAL CONTEXT AWARENESS:
- Pay attention to your previous responses - if you just listed 3 matches and the user says "analyze all 3", analyze all 3 matches you mentioned
- If you listed specific player names or matchups, remember them when the user references them
- When users say "the first one" or "the second one", refer to the list you just provided
- Build upon your previous responses rather than asking for information you've already given

🚨 NEVER USE get_value_bets FOR PLAYER ANALYSIS:
- If user asks about a specific player (e.g., "Cirpanli", "Djokovic"), NEVER use get_value_bets
- Use get_player_matchups or analyze_player_performance instead
- get_value_bets is ONLY for general value betting opportunities, not player-specific queries

TOOL USAGE GUIDELINES:
- Single player + "analysis": Use get_player_matchups or analyze_player_performance
- Player + "performance", "form", "stats": Use analyze_player_performance
- "Show me [player]'s matchups": Use get_player_matchups
- Multiple predictions: Use get_predictions
- Value betting opportunities: Use get_value_bets
- Complex analytics: Use query_database

Your available tools:
- get_predictions: Fetch predictions with filters
- get_value_bets: Get value betting opportunities  
- get_player_matchups: Get matchups for a specific player (supports surnames like "Djokovic")
- analyze_player_performance: Analyze a player's recent performance (supports surnames)
- query_database: Advanced analytics (player stats, head-to-head, form analysis, surface analysis, tournament analysis, odds analysis, value opportunities, performance trends)

🚨 TOOL SELECTION RULES:

**PLAYER-SPECIFIC REQUESTS:**
- Player name + "analysis" → use get_player_matchups OR analyze_player_performance
- "search for [player]" → use get_player_matchups
- "[player] matchups" → use get_player_matchups  
- "[player] performance" → use analyze_player_performance
- "[player] stats" → use analyze_player_performance

**GENERAL PREDICTION REQUESTS:**
- "show me predictions" → use get_predictions
- "value bets" → use get_value_bets
- "today's matches" → use get_predictions

**COMPLEX ANALYSIS:**
- Advanced analytics → use query_database

Always be helpful and reference your previous outputs when users ask follow-up questions about items you've already mentioned.""",
        model=GEMINI_MODEL,
        tools=[get_predictions_tool, get_value_bets_tool, get_player_matchups_tool, analyze_player_performance_tool, database_query_tool],
    )

def create_analysis_agent() -> LlmAgent:
    """Creates an agent specialized in analyzing matchups."""
    return LlmAgent(
        name="analysis_agent",
        description="Analyzes tennis matchups using external AI models.",
        instruction="You are an analysis agent. Your job is to use the analyze_matchup tool to provide detailed analysis of tennis matchups.",
        model=GEMINI_MODEL,
        tools=[analyze_matchup_tool],
    )

def create_dispatcher_agent(prediction_agent: LlmAgent, analysis_agent: LlmAgent) -> LlmAgent:
    """Creates a dispatcher agent that routes requests to sub-agents."""
    return LlmAgent(
        name="tennis_dispatcher",
        description="The main dispatcher agent that routes user requests to the appropriate sub-agent.",
        instruction="""You are a tennis prediction agent DISPATCHER. Your ONLY job is to route user requests to the correct sub-agent.

🚨 CRITICAL ROUTING RULES:

**SINGLE PLAYER REQUESTS → PREDICTION AGENT:**
- "[Player] analysis" → prediction_agent
- "[Player] performance" → prediction_agent  
- "[Player] matchups" → prediction_agent
- "[Player] stats" → prediction_agent
- "[Player] form" → prediction_agent
- "search for [player]" → prediction_agent
- "show me [player]" → prediction_agent
- Examples: "Djokovic analysis", "Cirpanli analysis", "Federer performance"

**TWO PLAYER REQUESTS → ANALYSIS AGENT:**
- "[Player1] vs [Player2]" → analysis_agent
- "[Player1] versus [Player2]" → analysis_agent
- "matchup between [Player1] and [Player2]" → analysis_agent
- "head to head [Player1] [Player2]" → analysis_agent
- "analyze [Player1] vs [Player2]" → analysis_agent

**PREDICTION REQUESTS → PREDICTION AGENT:**
- "show me predictions" → prediction_agent
- "value bets" → prediction_agent
- "today's matches" → prediction_agent
- "upcoming games" → prediction_agent

🚨 NEVER route single player analysis requests to the analysis_agent. The analysis_agent requires TWO players.

🚨 EXAMPLES OF CORRECT ROUTING:
- "Cirpanli analysis?" → prediction_agent (single player)
- "Djokovic performance" → prediction_agent (single player) 
- "Djokovic vs Nadal" → analysis_agent (two players)
- "show me value bets" → prediction_agent (prediction request)

CONTEXT HANDLING:
- If user says "analyze all 3" referring to your previous list, use prediction_agent
- If user says "the first one" referring to previous matches, use prediction_agent

Route EVERYTHING else to prediction_agent unless it's clearly a two-player matchup analysis.""",
        model=GEMINI_MODEL,
        sub_agents=[prediction_agent, analysis_agent],
    )
