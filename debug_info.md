# Debug the data mismatch issue

## Player names in database vs scraper

### Database predictions (first few):
- Alcaraz C. vs Sinner J.
- Mboko V. vs Svendsen J. C.  
- Joint M. vs Pigossi L.

### Need to check scraper data format

### Query to check player name patterns:
```sql
SELECT DISTINCT player1, player2
FROM predictions 
WHERE prediction_day = CURRENT_DATE
ORDER BY prediction_id
LIMIT 10;
```

### This will help identify if there are name format differences like:
- "Sinner J." vs "Sinner J. (Italy)"
- "Svendsen J. C." vs "Svendsen J C." 
- etc.
