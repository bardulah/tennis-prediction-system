# Scraper Test Suite

This directory contains comprehensive tests for the tennis scraper functionality, including the new forward scraping capability.

## Test Scripts

### 1. `test_today.sh`
Tests the standard **today mode** functionality:
```bash
bash tests/scraper/test_today.sh
```
- **Command**: `node scrape-with-date.js --today --strip-scores`
- **Expected Output**: `matches-YYYY-MM-DD-strip-scores.json`
- **Purpose**: Verify current day scraping works as before

### 2. `test_yesterday.sh`
Tests **backward scraping** for yesterday:
```bash
bash tests/scraper/test_yesterday.sh
```
- **Command**: `node scrape-with-date.js --single-day 1 --strip-scores`
- **Expected Output**: `matches-YYYY-MM-DD-strip-scores.json` (yesterday)
- **Purpose**: Verify backward navigation and historical data scraping

### 3. `test_tomorrow.sh`
Tests the **NEW forward scraping** capability:
```bash
bash tests/scraper/test_tomorrow.sh
```
- **Command**: `node scrape-with-date.js --days-forward 1 --strip-scores`
- **Expected Output**: `matches-YYYY-MM-DD-forward-1d.json`
- **Purpose**: Verify forward navigation and future match scraping

### 4. `test_all_modes.sh`
Comprehensive test suite running all modes:
```bash
bash tests/scraper/test_all_modes.sh
```
- **Purpose**: Run all three tests and provide summary
- **Output**: Consolidated results and file listing

## Expected Outputs

### File Naming Convention
- **Today**: `matches-YYYY-MM-DD-strip-scores.json`
- **Yesterday**: `matches-YYYY-MM-DD-strip-scores.json` 
- **Tomorrow**: `matches-YYYY-MM-DD-forward-1d.json`

### Data Structure
Each output file contains an array of match objects with:
```json
{
  "player1": "Player Name",
  "nationality1": "Country",
  "player2": "Player Name", 
  "nationality2": "Country",
  "tournament": "Tournament Name",
  "surface": "hard/clay/grass",
  "match_date": "YYYY-MM-DD",
  "odds1": 1.50,
  "odds2": 2.50,
  "score": "",  // Empty for strip-scores mode
  "winner": ""  // Empty for strip-scores mode
}
```

## Test Results Interpretation

### ✅ Success Indicators
- Output files created with correct naming
- JSON structure matches expected format
- Match count > 0 (when data is available)
- No scraper errors or timeouts

### ⚠️ Expected Limitations
- **Tomorrow matches**: May be empty if Flashscore hasn't posted schedule yet
- **Yesterday matches**: May be empty if no matches were played
- **Network issues**: Flashscore availability affects results

### ❌ Failure Indicators
- No output file created
- JSON parsing errors
- Scraper crashes or timeouts
- Incorrect file naming

## Usage Examples

### Run Individual Tests
```bash
# Test forward scraping (new feature)
bash tests/scraper/test_tomorrow.sh

# Test backward compatibility  
bash tests/scraper/test_today.sh

# Test historical data
bash tests/scraper/test_yesterday.sh
```

### Run Complete Suite
```bash
# All tests with summary
bash tests/scraper/test_all_modes.sh
```

## Technical Details

### Forward Scraping (NEW)
- **Navigation**: Uses `button[data-day-picker-arrow="next"]`
- **Limitation**: 1-7 days forward (Flashscore data availability)
- **Timeout**: 4-second delays between page navigations
- **Error Handling**: Graceful degradation if next button unavailable

### Backward Scraping (EXISTING) 
- **Navigation**: Uses `button[data-day-picker-arrow="prev"]`
- **Coverage**: Unlimited historical data (subject to Flashscore availability)
- **Performance**: Optimized for fast historical data extraction

### Common Features
- **Headless Browser**: Puppeteer automation
- **Output Format**: JSON with consistent structure
- **Error Recovery**: Continues processing if individual matches fail
- **File Validation**: Verifies output file creation

## Troubleshooting

### Common Issues

1. **No matches found for tomorrow**
   - Normal: Flashscore posts future schedules by evening
   - Solution: Run test later in the day or use `--today` mode

2. **Scraper timeouts**
   - Check internet connection
   - Verify Flashscore accessibility
   - Increase timeout values if needed

3. **JSON parsing errors**
   - Check for corrupted output files
   - Verify scraper completed successfully
   - Review raw JSON structure

### Debug Commands
```bash
# Check if output files exist
ls -la matches-*-strip-scores.json matches-*-forward-*.json

# Validate JSON structure
jq . matches-YYYY-MM-DD-strip-scores.json

# Count matches in output
jq 'length' matches-YYYY-MM-DD-strip-scores.json

# Show sample match data
jq '.[0]' matches-YYYY-MM-DD-strip-scores.json
```

## Integration with Bot

These tests verify that the scraper works standalone, ensuring the bot workflow integration will function correctly:

- ✅ **Bot calls**: `run_morning_workflow(days_forward=1)`
- ✅ **Scraper execution**: `node scrape-with-date.js --days-forward 1 --strip-scores`
- ✅ **File output**: `matches-YYYY-MM-DD-forward-1d.json`
- ✅ **n8n webhook**: Automatic data transmission

The test suite confirms all three scraping directions work correctly before deploying to production.
