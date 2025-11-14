"""
Database MCP Server for Tennis Prediction Agent

This server provides advanced database query capabilities via MCP protocol,
enabling the agent to perform sophisticated data analysis and complex queries
that go beyond basic prediction retrieval.

Features:
- Player statistics and historical performance
- Tournament analysis and trends
- Head-to-head matchup analysis
- Form analysis and recent performance
- Surface-specific performance
- Odds analysis and value identification
- Performance trends and time-series analysis
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import psycopg2
from dotenv import load_dotenv
from mcp.server import Server
from mcp.types import CallToolResult, ListToolsResult, Tool

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")

# Initialize MCP Server
server = Server("tennis-database-mcp")

@server.list_tools()
async def list_tools() -> ListToolsResult:
    """List all available database query tools."""
    tools = [
        Tool(
            name="get_player_stats",
            description="Get comprehensive statistics for a specific player including win/loss records, recent form, and performance metrics",
            inputSchema={
                "type": "object",
                "properties": {
                    "player_name": {"type": "string", "description": "Name of the player"},
                    "days_back": {"type": "number", "description": "Days to look back for recent form (default: 30)"},
                    "include_tournaments": {"type": "boolean", "description": "Include tournament breakdown", "default": True}
                },
                "required": ["player_name"]
            }
        ),
        Tool(
            name="get_tournament_analysis",
            description="Analyze tournament trends, surface preferences, and historical performance patterns",
            inputSchema={
                "type": "object", 
                "properties": {
                    "tournament_name": {"type": "string", "description": "Name of the tournament"},
                    "year": {"type": "number", "description": "Year to analyze (default: current year)"},
                    "include_surface_breakdown": {"type": "boolean", "description": "Include performance by surface", "default": True}
                },
                "required": ["tournament_name"]
            }
        ),
        Tool(
            name="get_head_to_head",
            description="Get detailed head-to-head statistics between two players",
            inputSchema={
                "type": "object",
                "properties": {
                    "player1": {"type": "string", "description": "First player name"},
                    "player2": {"type": "string", "description": "Second player name"},
                    "years_back": {"type": "number", "description": "Years to look back (default: 2)", "default": 2}
                },
                "required": ["player1", "player2"]
            }
        ),
        Tool(
            name="get_form_analysis",
            description="Analyze recent form and performance trends for players",
            inputSchema={
                "type": "object",
                "properties": {
                    "players": {"type": "array", "items": {"type": "string"}, "description": "List of player names"},
                    "matches_back": {"type": "number", "description": "Number of recent matches to analyze (default: 10)", "default": 10},
                    "days_back": {"type": "number", "description": "Days to look back (default: 90)", "default": 90}
                },
                "required": ["players"]
            }
        ),
        Tool(
            name="get_surface_analysis",
            description="Analyze performance by court surface (hard, clay, grass)",
            inputSchema={
                "type": "object",
                "properties": {
                    "player_name": {"type": "string", "description": "Name of the player"},
                    "surfaces": {"type": "array", "items": {"type": "string"}, "description": "Surfaces to analyze (default: all)"},
                    "time_period_days": {"type": "number", "description": "Days to look back (default: 365)", "default": 365}
                },
                "required": ["player_name"]
            }
        ),
        Tool(
            name="get_odds_analysis",
            description="Analyze betting odds trends and identify value opportunities",
            inputSchema={
                "type": "object",
                "properties": {
                    "date_from": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                    "date_to": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                    "min_odds": {"type": "number", "description": "Minimum odds threshold", "default": 1.5},
                    "confidence_threshold": {"type": "number", "description": "Minimum confidence score", "default": 70}
                }
            }
        ),
        Tool(
            name="get_value_opportunities",
            description="Identify advanced value betting opportunities using statistical analysis",
            inputSchema={
                "type": "object",
                "properties": {
                    "analysis_type": {"type": "string", "enum": ["statistical", "form-based", "surface-based"], "description": "Type of value analysis"},
                    "min_confidence": {"type": "number", "description": "Minimum confidence threshold", "default": 65},
                    "limit": {"type": "number", "description": "Maximum results to return", "default": 15}
                },
                "required": ["analysis_type"]
            }
        ),
        Tool(
            name="get_performance_trends",
            description="Analyze time-series performance data for trend identification",
            inputSchema={
                "type": "object",
                "properties": {
                    "player_name": {"type": "string", "description": "Name of the player"},
                    "metric": {"type": "string", "enum": ["confidence_score", "win_rate", "odds_accuracy"], "description": "Performance metric to analyze"},
                    "period_days": {"type": "number", "description": "Time period in days (default: 90)", "default": 90},
                    "aggregation": {"type": "string", "enum": ["daily", "weekly", "monthly"], "description": "Time aggregation", "default": "weekly"}
                },
                "required": ["player_name", "metric"]
            }
        )
    ]
    
    return ListToolsResult(tools=tools)

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> CallToolResult:
    """Execute database queries based on tool name and arguments."""
    
    try:
        if name == "get_player_stats":
            return await get_player_stats(**arguments)
        elif name == "get_tournament_analysis":
            return await get_tournament_analysis(**arguments)
        elif name == "get_head_to_head":
            return await get_head_to_head(**arguments)
        elif name == "get_form_analysis":
            return await get_form_analysis(**arguments)
        elif name == "get_surface_analysis":
            return await get_surface_analysis(**arguments)
        elif name == "get_odds_analysis":
            return await get_odds_analysis(**arguments)
        elif name == "get_value_opportunities":
            return await get_value_opportunities(**arguments)
        elif name == "get_performance_trends":
            return await get_performance_trends(**arguments)
        else:
            return CallToolResult(
                content=[{"type": "text", "text": f"Unknown tool: {name}"}],
                isError=True
            )
    
    except Exception as e:
        return CallToolResult(
            content=[{"type": "text", "text": f"Error executing {name}: {str(e)}"}],
            isError=True
        )

async def get_player_stats(
    player_name: str,
    days_back: int = 30,
    include_tournaments: bool = True
) -> CallToolResult:
    """Get comprehensive player statistics."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            # Basic stats query
            stats_query = """
                SELECT 
                    COUNT(*) as total_predictions,
                    AVG(confidence_score) as avg_confidence,
                    COUNT(CASE WHEN predicted_winner = actual_winner THEN 1 END) as correct_predictions,
                    COUNT(CASE WHEN recommended_action = 'bet' AND actual_winner IS NOT NULL THEN 1 END) as bet_outcomes,
                    COUNT(CASE WHEN recommended_action = 'bet' AND predicted_winner = actual_winner THEN 1 END) as successful_bets,
                    AVG(CASE WHEN value_bet THEN odds_player1 ELSE odds_player2 END) as avg_odds
                FROM predictions 
                WHERE (player1 = %s OR player2 = %s)
                AND prediction_day >= CURRENT_DATE - INTERVAL '%s days'
            """
            cur.execute(stats_query, (player_name, player_name, days_back))
            stats = cur.fetchone()
            
            # Recent form query
            form_query = """
                SELECT prediction_day, predicted_winner, actual_winner, confidence_score, 
                       recommended_action, tournament, surface, value_bet
                FROM predictions 
                WHERE (player1 = %s OR player2 = %s)
                AND prediction_day >= CURRENT_DATE - INTERVAL '%s days'
                ORDER BY prediction_day DESC
                LIMIT 20
            """
            cur.execute(form_query, (player_name, player_name, days_back))
            recent_matches = cur.fetchall()
            
            # Tournament breakdown if requested
            tournament_breakdown = []
            if include_tournaments:
                tour_query = """
                    SELECT tournament, COUNT(*) as total_matches, 
                           AVG(confidence_score) as avg_confidence
                    FROM predictions 
                    WHERE (player1 = %s OR player2 = %s)
                    AND prediction_day >= CURRENT_DATE - INTERVAL '%s days'
                    GROUP BY tournament
                    ORDER BY total_matches DESC
                """
                cur.execute(tour_query, (player_name, player_name, days_back))
                tournament_breakdown = cur.fetchall()
            
            # Format results
            total_predictions, avg_confidence, correct_predictions, bet_outcomes, successful_bets, avg_odds = stats
            accuracy_rate = (correct_predictions / total_predictions * 100) if total_predictions > 0 else 0
            bet_success_rate = (successful_bets / bet_outcomes * 100) if bet_outcomes > 0 else 0
            
            result = {
                "player": player_name,
                "period_days": days_back,
                "overall_stats": {
                    "total_predictions": total_predictions,
                    "accuracy_rate": f"{accuracy_rate:.1f}%",
                    "average_confidence": f"{avg_confidence:.1f}" if avg_confidence else "N/A",
                    "bet_outcomes": bet_outcomes,
                    "bet_success_rate": f"{bet_success_rate:.1f}%" if bet_outcomes > 0 else "N/A",
                    "average_odds": f"{avg_odds:.2f}" if avg_odds else "N/A"
                },
                "recent_form": [
                    {
                        "date": match[0].strftime("%Y-%m-%d") if match[0] else "N/A",
                        "opponent": match[1] if match[1] != player_name else match[2],
                        "predicted_winner": match[1],
                        "actual_winner": match[3],
                        "confidence": match[4],
                        "action": match[5],
                        "tournament": match[6],
                        "surface": match[7],
                        "value_bet": "Yes" if match[8] else "No"
                    }
                    for match in recent_matches
                ],
                "tournament_breakdown": [
                    {
                        "tournament": tour[0],
                        "matches": tour[1],
                        "avg_confidence": f"{tour[2]:.1f}" if tour[2] else "N/A"
                    }
                    for tour in tournament_breakdown
                ] if include_tournaments else []
            }
            
            return CallToolResult(
                content=[{"type": "text", "text": json.dumps(result, indent=2)}],
                isError=False
            )
    
    finally:
        conn.close()

