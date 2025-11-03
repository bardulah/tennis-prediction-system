# Test Data for Tennis Prediction System
# This file contains sample data for development and testing

-- Insert sample players for testing
INSERT INTO players (player_name, nationality, total_matches, total_wins, total_losses, win_rate_overall, last_match_date) VALUES
('Novak Djokovic', 'Serbia', 1200, 980, 220, 81.67, '2025-11-02'),
('Carlos Alcaraz', 'Spain', 150, 120, 30, 80.00, '2025-11-02'),
('Jannik Sinner', 'Italy', 200, 160, 40, 80.00, '2025-11-02'),
('Daniil Medvedev', 'Russia', 400, 320, 80, 80.00, '2025-11-02'),
('Alexander Zverev', 'Germany', 350, 280, 70, 80.00, '2025-11-01'),
('Rafael Nadal', 'Spain', 1500, 1200, 300, 80.00, '2025-10-30'),
('Roger Federer', 'Switzerland', 2000, 1600, 400, 80.00, '2025-10-28'),
('Stefanos Tsitsipas', 'Greece', 300, 240, 60, 80.00, '2025-11-01'),
('Casper Ruud', 'Norway', 250, 200, 50, 80.00, '2025-11-02'),
('Taylor Fritz', 'USA', 200, 160, 40, 80.00, '2025-11-02');

-- Insert sample matches for testing
INSERT INTO matches (
    match_unique_id, match_date, tournament, country, surface,
    player1, player1_nationality, player2, player2_nationality,
    odds_player1, odds_player2, winner, loser, score, is_upset
) VALUES
('ATP_Finals_2025-11-02_Novak_Djokovic_Carlos_Alcaraz', '2025-11-02', 'ATP Finals', 'Italy', 'Hard',
 'Novak Djokovic', 'Serbia', 'Carlos Alcaraz', 'Spain',
 1.85, 1.95, 'Carlos Alcaraz', 'Novak Djokovic', '6-4 7-6(4)', false),
 
('Paris_Masters_2025-11-01_Jannik_Sinner_Daniil_Medvedev', '2025-11-01', 'Paris Masters', 'France', 'Hard',
 'Jannik Sinner', 'Italy', 'Daniil Medvedev', 'Russia',
 2.10, 1.70, 'Jannik Sinner', 'Daniil Medvedev', '7-6(5) 6-4', true),
 
('Vienna_Open_2025-10-31_Alexander_Zverev_Stefanos_Tsitsipas', '2025-10-31', 'Vienna Open', 'Austria', 'Hard',
 'Alexander Zverev', 'Germany', 'Stefanos Tsitsipas', 'Greece',
 1.75, 2.05, 'Alexander Zverev', 'Stefanos Tsitsipas', '6-3 6-4', false);

-- Insert sample predictions for testing
INSERT INTO predictions (
    match_id, prediction_day, tournament, surface,
    player1, player2, odds_player1, odds_player2,
    predicted_winner, confidence_score, reasoning,
    risk_assessment, recommended_action
) VALUES
('ATP_Finals_2025-11-02_Novak_Djokovic_Carlos_Alcaraz', '2025-11-02', 'ATP Finals', 'Hard',
 'Novak Djokovic', 'Carlos Alcaraz', 1.85, 1.95,
 'Novak Djokovic', 75, 'Djokovic has superior head-to-head record and recent form',
 'medium', 'bet'),
 
('Paris_Masters_2025-11-01_Jannik_Sinner_Daniil_Medvedev', '2025-11-01', 'Paris Masters', 'Hard',
 'Jannik Sinner', 'Daniil Medvedev', 2.10, 1.70,
 'Daniil Medvedev', 65, 'Medvedev dominates on hard courts historically',
 'medium', 'monitor'),
 
('Vienna_Open_2025-10-31_Alexander_Zverev_Stefanos_Tsitsipas', '2025-10-31', 'Vienna Open', 'Hard',
 'Alexander Zverev', 'Stefanos Tsitsipas', 1.75, 2.05,
 'Alexander Zverev', 70, 'Zverev has better recent form and home advantage',
 'low', 'bet');

