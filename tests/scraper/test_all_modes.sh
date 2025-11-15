#!/usr/bin/env bash

# Comprehensive Test Script: All Modes
# Tests all three scraper modes: yesterday, today, and tomorrow

set -euo pipefail

echo "============================================"
echo "COMPREHENSIVE SCRAPER TEST SUITE"
echo "Testing: Yesterday, Today, and Tomorrow modes"
echo "============================================"

cd /opt/tennis-scraper

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run individual test
run_test() {
    local test_name="$1"
    local test_script="$2"
    
    echo ""
    echo "🔄 Running ${test_name} test..."
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if bash "${test_script}"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "✅ ${test_name} PASSED"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "❌ ${test_name} FAILED"
    fi
    
    echo "----------------------------------------"
}

# Run all tests
echo "🧪 Starting comprehensive test suite..."

run_test "Yesterday Mode" "tests/scraper/test_yesterday.sh"
run_test "Today Mode" "tests/scraper/test_today.sh"  
run_test "Tomorrow Mode" "tests/scraper/test_tomorrow.sh"

# Summary
echo ""
echo "============================================"
echo "🏁 TEST SUITE SUMMARY"
echo "============================================"
echo "Total tests run: ${TOTAL_TESTS}"
echo "✅ Passed: ${PASSED_TESTS}"
echo "❌ Failed: ${FAILED_TESTS}"

if [[ ${FAILED_TESTS} -eq 0 ]]; then
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ Backward scraping: WORKING"
    echo "✅ Today's scraping: WORKING"
    echo "✅ Forward scraping: WORKING"
    echo ""
    echo "🎯 NEW FEATURE VERIFIED: Forward scraping capability is operational!"
else
    echo ""
    echo "⚠️ Some tests failed. Check individual test outputs above."
fi

echo "============================================"

# List generated files
echo ""
echo "📁 Generated output files:"
echo "----------------------------------------"

# List yesterday file
YESTERDAY=$(date -d 'yesterday' +%Y-%m-%d 2>/dev/null || date -v -1d +%Y-%m-%d 2>/dev/null || echo "2025-11-14")
if [[ -f "matches-${YESTERDAY}-strip-scores.json" ]]; then
    echo "Yesterday: matches-${YESTERDAY}-strip-scores.json ✅"
else
    echo "Yesterday: matches-${YESTERDAY}-strip-scores.json ❌"
fi

# List today file
TODAY=$(date +%Y-%m-%d)
if [[ -f "matches-${TODAY}-strip-scores.json" ]]; then
    echo "Today: matches-${TODAY}-strip-scores.json ✅"
else
    echo "Today: matches-${TODAY}-strip-scores.json ❌"
fi

# List tomorrow file  
FORWARD_FILE="matches-2025-11-16-to-2025-11-16-strip-scores.json"
if [[ -f "${FORWARD_FILE}" ]]; then
    echo "Tomorrow: ${FORWARD_FILE} ✅"
else
    echo "Tomorrow: matches-2025-11-16-to-2025-11-16-strip-scores.json ❌"
fi

echo "============================================"

# Exit with appropriate code
if [[ ${FAILED_TESTS} -eq 0 ]]; then
    exit 0
else
    exit 1
fi