async def get_head_to_head(
    player1: str,
    player2: str,
    years_back: int = 2
) -> CallToolResult:
    """Get head-to-head statistics between two players."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            query = """
                SELECT prediction_day, predicted_winner, actual_winner, 
                       confidence_score, odds_player1, odds_player2,
                       tournament, surface, recommended_action
                FROM predictions 
                WHERE (player1 = %s AND player2 = %s) OR (player1 = %s AND player2 = %s)
                AND prediction_day >= CURRENT_DATE - INTERVAL '%s years'
                ORDER BY prediction_day DESC
            """
            cur.execute(query, (player1, player2, player2, player1, years_back))
            matches = cur.fetchall()
            
            if not matches:
                return CallToolResult(
                    content=[{"type": "text", "text": f"No head-to-head matches found between {player1} and {player2} in the last {years_back} years."}],
                    isError=False
                )
            
            # Calculate statistics
            p1_wins = sum(1 for match in matches if match[2] == player1)
            p2_wins = sum(1 for match in matches if match[2] == player2)
            total_matches = len(matches)
            
            # Calculate predictions accuracy for each player
            p1_predicted = sum(1 for match in matches if match[1] == player1)
            p2_predicted = sum(1 for match in matches if match[1] == player2)
            
            p1_prediction_accuracy = sum(1 for match in matches if match[1] == player1 and match[2] == player1) / p1_predicted * 100 if p1_predicted > 0 else 0
            p2_prediction_accuracy = sum(1 for match in matches if match[1] == player2 and match[2] == player2) / p2_predicted * 100 if p2_predicted > 0 else 0
            
            result = {
                "players": [player1, player2],
                "time_period": f"{years_back} years",
                "total_matches": total_matches,
                "wins": {
                    player1: p1_wins,
                    player2: p2_wins
                },
                "prediction_accuracies": {
                    player1: f"{p1_prediction_accuracy:.1f}%",
                    player2: f"{p2_prediction_accuracy:.1f}%"
                },
                "match_history": [
                    {
                        "date": match[0].strftime("%Y-%m-%d") if match[0] else "N/A",
                        "predicted_winner": match[1],
                        "actual_winner": match[2],
                        "confidence": match[3],
                        "odds": f"{match[4]:.2f} vs {match[5]:.2f}",
                        "tournament": match[6],
                        "surface": match[7],
                        "recommended_action": match[8]
                    }
                    for match in matches
                ]
            }
            
            return CallToolResult(
                content=[{"type": "text", "text": json.dumps(result, indent=2)}],
                isError=False
            )
    
    finally:
        conn.close()

async def get_form_analysis(
    players: List[str],
    matches_back: int = 10,
    days_back: int = 90
) -> CallToolResult:
    """Analyze recent form for multiple players."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            player_stats = {}
            
            for player in players:
                query = """
                    SELECT prediction_day, player1, player2, predicted_winner, actual_winner,
                           confidence_score, recommended_action, value_bet, odds_player1, odds_player2
                    FROM predictions 
                    WHERE (player1 = %s OR player2 = %s)
                    AND prediction_day >= CURRENT_DATE - INTERVAL '%s days'
                    ORDER BY prediction_day DESC
                    LIMIT %s
                """
                cur.execute(query, (player, player, days_back, matches_back))
                matches = cur.fetchall()
                
                if matches:
                    wins = sum(1 for match in matches if match[4] == player)
                    total_games = len(matches)
                    win_rate = (wins / total_games * 100) if total_games > 0 else 0
                    
                    # Predictions accuracy for this player
                    predicted_wins = sum(1 for match in matches if match[3] == player)
                    correct_predictions = sum(1 for match in matches if match[3] == player and match[4] == player)
                    prediction_accuracy = (correct_predictions / predicted_wins * 100) if predicted_wins > 0 else 0
                    
                    # Value bet success rate
                    value_bets = sum(1 for match in matches if match[7])
                    value_bet_wins = sum(1 for match in matches if match[7] and match[4] == player)
                    value_bet_success = (value_bet_wins / value_bets * 100) if value_bets > 0 else 0
                    
                    player_stats[player] = {
                        "matches_analyzed": total_games,
                        "win_rate": f"{win_rate:.1f}%",
                        "prediction_accuracy": f"{prediction_accuracy:.1f}%",
                        "value_bets": value_bets,
                        "value_bet_success_rate": f"{value_bet_success:.1f}%",
                        "recent_matches": [
                            {
                                "date": match[0].strftime("%Y-%m-%d"),
                                "opponent": match[1] if match[1] != player else match[2],
                                "result": "Win" if match[4] == player else "Loss",
                                "confidence": match[5],
                                "action": match[6],
                                "value_bet": "Yes" if match[7] else "No"
                            }
                            for match in matches
                        ]
                    }
                else:
                    player_stats[player] = {"error": "No recent matches found"}
            
            result = {
                "analysis_period": f"{days_back} days",
                "matches_per_player": matches_back,
                "player_stats": player_stats
            }
            
            return CallToolResult(
                content=[{"type": "text", "text": json.dumps(result, indent=2)}],
                isError=False
            )
    
    finally:
        conn.close()

