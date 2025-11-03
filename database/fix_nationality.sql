-- Fix missing nationality data in players table
-- This script updates players table with nationality information from scraped matches

-- Update nationality for existing players based on recent match data
UPDATE players 
SET nationality = match_data.nationality
FROM (
  SELECT 
    DISTINCT ON (player_name) player_name, nationality
  FROM (
    -- Get nationality from player1 in matches
    SELECT 
      player1 as player_name, 
      nationality1 as nationality,
      match_date
    FROM matches 
    WHERE nationality1 IS NOT NULL AND nationality1 != ''
    
    UNION ALL
    
    -- Get nationality from player2 in matches  
    SELECT 
      player2 as player_name, 
      nationality2 as nationality,
      match_date
    FROM matches 
    WHERE nationality2 IS NOT NULL AND nationality2 != ''
  ) all_nationalities
  ORDER BY player_name, match_date DESC
) match_data
WHERE players.player_name = match_data.player_name
  AND (players.nationality IS NULL OR players.nationality = '');

-- Alternative approach using predictions table (more recent data)
UPDATE players 
SET nationality = pred_data.nationality
FROM (
  SELECT 
    DISTINCT ON (player_name) player_name, nationality
  FROM (
    -- Get nationality from player1 predictions
    SELECT 
      player1 as player_name, 
      COALESCE(predictions.nationality1, 'Unknown') as nationality,
      prediction_date
    FROM predictions 
    WHERE nationality1 IS NOT NULL AND nationality1 != ''
    
    UNION ALL
    
    -- Get nationality from player2 predictions
    SELECT 
      player2 as player_name, 
      COALESCE(predictions.nationality2, 'Unknown') as nationality,
      prediction_date
    FROM predictions 
    WHERE nationality2 IS NOT NULL AND nationality2 != ''
  ) all_nationalities
  ORDER BY player_name, prediction_date DESC
) pred_data
WHERE players.player_name = pred_data.player_name
  AND (players.nationality IS NULL OR players.nationality = '');

-- Verify the update
SELECT 
  player_name,
  nationality,
  total_matches,
  last_match_date
FROM players 
WHERE nationality IS NOT NULL AND nationality != ''
ORDER BY total_matches DESC, player_name
LIMIT 20;

-- Check for players still missing nationality
SELECT 
  COUNT(*) as total_players,
  COUNT(nationality) as players_with_nationality,
  COUNT(*) - COUNT(nationality) as players_missing_nationality
FROM players;
