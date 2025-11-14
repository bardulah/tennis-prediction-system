"""
MCP Server for Tennis Prediction Agent Tools

This module exposes the agent's tools via an MCP server interface.
However, in the current ADK v1.18.0 architecture, tools are passed directly to agents.
This file is kept for reference and potential future MCP server integration.
"""

import os
from tools import get_predictions, analyze_matchup, get_value_bets

# Tools are exported for use in agents
__all__ = ['get_predictions', 'analyze_matchup', 'get_value_bets']

if __name__ == "__main__":
    # If running this file directly, print available tools
    print("Available Tools:")
    print("1. get_predictions - Fetch tennis predictions with optional filters")
    print("2. analyze_matchup - Analyze a tennis matchup using AI")
    print("3. get_value_bets - Get predictions identified as value bets")
    print("\nNote: In ADK v1.18.0, tools are used directly in agents via FunctionTool")