async def get_surface_analysis(
    player_name: str,
    surfaces: Optional[List[str]] = None,
    time_period_days: int = 365
) -> CallToolResult:
    """Analyze player performance by court surface."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            query = """
                SELECT surface, COUNT(*) as total_matches,
                       AVG(confidence_score) as avg_confidence,
                       COUNT(CASE WHEN predicted_winner = actual_winner THEN 1 END) as correct_predictions,
                       COUNT(CASE WHEN value_bet THEN 1 END) as value_bets,
                       COUNT(CASE WHEN value_bet AND predicted_winner = actual_winner THEN 1 END) as value_bet_wins
                FROM predictions 
                WHERE (player1 = %s OR player2 = %s)
                AND prediction_day >= CURRENT_DATE - INTERVAL '%s days'
                GROUP BY surface
            """
            cur.execute(query, (player_name, player_name, time_period_days))
            surface_stats = cur.fetchall()
            
            result = {
                "player": player_name,
                "period_days": time_period_days,
                "surface_performance": {}
            }
            
            for surface, total_matches, avg_confidence, correct_predictions, value_bets, value_bet_wins in surface_stats:
                if surfaces and surface not in surfaces:
                    continue
                    
                accuracy_rate = (correct_predictions / total_matches * 100) if total_matches > 0 else 0
                value_bet_success_rate = (value_bet_wins / value_bets * 100) if value_bets > 0 else 0
                
                result["surface_performance"][surface] = {
                    "total_matches": total_matches,
                    "accuracy_rate": f"{accuracy_rate:.1f}%",
                    "average_confidence": f"{avg_confidence:.1f}" if avg_confidence else "N/A",
                    "value_bets": value_bets,
                    "value_bet_success_rate": f"{value_bet_success_rate:.1f}%"
                }
            
            return CallToolResult(
                content=[{"type": "text", "text": json.dumps(result, indent=2)}],
                isError=False
            )
    
    finally:
        conn.close()

# Additional implementations would follow the same pattern...
# I'll implement a few more key functions to demonstrate the capability

async def get_tournament_analysis(
    tournament_name: str,
    year: Optional[int] = None,
    include_surface_breakdown: bool = True
) -> CallToolResult:
    """Analyze tournament-specific trends and patterns."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            year_filter = f"AND EXTRACT(year FROM prediction_day) = {year}" if year else ""
            
            query = f"""
                SELECT surface, COUNT(*) as total_predictions,
                       AVG(confidence_score) as avg_confidence,
                       COUNT(CASE WHEN value_bet THEN 1 END) as value_bets,
                       COUNT(CASE WHEN predicted_winner = actual_winner THEN 1 END) as correct_predictions
                FROM predictions 
                WHERE tournament ILIKE %s {year_filter}
                GROUP BY surface
                ORDER BY total_predictions DESC
            """
            cur.execute(query, (f"%{tournament_name}%",))
            tournament_stats = cur.fetchall()
            
            result = {
                "tournament": tournament_name,
                "year": year or "All years",
                "surface_breakdown": {}
            }
            
            for surface, total_predictions, avg_confidence, value_bets, correct_predictions in tournament_stats:
                accuracy_rate = (correct_predictions / total_predictions * 100) if total_predictions > 0 else 0
                
                result["surface_breakdown"][surface] = {
                    "total_predictions": total_predictions,
                    "average_confidence": f"{avg_confidence:.1f}" if avg_confidence else "N/A",
                    "accuracy_rate": f"{accuracy_rate:.1f}%",
                    "value_bets": value_bets
                }
            
            return CallToolResult(
                content=[{"type": "text", "text": json.dumps(result, indent=2)}],
                isError=False
            )
    
    finally:
        conn.close()

