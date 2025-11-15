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
            predicted_odds = float(p[6]) if p[5] == p[1] else float(p[7]) # odds_player1 or odds_player2
            if min_odds is not None and predicted_odds < min_odds:
                continue

            formatted_predictions.append({
                "id": p[0],
                "matchup": f"{p[1]} vs {p[2]}",
                "tournament": p[3],
                "surface": p[4],
                "prediction": f"{p[5]} @ {predicted_odds:.2f}",
                "confidence": f"{p[8]}%",
                "action": p[9],
                "value_bet": "✓ Value Bet" if p[11] else "",
                "status": p[13] or "not started",
                "result": f"Winner: {p[15]}" if p[15] else "",
            })

        if not formatted_predictions:
            if min_odds and min_odds >= 2.0:
                # For high odds requests, get predictions without the strict filter
                cur.execute(query.replace("AND p.confidence_score >= %s", "").replace("AND p.recommended_action = %s", "").replace("AND p.tournament ILIKE %s", "").replace("AND p.surface = %s", ""), [date, limit])
                fallback_predictions = cur.fetchall()
                
                if not fallback_predictions:
                    return f"No predictions found for {date or 'today'}."
                
                fallback_output = f"Note: Only found {len(fallback_predictions)} predictions (no high odds available). Here are all predictions:\n\n"
                for idx, p in enumerate(fallback_predictions[:limit]):
                    predicted_odds = float(p[6]) if p[5] == p[1] else float(p[7])
                    fallback_output += f"{idx + 1}. {p[1]} vs {p[2]}\n"
                    fallback_output += f"   {p[3]} • {p[4]}\n"
                    fallback_output += f"   {p[5]} @ {predicted_odds:.2f} ({p[8]}% confidence)\n"
                    fallback_output += f"   Action: {p[9]}\n\n"
                
                return fallback_output
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
            predicted_odds = float(p[5]) if p[4] == p[1] else float(p[6]) # odds_player1 or odds_player2
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


def run_morning_workflow(
    mode: str = "--today",
    filter_mode: str = "--strip-scores",
    days_back: Optional[int] = None,
    days_forward: int = 0
) -> str:
    """
    Run the morning tennis data scraper workflow.
    
    This function executes the JavaScript scraper to collect today's matches
    and sends the results to the n8n webhook for predictions processing.
    
    Args:
        mode: Scraping mode - '--today', '--single-day N', or '--days-back N'
        filter_mode: Data filter - '--all', '--pending', '--finished', or '--strip-scores'  
        days_back: Number of days back for '--days-back' mode (optional)
        days_forward: Number of days forward to scrape (limited by scraper capabilities)
    Note:
        The underlying scraper only supports backward scraping. For tomorrow's matches,
        use mode='--today' as Flashscore typically posts tomorrow's schedule by evening.
    """
    import subprocess
    import os
    from datetime import datetime
    
    try:
        root_dir = "/opt/tennis-scraper"
        script_path = os.path.join(root_dir, "scrape-with-date.js")
        
        # Validate script exists
        if not os.path.exists(script_path):
            return f"❌ Scraper script not found at {script_path}"
        
        # Handle forward scraping with the updated scraper capabilities
        if days_forward > 0:
            if days_forward <= 7:  # Reasonable limit for forward scraping
                mode = "--days-forward"
                days_arg = days_forward
                output_file = f"matches-{datetime.now().strftime('%Y-%m-%d')}-forward-{days_forward}d.json"
            else:
                return f"❌ Forward scraping {days_forward} days not supported. " \
                       f"Maximum forward look: 7 days ahead. Try `days_forward=1` for tomorrow's matches."
        
        # Build command
        cmd = ["node", script_path]
        
        # Add mode and days argument
        if days_forward > 0 and days_forward <= 7:
            cmd.extend(["--days-forward", str(days_forward)])
            mode = "forward"
        elif mode == "--days-back" and days_back:
            cmd.extend(["--days-back", str(days_back)])
        elif mode == "--single-day" and days_back:
            cmd.extend(["--single-day", str(days_back)])
        else:
            cmd.append("--today")
            mode = "today"
        
        # Add filter mode
        cmd.append(filter_mode)
        
        # Set working directory
        os.chdir(root_dir)
        
        print(f"🔄 Running morning workflow: {' '.join(cmd)}")
        
        # Execute scraper with timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            cwd=root_dir
        )
        
        if result.returncode != 0:
            return f"❌ Scraper failed with return code {result.returncode}\nError: {result.stderr}"
        
        # Determine output file based on mode
        if days_forward > 0 and days_forward <= 7:
            start_date = datetime.now() + timedelta(days=1)
            end_date = start_date + timedelta(days=days_forward-1)
            output_file = f"matches-{start_date.strftime('%Y-%m-%d')}-to-{end_date.strftime('%Y-%m-%d')}-strip-scores.json"
        elif mode == "--today":
            output_file = f"matches-{datetime.now().strftime('%Y-%m-%d')}-strip-scores.json"
        elif mode == "--single-day" and days_back:
            target_date = datetime.now() + timedelta(days=-days_back)
            output_file = f"matches-{target_date.strftime('%Y-%m-%d')}-finished.json"
        else:
            output_file = f"matches-{datetime.now().strftime('%Y-%m-%d')}-strip-scores.json"
        
        output_path = os.path.join(root_dir, output_file)
        
        if not os.path.exists(output_path):
            return f"❌ Expected output file '{output_file}' was not created"
        
        # Send to n8n webhook
        webhook_url = "http://193.24.209.9:5678/webhook/tennis-predictions"
        
        with open(output_path, 'rb') as f:
            file_data = f.read()
            webhook_result = subprocess.run(
                ["curl", "-X", "POST", "-H", "Content-Type: application/json", 
                 "--data-binary", "@-", webhook_url],
                input=file_data,
                capture_output=True,
                text=True,
                timeout=60  # 1 minute timeout for webhook
            )
        
        if webhook_result.returncode != 0:
            return f"⚠️ Scraper completed but webhook failed\nOutput: {result.stdout}\nWebhook Error: {webhook_result.stderr}"
        
        # Success response
        file_size = os.path.getsize(output_path) / 1024  # KB
        
        if days_forward > 0 and days_forward <= 7:
            if days_forward == 1:
                webhook_type = "tennis-predictions"
                response_msg = f"✅ Forward workflow completed successfully!\n\n📊 Results:\n- Tomorrow's matches saved to: {output_file}\n- File size: {file_size:.1f} KB\n- Data sent to n8n webhook: {webhook_type}"
            else:
                webhook_type = "tennis-predictions"
                response_msg = f"✅ Forward workflow completed successfully!\n\n📊 Results:\n- Next {days_forward} days matches saved to: {output_file}\n- File size: {file_size:.1f} KB\n- Data sent to n8n webhook: {webhook_type}"
        else:
            response_msg = f"✅ Morning workflow completed successfully!\n\n📊 Results:\n- Scraped matches saved to: {output_file}\n- File size: {file_size:.1f} KB\n- Data sent to n8n webhook: tennis-predictions"
        
        return f"{response_msg}\n\n📝 Scraper output:\n{result.stdout[:500]}{'...' if len(result.stdout) > 500 else ''}"
        
    except subprocess.TimeoutExpired:
        return "❌ Workflow timeout after 5 minutes - scraper may be stuck"
    except Exception as e:
        return f"❌ Workflow failed: {str(e)}"


