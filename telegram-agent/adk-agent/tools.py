import os
import requests
import re
from dotenv import load_dotenv
from google.adk.tools import FunctionTool
from typing import List, Dict, Any, Optional

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Import psycopg2 with fallback
try:
    import psycopg2
    DATABASE_AVAILABLE = True
except ImportError:
    psycopg2 = None
    DATABASE_AVAILABLE = False
    print("Warning: psycopg2 not available. Database functions will use fallback responses.")

def find_players_by_name(search_name: str, max_results: int = 5) -> List[Dict[str, str]]:
    """
    Find players in the database that match the given name.
    Handles partial matches, surnames, and fuzzy matching.
    
    Args:
        search_name: Player name or surname to search for
        max_results: Maximum number of matches to return
        
    Returns:
        List of player dictionaries with 'full_name' and 'match_type'
    """
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Clean the search name
        search_name = search_name.strip().title()
        
        # Try multiple matching strategies
        matches = []
        
        # Strategy 1: Exact match
        cur.execute("""
            SELECT DISTINCT player1 FROM predictions 
            WHERE LOWER(player1) = LOWER(%s)
            UNION
            SELECT DISTINCT player2 FROM predictions 
            WHERE LOWER(player2) = LOWER(%s)
        """, (search_name, search_name))
        exact_matches = cur.fetchall()
        matches.extend([{"full_name": match[0], "match_type": "exact"} for match in exact_matches])
        
        # Strategy 2: Surname match (if search name is likely a surname)
        if len(search_name.split()) == 1:
            cur.execute("""
                SELECT DISTINCT player1 FROM predictions 
                WHERE LOWER(SPLIT_PART(player1, ' ', -1)) = LOWER(%s)
                UNION
                SELECT DISTINCT player2 FROM predictions 
                WHERE LOWER(SPLIT_PART(player2, ' ', -1)) = LOWER(%s)
            """, (search_name, search_name))
            surname_matches = cur.fetchall()
            matches.extend([{"full_name": match[0], "match_type": "surname"} for match in surname_matches])
            
            # Strategy 3: Partial name match (contains search term)
            cur.execute("""
                SELECT DISTINCT player1 FROM predictions 
                WHERE LOWER(player1) LIKE LOWER(%s)
                UNION
                SELECT DISTINCT player2 FROM predictions 
                WHERE LOWER(player2) LIKE LOWER(%s)
            """, (f"%{search_name}%", f"%{search_name}%"))
            partial_matches = cur.fetchall()
            matches.extend([{"full_name": match[0], "match_type": "partial"} for match in partial_matches])
        
        # Remove duplicates and limit results
        unique_matches = []
        seen_names = set()
        for match in matches:
            if match["full_name"] not in seen_names:
                unique_matches.append(match)
                seen_names.add(match["full_name"])
                if len(unique_matches) >= max_results:
                    break
        
        return unique_matches
        
    except ImportError:
        # psycopg2 not available - return empty list for database-dependent matching
        print("Database connection not available for player matching")
        return []
    except Exception as e:
        print(f"Error finding players: {e}")
        return []
    finally:
        if conn:
            cur.close()
            conn.close()

def expand_player_name(player_input: str) -> List[str]:
    """
    Expand a player input (surname or partial name) into full player names.
    Returns a list of potential full names that match the input.
    
    Args:
        player_input: Player name, surname, or partial name
        
    Returns:
        List of full player names that match
    """
    player_input = player_input.strip()
    
    try:
        # First try exact match
        exact_matches = find_players_by_name(player_input, max_results=1)
        if exact_matches and exact_matches[0]["match_type"] == "exact":
            return [exact_matches[0]["full_name"]]
        
        # If no exact match, find all potential matches
        all_matches = find_players_by_name(player_input, max_results=10)
        
        if not all_matches:
            return []
        
        # If only one match, return it
        if len(all_matches) == 1:
            return [all_matches[0]["full_name"]]
        
        # Multiple matches - return all of them for user disambiguation
        return [match["full_name"] for match in all_matches]
        
    except ImportError:
        # Database not available - return the input as-is if it looks like a complete name
        # or return empty list to trigger fallback message
        if len(player_input.split()) > 1:
            return [player_input.title()]
        else:
            return []  # Surname without database - let the calling function handle fallback