async def get_odds_analysis(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    min_odds: float = 1.5,
    confidence_threshold: int = 70
) -> CallToolResult:
    """Analyze betting odds trends and identify value opportunities."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            date_filter = ""
            params = []
            
            if date_from and date_to:
                date_filter = "AND prediction_day BETWEEN %s AND %s"
                params = [date_from, date_to]
            elif date_from:
                date_filter = "AND prediction_day >= %s"
                params = [date_from]
            elif date_to:
                date_filter = "AND prediction_day <= %s"
                params = [date_to]
            
            query = f"""
                SELECT player1, player2, tournament, surface,
                       predicted_winner, odds_player1, odds_player2,
                       confidence_score, recommended_action, value_bet,
                       prediction_day, actual_winner
                FROM predictions 
                WHERE confidence_score >= %s
                AND (odds_player1 >= %s OR odds_player2 >= %s)
                {date_filter}
                ORDER BY confidence_score DESC, prediction_day DESC
                LIMIT 50
            """
            params = [confidence_threshold, min_odds, min_odds] + params
            cur.execute(query, params)
            odds_data = cur.fetchall()
            
            # Analyze odds patterns
            total_predictions = len(odds_data)
            value_bets = sum(1 for pred in odds_data if pred[9])
            high_confidence_predictions = sum(1 for pred in odds_data if pred[7] >= 85)
            
            result = {
                "analysis_period": f"{date_from or 'beginning'} to {date_to or 'today'}",
                "min_odds_threshold": min_odds,
                "confidence_threshold": confidence_threshold,
                "summary": {
                    "total_predictions": total_predictions,
                    "value_bets_identified": value_bets,
                    "high_confidence_predictions": high_confidence_predictions,
                    "value_bet_rate": f"{(value_bets/total_predictions*100):.1f}%" if total_predictions > 0 else "0%"
                },
                "opportunities": [
                    {
                        "match": f"{pred[0]} vs {pred[1]}",
                        "tournament": pred[2],
                        "surface": pred[3],
                        "prediction": f"{pred[4]} @ {pred[5]:.2f}" if pred[4] == pred[0] else f"{pred[4]} @ {pred[6]:.2f}",
                        "confidence": f"{pred[7]}%",
                        "action": pred[8],
                        "value_bet": "Yes" if pred[9] else "No",
                        "date": pred[10].strftime("%Y-%m-%d"),
                        "result": pred[11] if pred[11] else "Pending"
                    }
                    for pred in odds_data
                ]
            }
            
            return CallToolResult(
                content=[{"type": "text", "text": json.dumps(result, indent=2)}],
                isError=False
            )
    
    finally:
        conn.close()

async def get_value_opportunities(
    analysis_type: str,
    min_confidence: int = 65,
    limit: int = 15
) -> CallToolResult:
    """Identify advanced value betting opportunities."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            if analysis_type == "statistical":
                query = """
                    SELECT player1, player2, tournament, surface, predicted_winner,
                           odds_player1, odds_player2, confidence_score, prediction_day
                    FROM predictions 
                    WHERE confidence_score >= %s
                    AND (odds_player1 >= 2.0 OR odds_player2 >= 2.0)
                    AND prediction_day >= CURRENT_DATE - INTERVAL '7 days'
                    AND actual_winner IS NULL
                    ORDER BY confidence_score DESC, (odds_player1 + odds_player2)/2 DESC
                    LIMIT %s
                """
            elif analysis_type == "form-based":
                query = """
                    SELECT p.player1, p.player2, p.tournament, p.surface, p.predicted_winner,
                           p.odds_player1, p.odds_player2, p.confidence_score, p.prediction_day
                    FROM predictions p
                    LEFT JOIN predictions p2 ON (p.player1 = p2.player1 OR p.player1 = p2.player2 OR 
                                                p.player2 = p2.player1 OR p.player2 = p2.player2)
                    WHERE p.confidence_score >= %s
                    AND p2.prediction_day >= CURRENT_DATE - INTERVAL '30 days'
                    AND p.actual_winner IS NULL
                    GROUP BY p.player1, p.player2, p.tournament, p.surface, p.predicted_winner,
                             p.odds_player1, p.odds_player2, p.confidence_score, p.prediction_day
                    HAVING COUNT(p2.prediction_id) >= 3
                    ORDER BY p.confidence_score DESC
                    LIMIT %s
                """
            elif analysis_type == "surface-based":
                query = """
                    SELECT p.player1, p.player2, p.tournament, p.surface, p.predicted_winner,
                           p.odds_player1, p.odds_player2, p.confidence_score, p.prediction_day
                    FROM predictions p
                    WHERE p.confidence_score >= %s
                    AND p.surface IN ('hard', 'clay', 'grass')
                    AND p.actual_winner IS NULL
                    ORDER BY 
                        CASE WHEN p.surface = 'hard' THEN 
                            (SELECT AVG(confidence_score) FROM predictions 
                             WHERE (player1 = p.player1 OR player2 = p.player1 OR 
                                    player1 = p.player2 OR player2 = p.player2) 
                             AND surface = 'hard') 
                        END DESC
                    LIMIT %s
                """
            else:
                return CallToolResult(
                    content=[{"type": "text", "text": "Invalid analysis type. Choose from: statistical, form-based, surface-based"}],
                    isError=True
                )
            
            cur.execute(query, (min_confidence, limit))
            opportunities = cur.fetchall()
            
            result = {
                "analysis_type": analysis_type,
                "min_confidence": min_confidence,
                "opportunities": [
                    {
                        "match": f"{opp[0]} vs {opp[1]}",
                        "tournament": opp[2],
                        "surface": opp[3],
                        "prediction": f"{opp[4]} @ {opp[5]:.2f}" if opp[4] == opp[0] else f"{opp[4]} @ {opp[6]:.2f}",
                        "confidence": f"{opp[7]}%",
                        "date": opp[8].strftime("%Y-%m-%d")
                    }
                    for opp in opportunities
                ]
            }
            
            return CallToolResult(
                content=[{"type": "text", "text": json.dumps(result, indent=2)}],
                isError=False
            )
    
    finally:
        conn.close()