def run_evening_workflow(
    days_back: int = 1,
    mode: str = "--single-day"
) -> str:
    """
    Run the evening tennis data scraper workflow.
    
    This function executes the JavaScript scraper to collect yesterday's matches
    with results and sends the data to the n8n webhook for evening processing.
    
    Args:
        days_back: Days back from today to scrape (default: 1 for yesterday)
        mode: Scraping mode - '--single-day' or '--days-back'
    """
    import subprocess
    import os
    from datetime import datetime, timedelta
    
    try:
        root_dir = "/opt/tennis-scraper"
        script_path = os.path.join(root_dir, "scrape-with-date.js")
        
        # Validate script exists
        if not os.path.exists(script_path):
            return f"❌ Scraper script not found at {script_path}"
        
        # Calculate target date
        target_date = datetime.now() - timedelta(days=days_back)
        output_file = f"matches-{target_date.strftime('%Y-%m-%d')}-finished.json"
        
        # Build command
        if mode == "--days-back":
            cmd = ["node", script_path, "--days-back", str(days_back), "--finished"]
        else:
            cmd = ["node", script_path, "--single-day", str(days_back), "--finished"]
        
        # Set working directory
        os.chdir(root_dir)
        
        print(f"🔄 Running evening workflow: {' '.join(cmd)}")
        
        # Execute scraper with timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            cwd=root_dir
        )
        
        if result.returncode != 0:
            return f"❌ Scraper failed with return code {result.returncode}\nError: {result.stderr}"
        
        output_path = os.path.join(root_dir, output_file)
        
        if not os.path.exists(output_path):
            return f"❌ Expected output file '{output_file}' was not created"
        
        # Send to n8n webhook
        webhook_url = "http://193.24.209.9:5678/webhook/tennis-results"
        
        with open(output_path, 'rb') as f:
            file_data = f.read()
            webhook_result = subprocess.run(
                ["curl", "-X", "POST", "-H", "Content-Type: application/json", 
                 "--data-binary", "@-", webhook_url],
                input=file_data,
                capture_output=True,
                text=True,
                timeout=60  # 1 minute timeout for webhook
            )
        
        if webhook_result.returncode != 0:
            return f"⚠️ Scraper completed but webhook failed\nOutput: {result.stdout}\nWebhook Error: {webhook_result.stderr}"
        
        # Success response
        file_size = os.path.getsize(output_path) / 1024  # KB
        return f"✅ Evening workflow completed successfully!\n\n📊 Results:\n- Target date: {target_date.strftime('%Y-%m-%d')}\n- Output file: {output_file}\n- File size: {file_size:.1f} KB\n- Data sent to n8n webhook: tennis-results\n\n📝 Scraper output:\n{result.stdout[:500]}{'...' if len(result.stdout) > 500 else ''}"
        
    except subprocess.TimeoutExpired:
        return "❌ Workflow timeout after 5 minutes - scraper may be stuck"
    except Exception as e:
        return f"❌ Workflow failed: {str(e)}"


