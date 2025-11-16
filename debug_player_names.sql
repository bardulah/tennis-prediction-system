-- Debug the exact player names and tournament
SELECT 
    p1.player1 as db_player1,
    p1.player2 as db_player2, 
    p1.tournament as db_tournament,
    p1.prediction_id,
    p1.predicted_winner
FROM predictions p1
WHERE p1.prediction_day = CURRENT_DATE
ORDER BY p1.prediction_id 
LIMIT 10;