async def get_performance_trends(
    player_name: str,
    metric: str,
    period_days: int = 90,
    aggregation: str = "weekly"
) -> CallToolResult:
    """Analyze time-series performance data for trends."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            # Determine time grouping
            if aggregation == "daily":
                time_format = "DATE(prediction_day)"
            elif aggregation == "weekly":
                time_format = "DATE_TRUNC('week', prediction_day)"
            else:  # monthly
                time_format = "DATE_TRUNC('month', prediction_day)"
            
            if metric == "confidence_score":
                agg_function = "AVG(confidence_score)"
            elif metric == "win_rate":
                agg_function = """
                    COUNT(CASE WHEN predicted_winner = actual_winner THEN 1 END) * 100.0 / COUNT(*)
                """
            elif metric == "odds_accuracy":
                agg_function = """
                    COUNT(CASE WHEN predicted_winner = actual_winner THEN 1 END) * 100.0 / COUNT(*)
                """
            else:
                return CallToolResult(
                    content=[{"type": "text": f"Invalid metric: {metric}. Choose from: confidence_score, win_rate, odds_accuracy"}],
                    isError=True
                )
            
            query = f"""
                SELECT {time_format} as period, {agg_function} as metric_value
                FROM predictions 
                WHERE (player1 = %s OR player2 = %s)
                AND prediction_day >= CURRENT_DATE - INTERVAL '%s days'
                GROUP BY {time_format}
                ORDER BY period
            """
            cur.execute(query, (player_name, player_name, period_days))
            trend_data = cur.fetchall()
            
            # Calculate trend
            if len(trend_data) >= 2:
                recent_avg = sum(row[1] for row in trend_data[-3:]) / min(3, len(trend_data))
                earlier_avg = sum(row[1] for row in trend_data[:3]) / min(3, len(trend_data))
                trend_direction = "improving" if recent_avg > earlier_avg else "declining" if recent_avg < earlier_avg else "stable"
                trend_change = ((recent_avg - earlier_avg) / earlier_avg * 100) if earlier_avg > 0 else 0
            else:
                trend_direction = "insufficient_data"
                trend_change = 0
            
            result = {
                "player": player_name,
                "metric": metric,
                "period_days": period_days,
                "aggregation": aggregation,
                "trend_direction": trend_direction,
                "trend_change_percentage": f"{trend_change:.1f}%",
                "data_points": [
                    {
                        "period": row[0].strftime("%Y-%m-%d") if hasattr(row[0], 'strftime') else str(row[0]),
                        "value": f"{row[1]:.1f}" if metric == "confidence_score" else f"{row[1]:.1f}%"
                    }
                    for row in trend_data
                ]
            }
            
            return CallToolResult(
                content=[{"type": "text", "text": json.dumps(result, indent=2)}],
                isError=False
            )
    
    finally:
        conn.close()

if __name__ == "__main__":
    import sys
    from mcp.server.stdio import stdio_server
    
    async def main():
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options(),
            )
    
    asyncio.run(main())
