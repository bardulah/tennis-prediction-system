#!/usr/bin/env bash

# Test Script: Yesterday Mode  
# Tests backward scraping for yesterday's matches

set -euo pipefail

echo "======================================"
echo "SCRAPER TEST: YESTERDAY MODE"
echo "Command: node scrape-with-date.js --single-day 1 --strip-scores"
echo "======================================"

cd /opt/tennis-scraper

# Calculate yesterday's date
YESTERDAY=$(date -d 'yesterday' +%Y-%m-%d 2>/dev/null || date -v -1d +%Y-%m-%d 2>/dev/null || echo "2025-11-14")

echo ""
echo "🕐 Running scraper for YESTERDAY's matches..."
echo "Target date: ${YESTERDAY}"
echo "Expected output: matches-${YESTERDAY}-strip-scores.json"
echo ""

# Run the scraper for yesterday
node scrape-with-date.js --single-day 1 --strip-scores

echo ""
echo "📋 Checking output file..."

YESTERDAY_FILE="matches-${YESTERDAY}-strip-scores.json"
if [[ -f "${YESTERDAY_FILE}" ]]; then
    echo "✅ SUCCESS: Output file created: ${YESTERDAY_FILE}"
    
    # Show file details
    FILE_SIZE=$(stat -f%z "${YESTERDAY_FILE}" 2>/dev/null || stat -c%s "${YESTERDAY_FILE}" 2>/dev/null || echo "0")
    echo "📊 File size: ${FILE_SIZE} bytes"
    
    # Show first few matches if file has content
    if [[ ${FILE_SIZE} -gt 100 ]]; then
        echo ""
        echo "📝 Sample data (first match):"
        jq -r '.[0] | "Player 1: \(.player1) (\(.nationality1))\nPlayer 2: \(.player2) (\(.nationality2))\nTournament: \(.tournament)\nSurface: \(.surface)\nMatch Date: \(.match_date)"' "${YESTERDAY_FILE}" 2>/dev/null || echo "Could not parse JSON data"
    fi
    
    # Count total matches
    MATCH_COUNT=$(jq 'length' "${YESTERDAY_FILE}" 2>/dev/null || echo "0")
    echo "🎾 Total matches found: ${MATCH_COUNT}"
    
else
    echo "❌ FAILED: Output file ${YESTERDAY_FILE} not found"
    echo "⚠️ This might be expected if no matches were available for yesterday"
    exit 1
fi

echo ""
echo "✅ YESTERDAY MODE TEST COMPLETED"
echo "Output: ${YESTERDAY_FILE}"
echo "======================================"
