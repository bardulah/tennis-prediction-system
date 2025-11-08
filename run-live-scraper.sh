#!/usr/bin/env bash

# Live Scraper Cron Job Setup Script
# This script sets up a cron job to run the live scraper every 2 hours during match hours

set -euo pipefail

SCRIPT_DIR="/opt/tennis-scraper"
SCRAPER_SCRIPT="${SCRIPT_DIR}/scrape-live-scores.js"
CRON_COMMAND="cd ${SCRIPT_DIR} && /usr/bin/node ${SCRAPER_SCRIPT}"
LOG_FILE="${SCRIPT_DIR}/logs/live-scraper.log"
PID_FILE="${SCRIPT_DIR}/temp/live-scraper.pid"

echo "Setting up live scraper cron job..."

# Create directories if they don't exist
mkdir -p "${SCRIPT_DIR}/logs"
mkdir -p "${SCRIPT_DIR}/temp"

# Create the cron job entry
# Run every 2 hours (8 AM, 10 AM, 12 PM, 2 PM, 4 PM, 6 PM, 8 PM, 10 PM)
CRON_SCHEDULE="0 */2 * * *"

# Create the cron entry with logging
CRON_ENTRY="${CRON_SCHEDULE} ${CRON_COMMAND} >> ${LOG_FILE} 2>&1"

# Add to crontab (preserve existing entries)
echo "Current crontab entries:"
crontab -l 2>/dev/null || echo "No existing crontab entries"

# Remove any existing live scraper entries
crontab -l 2>/dev/null | grep -v "scrape-live-scores.js" | crontab -

# Add new entry
echo "${CRON_ENTRY}" | crontab -

echo "✅ Live scraper cron job added successfully!"
echo "Schedule: Every 2 hours between 8 AM and 10 PM"
echo "Command: ${CRON_COMMAND}"
echo "Log file: ${LOG_FILE}"

# Test the script
echo "Testing the live scraper script..."
if [ -f "${SCRAPER_SCRIPT}" ]; then
    echo "✅ Live scraper script found at ${SCRAPER_SCRIPT}"
    echo "📋 Cron schedule: ${CRON_SCHEDULE}"
    echo "📝 Logs will be written to: ${LOG_FILE}"
    echo ""
    echo "To manually run the live scraper:"
    echo "  ${CRON_COMMAND}"
    echo ""
    echo "To view logs:"
    echo "  tail -f ${LOG_FILE}"
    echo ""
    echo "To remove the cron job:"
    echo "  crontab -l | grep -v 'scrape-live-scores.js' | crontab -"
else
    echo "❌ Live scraper script not found at ${SCRAPER_SCRIPT}"
    exit 1
fi

echo ""
echo "🚀 Live scraper cron job setup complete!"
echo "The live status column will be updated every 2 hours during match hours."