-- Insert sample player insights for testing
INSERT INTO player_insights (player_name, insight_type, insight_description, confidence, discovered_date) VALUES
('Carlos Alcaraz', 'giant_killer', 'Carlos Alcaraz shows exceptional ability to beat higher-ranked opponents on big stages', 85, '2025-11-02'),
('Jannik Sinner', 'surface_specialist', 'Jannik Sinner demonstrates superior performance on hard courts with aggressive baseline play', 80, '2025-11-01'),
('Novak Djokovic', 'momentum_rising', 'Novak Djokovic shows strong momentum in final tournaments of the season', 75, '2025-11-02');

-- Insert sample learning log entries
INSERT INTO learning_log (log_date, log_type, description, learning_data, impact_score) VALUES
('2025-11-02', 'pattern_discovery', 'Young players (under 25) performing exceptionally well in finals', '{"pattern": "youth_advantage", "affected_matches": 5}', 8),
('2025-11-01', 'confidence_calibration', 'Reduce confidence for predictions against players with recent injury history', '{"adjustment": "-10% confidence", "reason": "injury_factor"}', 6),
('2025-10-31', 'daily_summary', 'Successfully predicted 8/12 matches with high confidence (66.7% accuracy)', '{"total_predictions": 12, "correct": 8, "accuracy": 66.7}', 7);

-- Update system metadata for testing
UPDATE system_metadata SET 
    days_operated = 45,
    learning_phase = 'phase2_pattern_recognition',
    overall_accuracy = 68.50,
    total_predictions_made = 156,
    correct_predictions = 107,
    incorrect_predictions = 49,
    total_matches_processed = 342,
    data_quality_score = 78,
    last_result_date = '2025-11-02',
    max_confidence_allowed = 75
WHERE id = 1;

-- Add some surface-specific statistics
UPDATE players SET 
    win_rate_hard = CASE 
        WHEN player_name IN ('Novak Djokovic', 'Carlos Alcaraz', 'Jannik Sinner') THEN 85.00
        WHEN player_name IN ('Daniil Medvedev', 'Alexander Zverev') THEN 80.00
        ELSE 75.00
    END,
    win_rate_clay = CASE 
        WHEN player_name = 'Rafael Nadal' THEN 95.00
        WHEN player_name IN ('Carlos Alcaraz', 'Stefanos Tsitsipas') THEN 82.00
        ELSE 70.00
    END
WHERE player_name IN ('Novak Djokovic', 'Carlos Alcaraz', 'Rafael Nadal', 'Jannik Sinner', 'Daniil Medvedev', 'Alexander Zverev', 'Stefanos Tsitsipas');

-- Set giant killer scores
UPDATE players SET giant_killer_score = CASE 
    WHEN player_name = 'Carlos Alcaraz' THEN 8.5
    WHEN player_name = 'Jannik Sinner' THEN 7.8
    WHEN player_name = 'Stefanos Tsitsipas' THEN 7.2
    ELSE 5.0
END;

-- Set momentum scores
UPDATE players SET momentum_score = CASE 
    WHEN player_name = 'Carlos Alcaraz' THEN 8.7
    WHEN player_name = 'Jannik Sinner' THEN 8.2
    WHEN player_name = 'Novak Djokovic' THEN 7.9
    ELSE 6.5
END;

-- Add recent form data
UPDATE players SET 
    recent_form_last_5 = CASE 
        WHEN player_name = 'Carlos Alcaraz' THEN 'WWWLL'
        WHEN player_name = 'Jannik Sinner' THEN 'WWLWW'
        WHEN player_name = 'Novak Djokovic' THEN 'WLWWW'
        WHEN player_name = 'Daniil Medvedev' THEN 'LWWWL'
        ELSE 'WLWLW'
    END,
    wins_last_5 = CASE 
        WHEN player_name = 'Carlos Alcaraz' THEN 3
        WHEN player_name = 'Jannik Sinner' THEN 3
        WHEN player_name = 'Novak Djokovic' THEN 4
        WHEN player_name = 'Daniil Medvedev' THEN 3
        ELSE 2
    END;

COMMIT;

-- Verify test data insertion
SELECT 'Test data inserted successfully!' as result;
SELECT COUNT(*) as total_players FROM players;
SELECT COUNT(*) as total_matches FROM matches;
SELECT COUNT(*) as total_predictions FROM predictions;
SELECT COUNT(*) as total_insights FROM player_insights;
SELECT learning_phase, overall_accuracy FROM system_metadata WHERE id = 1;