def get_player_matchups(player_name: str, limit: int = 20) -> str:
    """
    Get matchups for a specific player by name, supporting partial name matching.
    
    Args:
        player_name: Player name (can be full name, surname, or partial match)
        limit: Maximum number of matchups to return
    """
    conn = None
    try:
        # Expand player name to find full matches
        full_player_names = expand_player_name(player_name)
        
        if not full_player_names:
            return f"I couldn't find any players matching '{player_name}'. Please try a different name or check the spelling."
        
        # If multiple players found, list them for disambiguation
        if len(full_player_names) > 1:
            player_list = "\n".join([f"• {name}" for name in full_player_names])
            return f"I found multiple players matching '{player_name}':\n\n{player_list}\n\nWhich player are you interested in? Please be more specific."
        
        # Single player found - proceed with query
        player_name = full_player_names[0]
        
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        query = """
            SELECT 
                p.prediction_id, p.player1, p.player2, p.tournament, p.surface,
                p.predicted_winner, p.odds_player1, p.odds_player2,
                p.confidence_score, p.recommended_action, p.prediction_day,
                p.value_bet, p.learning_phase,
                lm.live_status, lm.live_score, p.actual_winner
            FROM predictions p
            LEFT JOIN live_matches lm ON p.match_id = lm.match_identifier
            WHERE (p.player1 = %s OR p.player2 = %s)
            ORDER BY p.prediction_day DESC, p.confidence_score DESC
            LIMIT %s
        """
        cur.execute(query, (player_name, player_name, limit))
        matchups = cur.fetchall()
        
        if not matchups:
            return f"No matchups found for {player_name}."
        
        # Format results
        output = f"*Matchups for {player_name}*\n\n"
        for match in matchups:
            opponent = match[2] if match[1] == player_name else match[1]
            predicted_odds = float(match[7]) if match[5] == player_name else float(match[8])
            outcome = ""
            if match[15]:  # actual_winner
                outcome = f" (Result: {match[15]})"
            
            status = match[13] or "not started" if not match[15] else "completed"
            
            output += f"• *{player_name} vs {opponent}*\n"
            output += f"  {match[3]} • {match[4]}\n"
            output += f"  Prediction: {match[5]} @ {predicted_odds:.2f} ({match[9]}% confidence)\n"
            output += f"  Status: {status}{outcome}\n\n"
        
        output += f"*Found {len(matchups)} matchups for {player_name}*"
        return output
        
    except ImportError:
        # Fallback when psycopg2 is not available
        return f"I want to show you {player_name}'s matchups, but I'm having trouble accessing the database right now. Please try again in a moment, or try a different player name."
    except Exception as e:
        print(f"Error getting player matchups: {e}")
        return f"Error retrieving matchups: {e}"
    finally:
        if conn:
            cur.close()
            conn.close()

def analyze_player_performance(player_name: str, matches_back: int = 20) -> str:
    """
    Analyze a player's recent performance, supporting partial name matching.
    
    Args:
        player_name: Player name (can be full name, surname, or partial match)
        matches_back: Number of recent matches to analyze
    """
    conn = None
    try:
        # Expand player name to find full matches
        full_player_names = expand_player_name(player_name)
        
        if not full_player_names:
            return f"I couldn't find any players matching '{player_name}'. Please try a different name or check the spelling."
        
        if len(full_player_names) > 1:
            player_list = "\n".join([f"• {name}" for name in full_player_names])
            return f"I found multiple players matching '{player_name}':\n\n{player_list}\n\nWhich player are you interested in?"
        
        player_name = full_player_names[0]
        
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        query = """
            SELECT 
                p.player1, p.player2, p.predicted_winner, p.actual_winner,
                p.confidence_score, p.recommended_action, p.prediction_day,
                p.tournament, p.surface, p.value_bet, p.odds_player1, p.odds_player2
            FROM predictions p
            WHERE (p.player1 = %s OR p.player2 = %s)
            ORDER BY p.prediction_day DESC
            LIMIT %s
        """
        cur.execute(query, (player_name, player_name, matches_back))
        matches = cur.fetchall()
        
        if not matches:
            return f"No performance data found for {player_name}."
        
        # Calculate statistics
        total_matches = len(matches)
        wins = sum(1 for match in matches if match[3] == player_name)
        predicted_as_favorite = sum(1 for match in matches if match[2] == player_name)
        correct_predictions = sum(1 for match in matches if match[2] == player_name and match[3] == player_name)
        
        win_rate = (wins / total_matches * 100) if total_matches > 0 else 0
        prediction_accuracy = (correct_predictions / predicted_as_favorite * 100) if predicted_as_favorite > 0 else 0
        
        # Format analysis
        output = f"*Performance Analysis: {player_name}*\n\n"
        output += f"*Recent Statistics (last {total_matches} matches):*\n"
        output += f"• Win Rate: {win_rate:.1f}% ({wins}/{total_matches})\n"
        output += f"• Prediction Accuracy: {prediction_accuracy:.1f}% ({correct_predictions}/{predicted_as_favorite})\n\n"
        
        # Show recent form
        output += "*Recent Matches:*\n"
        for match in matches[:5]:  # Show last 5 matches
            opponent = match[1] if match[0] == player_name else match[0]
            result = "Won" if match[3] == player_name else "Lost" if match[3] else "Pending"
            prediction_correct = "✓" if match[2] == player_name and match[3] == player_name else "✗" if match[3] else "?"
            
            output += f"• {opponent} ({match[7][:20]}...) - {result} {prediction_correct}\n"
        
        return output
        
    except ImportError:
        # Fallback when psycopg2 is not available
        return f"I want to analyze {player_name}'s performance, but I'm having trouble accessing the database right now. Please try again in a moment, or try a different player name."
    except Exception as e:
        print(f"Error analyzing player performance: {e}")
        return f"Error analyzing performance: {e}"
    finally:
        if conn:
            cur.close()
            conn.close()

