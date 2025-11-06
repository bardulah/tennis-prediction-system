# 📊 Tennis Predictions Metabase Analytics

Business intelligence and analytics dashboard for the Tennis Prediction System using Metabase.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Neon PostgreSQL database (already configured)
- Port 3000 available (or configure a different port)

### Start Metabase

```bash
cd metabase
./start.sh
```

Metabase will be available at: **http://localhost:3000**

### Stop Metabase

```bash
cd metabase
./stop.sh
```

---

## 📋 Initial Setup

### First Time Login

1. Navigate to http://localhost:3000
2. Complete the setup wizard:
   - **Language**: Select your preference
   - **Create Account**: Set up admin user
   - **Add Your Data**: Skip for now (we'll add manually)

### Connect to Tennis Database

1. Click **Settings** (gear icon) → **Admin** → **Databases**
2. Click **Add database**
3. Configure connection:

```
Database type: PostgreSQL
Display name: Tennis Predictions
Host: ep-aged-pine-af2ty8bi-pooler.c-2.us-west-2.aws.neon.tech
Port: 5432
Database name: neondb
Username: neondb_owner
Password: (see .env file)
```

4. **Advanced options**:
   - Enable SSL: **Yes** (Required for Neon)
   - SSL Mode: **require**
5. Click **Save**

---

## 📊 Available Data

### Core Tables

| Table | Description | Key Metrics |
|-------|-------------|-------------|
| **predictions** | AI match predictions | Confidence scores, reasoning, accuracy |
| **matches** | Historical match results | Winners, scores, odds, upsets |
| **players** | Player statistics | Win rates by surface, momentum, form |
| **player_insights** | Auto-discovered patterns | Giant killers, surface specialists |
| **system_metadata** | System health tracking | Overall accuracy, learning phase |
| **learning_log** | AI learning entries | Pattern discovery, improvements |

### Pre-built Views

| View | Purpose |
|------|---------|
| **player_stats** | Computed win rates across all surfaces |
| **prediction_performance** | Daily accuracy metrics and trends |

---

## 📈 Recommended Dashboards

See [DASHBOARDS.md](./DASHBOARDS.md) for detailed dashboard configurations and visualization examples.

### 1. **System Performance Dashboard**
- Overall accuracy trend (line chart)
- Predictions by confidence level (pie chart)
- Daily prediction volume (bar chart)
- Learning phase progression (indicator)

### 2. **Player Analytics Dashboard**
- Top 10 players by win rate (bar chart)
- Win rate by surface (grouped bar chart)
- Giant killers leaderboard (table)
- Form momentum tracker (scatter plot)

### 3. **Match Insights Dashboard**
- Upset frequency over time (line chart)
- Prediction accuracy by tournament (table)
- Confidence vs actual success (scatter plot)
- High-value prediction opportunities (table)

### 4. **Business Intelligence Dashboard**
- ROI on high-confidence predictions (metric)
- Accuracy by confidence bucket (funnel)
- Data quality score trend (line chart)
- Pinecone record growth (area chart)

---

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key variables in `.env`:

```bash
# Database Connection
MB_DB_TYPE=postgres
MB_DB_DBNAME=neondb
MB_DB_PORT=5432
MB_DB_USER=neondb_owner
MB_DB_PASS=<from-neon>
MB_DB_HOST=ep-aged-pine-af2ty8bi-pooler.c-2.us-west-2.aws.neon.tech

# Server Configuration
MB_JETTY_PORT=3000
```

### Custom Port

To use a different port, edit `.env`:

```bash
MB_JETTY_PORT=8080
```

Then restart: `./stop.sh && ./start.sh`

---

## 🔍 Useful Queries

### Get Latest Predictions

```sql
SELECT
  prediction_date,
  tournament,
  player1,
  player2,
  predicted_winner,
  confidence_score,
  actual_winner,
  prediction_correct
FROM predictions
WHERE prediction_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY prediction_date DESC, confidence_score DESC;
```

### Accuracy by Confidence Level

```sql
SELECT
  CASE
    WHEN confidence_score >= 60 THEN 'High (60%+)'
    WHEN confidence_score >= 50 THEN 'Medium (50-59%)'
    ELSE 'Low (<50%)'
  END as confidence_bucket,
  COUNT(*) as total_predictions,
  SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) as correct,
  ROUND(
    100.0 * SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as accuracy_pct
FROM predictions
WHERE actual_winner IS NOT NULL
GROUP BY confidence_bucket
ORDER BY
  CASE
    WHEN confidence_score >= 60 THEN 1
    WHEN confidence_score >= 50 THEN 2
    ELSE 3
  END;
```

### Top Performing Players

```sql
SELECT
  player_name,
  total_matches,
  ROUND(win_rate_overall::numeric, 2) as overall_win_rate,
  ROUND(win_rate_clay::numeric, 2) as clay_win_rate,
  ROUND(win_rate_hard::numeric, 2) as hard_win_rate,
  ROUND(giant_killer_score::numeric, 2) as giant_killer_score,
  recent_form_last_5
FROM players
WHERE total_matches >= 10
ORDER BY win_rate_overall DESC
LIMIT 20;
```

### Daily Performance Trend

```sql
SELECT
  date,
  total_predictions,
  correct_predictions,
  daily_accuracy,
  high_conf_accuracy,
  medium_conf_accuracy,
  low_conf_accuracy,
  learning_phase
FROM prediction_accuracy
ORDER BY date DESC
LIMIT 30;
```

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs tennis-metabase

# Verify port availability
lsof -i :3000

# Restart with fresh data
./stop.sh
rm -rf metabase-data
./start.sh
```

### Database connection failed

1. Verify Neon database is accessible
2. Check SSL is enabled in Metabase database settings
3. Verify credentials in `.env` match Neon connection string

### Slow queries

1. Add indexes in database (see `database/schema.sql`)
2. Increase Java heap size in `docker-compose.yml`:
```yaml
JAVA_OPTS: "-Xmx4g -XX:+UseContainerSupport"
```

---

## 📁 Data Persistence

Metabase data is stored in `./metabase-data/` including:
- Dashboards and questions
- User accounts and permissions
- Scheduled reports
- Database connections

**Backup**: Copy `metabase-data/` directory regularly

---

## 🔐 Security Notes

- `.env` contains database credentials - **never commit to git**
- Metabase admin password should be strong
- Consider creating a read-only PostgreSQL user for analytics
- Use firewall rules to restrict access to port 3000

---

## 📚 Additional Resources

- [Metabase Documentation](https://www.metabase.com/docs/latest/)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Tennis Prediction System Architecture](../README.md)
- [Database Schema Guide](../COMPLETE_DATABASE_GUIDE.md)