def run_live_scraper() -> str:
    """
    Run the live tennis scores scraper.
    
    This function executes the live scores scraper to update ongoing match
    statuses and scores in the database.
    """
    import subprocess
    import os
    
    try:
        root_dir = "/opt/tennis-scraper"
        script_path = os.path.join(root_dir, "scrape-live-scores.js")
        
        # Validate script exists
        if not os.path.exists(script_path):
            return f"❌ Live scraper script not found at {script_path}"
        
        # Set working directory and execute
        os.chdir(root_dir)
        
        print(f"🔄 Running live scraper: node {script_path}")
        
        result = subprocess.run(
            ["node", script_path],
            capture_output=True,
            text=True,
            timeout=180,  # 3 minute timeout for live scraper
            cwd=root_dir
        )
        
        if result.returncode != 0:
            return f"❌ Live scraper failed with return code {result.returncode}\nError: {result.stderr}"
        
        return f"✅ Live scraper completed successfully!\n\n📝 Output:\n{result.stdout[:1000]}{'...' if len(result.stdout) > 1000 else ''}"
        
    except subprocess.TimeoutExpired:
        return "❌ Live scraper timeout after 3 minutes"
    except Exception as e:
        return f"❌ Live scraper failed: {str(e)}"


def get_workflow_status() -> str:
    """
    Check the status of recent workflow executions and available output files.
    """
    import os
    from datetime import datetime, timedelta
    
    try:
        root_dir = "/opt/tennis-scraper"
        
        # Check for recent output files
        status_info = "📊 Workflow Status Report\n\n"
        
        # Check morning files (strip-scores)
        today = datetime.now().strftime('%Y-%m-%d')
        morning_file = f"matches-{today}-strip-scores.json"
        morning_path = os.path.join(root_dir, morning_file)
        
        if os.path.exists(morning_path):
            file_time = datetime.fromtimestamp(os.path.getmtime(morning_path))
            file_size = os.path.getsize(morning_path) / 1024
            status_info += f"✅ Morning data: {morning_file}\n"
            status_info += f"   Modified: {file_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            status_info += f"   Size: {file_size:.1f} KB\n\n"
        else:
            status_info += f"❌ Morning data: {morning_file} (not found)\n\n"
        
        # Check evening files (finished)
        for days_back in [1, 2, 3]:  # Check last 3 days
            target_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
            evening_file = f"matches-{target_date}-finished.json"
            evening_path = os.path.join(root_dir, evening_file)
            
            if os.path.exists(evening_path):
                file_time = datetime.fromtimestamp(os.path.getmtime(evening_path))
                file_size = os.path.getsize(evening_path) / 1024
                status_info += f"✅ Evening data: {evening_file}\n"
                status_info += f"   Modified: {file_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
                status_info += f"   Size: {file_size:.1f} KB\n\n"
                break
        
        # Check log directory
        log_dir = os.path.join(root_dir, "logs")
        if os.path.exists(log_dir):
            status_info += f"📁 Log directory: {log_dir}\n"
        else:
            status_info += f"📁 Log directory: Not found\n"
        
        return status_info
        
    except Exception as e:
        return f"❌ Status check failed: {str(e)}"

# Create FunctionTool instances - the ADK automatically extracts name and docstring from the function
get_predictions_tool = FunctionTool(get_predictions)
analyze_matchup_tool = FunctionTool(analyze_matchup)
get_value_bets_tool = FunctionTool(get_value_bets)
run_morning_workflow_tool = FunctionTool(run_morning_workflow)
run_evening_workflow_tool = FunctionTool(run_evening_workflow)
run_live_scraper_tool = FunctionTool(run_live_scraper)
get_workflow_status_tool = FunctionTool(get_workflow_status)

# Enhanced player matching tools
get_player_matchups_tool = FunctionTool(get_player_matchups)
analyze_player_performance_tool = FunctionTool(analyze_player_performance)