def get_predictions(
    action: Optional[str] = None,
    min_odds: Optional[float] = None,
    min_confidence: Optional[int] = None,
    date: Optional[str] = None,
    tournament: Optional[str] = None,
    surface: Optional[str] = None,
    limit: int = 20,
) -> str:
    """
    Get tennis predictions from the database with optional filters.
    Returns predictions for today or specified date with details like players, odds, confidence, and recommended action.

    Args:
        action: Filter by recommended action (e.g., "bet", "monitor", "skip").
        min_odds: Filter by minimum predicted odds (e.g., 1.5, 2.0).
        min_confidence: Filter by minimum confidence score (0-100).
        date: Date in YYYY-MM-DD format (defaults to today).
        tournament: Filter by tournament name.
        surface: Filter by court surface (e.g., "hard", "clay", "grass").
        limit: Maximum number of results (default: 20).
    """
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        query = """
            SELECT
                p.prediction_id, p.player1, p.player2, p.tournament, p.surface,
                p.predicted_winner, p.odds_player1, p.odds_player2,
                p.confidence_score, p.recommended_action, p.prediction_day,
                p.value_bet, p.learning_phase,
                lm.live_status, lm.live_score, lm.actual_winner
            FROM predictions p
            LEFT JOIN live_matches lm ON p.match_id = lm.match_identifier
            WHERE p.prediction_day = COALESCE(%s::date, CURRENT_DATE)
        """
        params = [date]

        if action:
            query += " AND p.recommended_action = %s"
            params.append(action)
        if min_confidence is not None:
            query += " AND p.confidence_score >= %s"
            params.append(min_confidence)
        if tournament:
            query += " AND p.tournament ILIKE %s"
            params.append(f"%{tournament}%")
        if surface:
            query += " AND p.surface = %s"
            params.append(surface)

        query += " ORDER BY p.confidence_score DESC LIMIT %s"
        params.append(limit)

        cur.execute(query, params)
        predictions = cur.fetchall()

        formatted_predictions = []
        for p in predictions:
            predicted_odds = float(p[7]) if p[5] == p[1] else float(p[8]) # odds_player1 or odds_player2
            if min_odds is not None and predicted_odds < min_odds:
                continue

            formatted_predictions.append({
                "id": p[0],
                "matchup": f"{p[1]} vs {p[2]}",
                "tournament": p[3],
                "surface": p[4],
                "prediction": f"{p[5]} @ {predicted_odds:.2f}",
                "confidence": f"{p[9]}%",
                "action": p[10],
                "value_bet": "✓ Value Bet" if p[11] else "",
                "status": p[13] or "not started",
                "result": f"Winner: {p[15]}" if p[15] else "",
            })

        if not formatted_predictions:
            return "No predictions found matching your criteria."

        output = f"Found {len(formatted_predictions)} predictions:\n\n"
        for idx, p in enumerate(formatted_predictions[:10]):
            output += f"{idx + 1}. *{p['matchup']}*\n"
            output += f"   {p['tournament']} • {p['surface']}\n"
            output += f"   {p['prediction']} ({p['confidence']})\n"
            output += f"   Action: {p['action']}{f' • {p['value_bet']}' if p['value_bet'] else ''}\n\n"

        if len(formatted_predictions) > 10:
            output += f"\n...and {len(formatted_predictions) - 10} more"

        return output

    except Exception as e:
        print(f"Error in get_predictions: {e}")
        return f"Error retrieving predictions: {e}"
    finally:
        if conn:
            cur.close()
            conn.close()

