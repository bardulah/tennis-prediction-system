-- Debug query to see what data we're trying to match
SELECT 
    prediction_id,
    player1,
    player2, 
    tournament,
    predicted_winner,
    actual_winner,
    prediction_day
FROM predictions 
WHERE prediction_day = CURRENT_DATE
ORDER BY prediction_id 
LIMIT 5;
