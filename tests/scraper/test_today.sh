#!/usr/bin/env bash

# Test Script: Today Mode
# Tests the standard --today --strip-scores functionality

set -euo pipefail

echo "======================================"
echo "SCRAPER TEST: TODAY MODE"
echo "Command: node scrape-with-date.js --today --strip-scores"
echo "======================================"

cd /opt/tennis-scraper

echo ""
echo "🕐 Running scraper for TODAY's matches..."
echo "Expected: matches-$(date +%Y-%m-%d)-strip-scores.json"
echo ""

# Run the scraper
node scrape-with-date.js --today --strip-scores

echo ""
echo "📋 Checking output file..."

TODAY_FILE="matches-$(date +%Y-%m-%d)-strip-scores.json"
if [[ -f "${TODAY_FILE}" ]]; then
    echo "✅ SUCCESS: Output file created: ${TODAY_FILE}"
    
    # Show file details
    FILE_SIZE=$(stat -f%z "${TODAY_FILE}" 2>/dev/null || stat -c%s "${TODAY_FILE}" 2>/dev/null || echo "0")
    echo "📊 File size: ${FILE_SIZE} bytes"
    
    # Show first few matches if file has content
    if [[ ${FILE_SIZE} -gt 100 ]]; then
        echo ""
        echo "📝 Sample data (first match):"
        jq -r '.[0] | "Player 1: \(.player1) (\(.nationality1))\nPlayer 2: \(.player2) (\(.nationality2))\nTournament: \(.tournament)\nSurface: \(.surface)"' "${TODAY_FILE}" 2>/dev/null || echo "Could not parse JSON data"
    fi
    
    # Count total matches
    MATCH_COUNT=$(jq 'length' "${TODAY_FILE}" 2>/dev/null || echo "0")
    echo "🎾 Total matches found: ${MATCH_COUNT}"
    
else
    echo "❌ FAILED: Output file ${TODAY_FILE} not found"
    exit 1
fi

echo ""
echo "✅ TODAY MODE TEST COMPLETED SUCCESSFULLY"
echo "Output: ${TODAY_FILE}"
echo "======================================"