def analyze_matchup(
    player1: str,
    player2: str,
    llm: str = "perplexity",
    focus: Optional[str] = None,
) -> str:
    """
    Analyze a tennis matchup using Perplexity or Gemini AI.
    Provides insights on player statistics, recent form, head-to-head records, and other factors.
    
    ENHANCED: Now supports partial player name matching (surnames work!)

    Args:
        player1: First player name (can be surname like "Djokovic" or partial name).
        player2: Second player name (can be surname like "Nadal" or partial name).
        llm: Which LLM to use for analysis (default: "perplexity", options: "perplexity", "gemini").
        focus: Specific aspect to analyze (e.g., 'head-to-head', 'recent-form', 'surface-preference').
    """
    # First, try to resolve partial player names to full names
    full_player1_names = expand_player_name(player1)
    full_player2_names = expand_player_name(player2)
    
    if not full_player1_names:
        return f"I couldn't find any players matching '{player1}'. Please try a different name or check the spelling."
    
    if not full_player2_names:
        return f"I couldn't find any players matching '{player2}'. Please try a different name or check the spelling."
    
    # Handle multiple matches for either player
    if len(full_player1_names) > 1:
        player_list = "\n".join([f"• {name}" for name in full_player1_names])
        return f"I found multiple players matching '{player1}':\n\n{player_list}\n\nWhich player are you interested in? Please be more specific."
    
    if len(full_player2_names) > 1:
        player_list = "\n".join([f"• {name}" for name in full_player2_names])
        return f"I found multiple players matching '{player2}':\n\n{player_list}\n\nWhich player are you interested in? Please be more specific."
    
    # Use resolved full names
    player1 = full_player1_names[0]
    player2 = full_player2_names[0]
    
    query = f"Analyze the tennis matchup between {player1} and {player2}"
    if focus:
        query += f". Focus on {focus}"
    query += ". Provide insights on their playing style, recent form, and prediction."

    try:
        if llm == "perplexity":
            headers = {"Authorization": f"Bearer {PERPLEXITY_API_KEY}"}
            payload = {
                "model": "sonar",
                "messages": [{"role": "user", "content": query}],
                "temperature": 0.7,
                "max_tokens": 1000,
            }
            response = requests.post("https://api.perplexity.ai/chat/completions", json=payload, headers=headers)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        elif llm == "gemini":
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{"parts": [{"text": query}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1000},
            }
            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GOOGLE_API_KEY}",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            return response.json()["candidates"][0]["content"]["parts"][0]["text"]
        else:
            return "Invalid LLM specified. Choose 'perplexity' or 'gemini'."
    except Exception as e:
        print(f"Error in analyze_matchup: {e}")
        return f"Error analyzing matchup: {e}"

def get_value_bets(
    limit: int = 10,
    date: Optional[str] = None,
) -> str:
    """
    Get all predictions identified as value bets (favorable odds relative to confidence).

    Args:
        limit: Maximum number of value bets to return (default: 10).
        date: Date in YYYY-MM-DD format (defaults to today).
    """
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        query = """
            SELECT
                p.prediction_id, p.player1, p.player2, p.tournament,
                p.predicted_winner, p.odds_player1, p.odds_player2,
                p.confidence_score, p.learning_phase
            FROM predictions p
            WHERE p.value_bet = true
              AND p.prediction_day = COALESCE(%s::date, CURRENT_DATE)
            ORDER BY p.confidence_score DESC
            LIMIT %s
        """
        params = [date, limit]

        cur.execute(query, params)
        value_bets = cur.fetchall()

        if not value_bets:
            return f"No value bets found for {date or 'today'}."

        output = f"*Value Bets for {date or 'Today'}*\n\n"
        for idx, p in enumerate(value_bets):
            predicted_odds = float(p[6]) if p[4] == p[1] else float(p[7]) # odds_player1 or odds_player2
            output += f"{idx + 1}. *{p[1]} vs {p[2]}*\n"
            output += f"   {p[3]}\n"
            output += f"   {p[4]} @ {predicted_odds:.2f} ({p[7]}% confidence)\n\n"

        return output

    except Exception as e:
        print(f"Error in get_value_bets: {e}")
        return f"Error retrieving value bets: {e}"
    finally:
        if conn:
            cur.close()
            conn.close()

# Create FunctionTool instances - the ADK automatically extracts name and docstring from the function
get_predictions_tool = FunctionTool(get_predictions)
analyze_matchup_tool = FunctionTool(analyze_matchup)
get_value_bets_tool = FunctionTool(get_value_bets)

# Enhanced player matching tools
get_player_matchups_tool = FunctionTool(get_player_matchups)
analyze_player_performance_tool = FunctionTool(analyze_player_performance)
