#!/usr/bin/env bash

# Test Script: Tomorrow Mode (FORWARD SCRAPING)
# Tests the NEW forward scraping capability for tomorrow's matches

set -euo pipefail

echo "======================================"
echo "SCRAPER TEST: TOMORROW MODE (FORWARD SCRAPING)"
echo "Command: node scrape-with-date.js --days-forward 1 --strip-scores"
echo "======================================"

cd /opt/tennis-scraper

# Calculate tomorrow's date  
TOMORROW=$(date -d 'tomorrow' +%Y-%m-%d 2>/dev/null || date -v +1d +%Y-%m-%d 2>/dev/null || echo "2025-11-16")

echo ""
echo "🕐 Running scraper for TOMORROW's matches..."
echo "Target date: ${TOMORROW}"
echo "Expected output: matches-$(date +%Y-%m-%d)-forward-1d.json"
echo ""

# Run the scraper for tomorrow (NEW FORWARD CAPABILITY)
node scrape-with-date.js --days-forward 1 --strip-scores

echo ""
echo "📋 Checking output file..."

# The forward scraper creates range-based file names
TOMORROW_RANGE_FILE="matches-${TOMORROW}-to-${TOMORROW}-strip-scores.json"
FORWARD_FILE="matches-$(date +%Y-%m-%d)-forward-1d.json"

# Check for either file format
if [[ -f "${TOMORROW_RANGE_FILE}" ]]; then
    echo "✅ SUCCESS: Output file created: ${TOMORROW_RANGE_FILE}"
    ACTUAL_FILE="${TOMORROW_RANGE_FILE}"
elif [[ -f "${FORWARD_FILE}" ]]; then
    echo "✅ SUCCESS: Output file created: ${FORWARD_FILE}"
    ACTUAL_FILE="${FORWARD_FILE}"
else
    echo "❌ FAILED: No output file found"
    echo "Expected: ${TOMORROW_RANGE_FILE} or ${FORWARD_FILE}"
    echo "⚠️ This might be expected if no matches are available for tomorrow yet"
    echo "Flashscore typically posts tomorrow's schedule by evening"
    exit 1
fi

# Show file details
FILE_SIZE=$(stat -f%z "${ACTUAL_FILE}" 2>/dev/null || stat -c%s "${ACTUAL_FILE}" 2>/dev/null || echo "0")
echo "📊 File size: ${FILE_SIZE} bytes"

# Show first few matches if file has content
if [[ ${FILE_SIZE} -gt 100 ]]; then
    echo ""
    echo "📝 Sample data (first match):"
    jq -r '.[0] | "Player 1: \(.player1) (\(.nationality1))\nPlayer 2: \(.player2) (\(.nationality2))\nTournament: \(.tournament)\nSurface: \(.surface)\nMatch Date: \(.match_date)"' "${ACTUAL_FILE}" 2>/dev/null || echo "Could not parse JSON data"
fi

# Count total matches
MATCH_COUNT=$(jq 'length' "${ACTUAL_FILE}" 2>/dev/null || echo "0")
echo "🎾 Total matches found: ${MATCH_COUNT}"

if [[ ${MATCH_COUNT} -eq 0 ]]; then
    echo "⚠️ NOTE: No matches found for tomorrow"
    echo "This is normal as Flashscore may not have posted tomorrow's schedule yet"
fi

echo ""
echo "✅ TOMORROW MODE TEST COMPLETED (FORWARD SCRAPING)"
echo "Output: ${ACTUAL_FILE}"
echo "🎯 NEW FEATURE: Forward scraping capability verified!"
echo "======================================"
