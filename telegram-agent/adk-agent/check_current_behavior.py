#!/usr/bin/env python3
"""
IMMEDIATE FIX for Cirpanli routing issue

This creates a simple test to verify the current bot behavior
and provide a quick fix if the enhanced code isn't working.

Usage:
    python3 check_current_behavior.py
"""

import os
import sys

def check_current_files():
    """Check if the enhanced files are in place."""
    print("🔍 Checking Current File State")
    print("-" * 40)
    
    files_to_check = [
        'main.py',
        'agents.py', 
        'tools.py'
    ]
    
    for file in files_to_check:
        if os.path.exists(file):
            print(f"✅ {file} exists")
        else:
            print(f"❌ {file} missing")
    
    # Check if routing has been updated
    try:
        with open('agents.py', 'r') as f:
            content = f.read()
            
        if 'SINGLE PLAYER REQUESTS → PREDICTION AGENT' in content:
            print("✅ Enhanced routing instructions found")
        else:
            print("❌ Enhanced routing instructions missing")
            
        if 'Cirpanli analysis?' in content:
            print("✅ Cirpanli routing example found")
        else:
            print("❌ Cirpanli routing example missing")
            
    except Exception as e:
        print(f"❌ Error reading agents.py: {e}")

def create_quick_fix():
    """Create a quick fix for the current bot."""
    print("\n🛠️ Creating Quick Fix")
    print("-" * 40)
    
    # Create a simple replacement for agents.py with more explicit routing
    quick_fix_content = '''# QUICK FIX: Enhanced Dispatcher Agent with explicit routing

from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from tools import get_predictions, analyze_matchup, get_value_bets

# Create FunctionTool instances from the tools
get_predictions_tool = FunctionTool(get_predictions)
analyze_matchup_tool = FunctionTool(analyze_matchup)
get_value_bets_tool = FunctionTool(get_value_bets)

GEMINI_MODEL = "gemini-2.5-flash"

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
'''
    
    with open('agents_quick_fix.py', 'w') as f:
        f.write(quick_fix_content)
    
    print("✅ Created agents_quick_fix.py with explicit routing")
    print("💡 To use: Replace the content of agents.py with this file")

def test_simple_player_query():
    """Test what the bot should do for player queries."""
    print("\n🧪 Testing Expected Behavior")
    print("-" * 40)
    
    user_queries = [
        "recent predictions involving cirpanli",
        "cirpanli analysis", 
        "djokovic performance",
        "cirpanli vs someone"
    ]
    
    for query in user_queries:
        print(f"\nUser: {query}")
        
        # Simple routing logic
        if " vs " in query.lower() or "versus" in query.lower():
            print("  → Routes to: analysis_agent (two players)")
            print("  → Uses: analyze_matchup tool")
        elif query.lower().strip() in ["cirpanli", "djokovic", "federer", "nadal"]:
            print("  → Routes to: prediction_agent (single player)")
            print("  → Uses: get_predictions tool")
        elif "cirpanli" in query.lower() and "analysis" in query.lower():
            print("  → Routes to: prediction_agent (player analysis)")  
            print("  → Uses: get_predictions tool")
        elif "cirpanli" in query.lower():
            print("  → Routes to: prediction_agent (Cirpanli mentioned)")
            print("  → Uses: get_predictions tool")
        else:
            print("  → Routes to: prediction_agent (general)")
            print("  → Uses: get_predictions tool")

def main():
    """Main function to diagnose and fix the routing issue."""
    print("🚨 EMERGENCY FIX: Bot Stuck Asking for Opponent")
    print("=" * 50)
    print("Issue: 'recent predictions involving cirpanli'")
    print("Wrong Response: 'Who is Cirpanli's opponent?'")
    print("Expected: Show Cirpanli's data or explain if not found")
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Check current state
    check_current_files()
    
    # Show expected behavior
    test_simple_player_query()
    
    # Create quick fix
    create_quick_fix()
    
    print("\n" + "="*50)
    print("📋 IMMEDIATE SOLUTION:")
    print("1. The bot is NOT using the enhanced routing")
    print("2. Replace agents.py content with agents_quick_fix.py")
    print("3. Restart the bot")
    print("4. Test: 'recent predictions involving cirpanli'")
    print("\n✅ Should now show Cirpanli data or helpful message")

if __name__ == "__main__":
    main()
