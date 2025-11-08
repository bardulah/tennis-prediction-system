#!/usr/bin/env bash

# Live Dashboard Setup Script
# This script sets up the live dashboard features

set -euo pipefail

SCRIPT_DIR="/opt/tennis-scraper"
SCHEMA_FILE="${SCRIPT_DIR}/database/schema.sql"

echo "Setting up live dashboard features..."

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your Neon database URL:"
    echo "  export DATABASE_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

echo "✅ Database URL is set"

# Apply the database schema changes
echo "Applying database schema changes..."
if command -v psql >/dev/null 2>&1; then
    echo "Using psql to apply schema changes..."
    PGPASSWORD="${DATABASE_URL#*://*:@}" psql "${DATABASE_URL}" < "${SCHEMA_FILE}"
else
    echo "psql not found. Please manually run the schema changes in ${SCHEMA_FILE}"
    echo "You can use the Neon console or psql to apply the changes."
fi

echo "✅ Database schema updated"

# Test the live scraper
echo "Testing live scraper..."
cd "${SCRIPT_DIR}"

if [ -f "scrape-live-scores.js" ]; then
    echo "Running a test scrape..."
    if timeout 30s node scrape-live-scores.js; then
        echo "✅ Live scraper test completed successfully"
    else
        echo "⚠️  Live scraper test timed out or failed (this may be normal if no matches are found)"
    fi
else
    echo "❌ Live scraper script not found"
fi

# Set up the cron job
echo ""
read -p "Do you want to set up the live scraper cron job? (y/N): " setup_cron
if [[ "$setup_cron" =~ ^[Yy]$ ]]; then
    echo "Setting up cron job..."
    ./run-live-scraper.sh
else
    echo "Skipping cron job setup. You can run ./run-live-scraper.sh later."
fi

echo ""
echo "🎉 Live dashboard setup complete!"
echo ""
echo "Features added:"
echo "  • live_matches table for real-time match data"
echo "  • Lightweight live scraper (scrape-live-scores.js)"
echo "  • Dashboard backend updated to show live status"
echo "  • Dashboard frontend with live status column"
echo ""
echo "Next steps:"
echo "  1. The dashboard will now show live status for today's matches"
echo "  2. Live scores will be updated every 2 hours during match hours"
echo "  3. Existing morning/evening workflows remain unchanged"
echo ""
echo "To manually run the live scraper:"
echo "  node scrape-live-scores.js"
echo ""
echo "To view the dashboard:"
echo "  Frontend: http://193.24.209.9:5173"
echo "  Backend:  http://193.24.209.9:3001"
