const puppeteer = require('puppeteer');
const fs = require('fs');

// Parse command-line arguments
const args = process.argv.slice(2);
const mode = args.find(arg => arg === '--today' || arg === '--single-day' || arg === '--days-back' || arg === '--days-forward') || '--today';
const filterMode = args.find(arg => arg === '--all' || arg === '--pending' || arg === '--finished' || arg === '--strip-scores') || '--all';
const daysArg = args.find(arg => !arg.startsWith('--'));
const DAYS = daysArg ? parseInt(daysArg) : 1;

// Validate modes
const VALID_MODES = ['--today', '--single-day', '--days-back', '--days-forward'];
const VALID_FILTER_MODES = ['--all', '--pending', '--finished', '--strip-scores'];

if (!VALID_MODES.includes(mode)) {
  console.error(`\nERROR: Invalid mode '${mode}'`);
  console.error(`Valid modes: ${VALID_MODES.join(', ')}\n`);
  console.error('Usage examples:');
  console.error('  node scrape-with-date.js --today                    # Today\'s matches');
  console.error('  node scrape-with-date.js --today --pending          # Today\'s pending matches');
  console.error('  node scrape-with-date.js --single-day 7             # Single day 7 days ago');
  console.error('  node scrape-with-date.js --days-back 7              # All matches from last 7 days');
  console.error('  node scrape-with-date.js --days-back 7 --finished   # Last 7 days, finished only');
  console.error('  node scrape-with-date.js --days-forward 3           # All matches from next 3 days');
  console.error('  node scrape-with-date.js --single-day 1 --days-forward  # Tomorrow\'s matches\n');
  process.exit(1);
}

if (!VALID_FILTER_MODES.includes(filterMode)) {
  console.error(`\nERROR: Invalid filter mode '${filterMode}'`);
  console.error(`Valid filter modes: ${VALID_FILTER_MODES.join(', ')}`);
  process.exit(1);
}

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to parse date from Flashscore
function parseDateFromFlashscore(dateText) {
  if (!dateText) {
    return formatDate(new Date());
  }

  dateText = dateText.trim();

  // Handle "Today"
  if (dateText.toLowerCase().includes('today')) {
    return formatDate(new Date());
  }

  // Handle "Yesterday"
  if (dateText.toLowerCase().includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }

  // Try to parse various date formats
  try {
    // Format: "27/10 Mo" or "27/10 Tu" (DD/MM DayName) - Flashscore's format
    // Need to add current year
    const flashscoreMatch = dateText.match(/(\d{1,2})\/(\d{1,2})\s*(?:Mo|Tu|We|Th|Fr|Sa|Su)?/i);
    if (flashscoreMatch) {
      const [_, day, month] = flashscoreMatch;
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Format: "27.10.2025" or "27/10/2025" (with year)
    const dotMatch = dateText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (dotMatch) {
      const [_, day, month, year] = dotMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const slashMatch = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const [_, day, month, year] = slashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Format: "October 27, 2025" or "Oct 27, 2025"
    const months = {
      'jan': '01', 'january': '01',
      'feb': '02', 'february': '02',
      'mar': '03', 'march': '03',
      'apr': '04', 'april': '04',
      'may': '05',
      'jun': '06', 'june': '06',
      'jul': '07', 'july': '07',
      'aug': '08', 'august': '08',
      'sep': '09', 'september': '09',
      'oct': '10', 'october': '10',
      'nov': '11', 'november': '11',
      'dec': '12', 'december': '12'
    };

    const monthNameMatch = dateText.match(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
    if (monthNameMatch) {
      const [_, monthName, day, year] = monthNameMatch;
      const month = months[monthName.toLowerCase()];
      if (month) {
        return `${year}-${month}-${day.padStart(2, '0')}`;
      }
    }

    // Fallback: try to parse as Date
    const parsed = new Date(dateText);
    if (!isNaN(parsed.getTime())) {
      return formatDate(parsed);
    }

  } catch (e) {
    console.error(`Failed to parse date: ${dateText}`, e);
  }

  // Ultimate fallback: current date
  console.warn(`Could not parse date "${dateText}", using current date`);
  return formatDate(new Date());
}

// Generate output filename
const today = new Date();
const filterModeName = filterMode.replace('--', '');

let OUTPUT_FILE;
if (mode === '--today') {
  OUTPUT_FILE = `matches-${formatDate(today)}-${filterModeName}.json`;
} else if (mode === '--single-day') {
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() - DAYS);
  OUTPUT_FILE = `matches-${formatDate(targetDate)}-${filterModeName}.json`;
} else if (mode === '--days-back') {
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 1);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - DAYS);
  OUTPUT_FILE = `matches-${formatDate(startDate)}-to-${formatDate(endDate)}-${filterModeName}.json`;
} else if (mode === '--days-forward') {
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 1);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + DAYS);
  OUTPUT_FILE = `matches-${formatDate(startDate)}-to-${formatDate(endDate)}-${filterModeName}.json`;
}

console.log(`\n========================================`);
console.log(`Flashscore Tennis Scraper with Date Extraction`);
const daysDisplay = mode !== '--today' ? ` (${DAYS} days${mode.includes('forward') ? ' forward' : ' back'})` : '';
console.log(`Mode: ${mode}${daysDisplay}`);
console.log(`Filter: ${filterMode}`);
console.log(`Output: ${OUTPUT_FILE}`);
console.log(`========================================\n`);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to Flashscore.com...');
  await page.goto('https://www.flashscore.com/tennis/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Close cookie banner
  try {
    await page.click('#onetrust-accept-btn-handler', { timeout: 2000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (e) {}

  // Wait for matches
  await page.waitForSelector('.sportName.tennis', { timeout: 10000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Click ODDS tab
  console.log('Clicking ODDS tab...');
  await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('*'));
    for (const el of allElements) {
      const text = el.textContent?.trim().toUpperCase();
      if (text === 'ODDS' || (text && text.length < 20 && text.includes('ODDS'))) {
        el.click();
        break;
      }
    }
  });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Helper function to extract date from page
  const extractDateFromPage = async () => {
    return await page.evaluate(() => {
      // Primary selector: Flashscore's date picker button
      // Format: "27/10 Mo" (DD/MM DayName)
      const datePicker = document.querySelector('[data-testid="wcl-dayPickerButton"]');
      if (datePicker) {
        const text = datePicker.textContent?.trim();
        if (text) {
          return text;
        }
      }

      // Fallback: try other calendar-related selectors
      const selectors = [
        '[data-testid="date-picker"]',
        '.calendar__datepicker',
        'button[aria-label*="date"]',
        '.calendar__navigation button',
        '.calendar__nav--date',
        '[class*="datepicker"]',
        'button[type="button"][role="combobox"]'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent || el.getAttribute('aria-label') || el.getAttribute('title');
          if (text) {
            return text.trim();
          }
        }
      }

      // Last resort: look for any button with date-like text
      const allButtons = document.querySelectorAll('button');
      for (const btn of allButtons) {
        const text = btn.textContent?.trim();
        if (text && (
          text.match(/\d{1,2}\/\d{1,2}/) ||
          text.match(/\d{1,2}\.\d{1,2}/) ||
          text.match(/today/i) ||
          text.match(/yesterday/i)
        )) {
          return text;
        }
      }

      return null;
    });
  };

  // Helper function to extract matches from current page
  const extractMatches = async (pageDate) => {
    return await page.evaluate((matchDate) => {
      const matchData = [];
      let currentTournament = '';
      let currentCountry = '';
      let currentSurface = '';

      const allElements = document.querySelectorAll('.headerLeague, .event__match');

      for (const el of allElements) {
        if (el.classList.contains('headerLeague')) {
          const titleEl = el.querySelector('.headerLeague__title');
          if (titleEl) {
            const fullTitle = titleEl.textContent?.trim() || '';
            currentTournament = fullTitle;

            const parts = fullTitle.split(',');
            if (parts.length >= 2) {
              const countryMatch = parts[0].match(/\(([^)]+)\)/);
              currentCountry = countryMatch ? countryMatch[1] : '';

              const surfaceText = parts[1].trim().toLowerCase();
              if (surfaceText.includes('hard')) {
                currentSurface = 'Hard';
              } else if (surfaceText.includes('clay')) {
                currentSurface = 'Clay';
              } else if (surfaceText.includes('grass')) {
                currentSurface = 'Grass';
              } else if (surfaceText.includes('carpet')) {
                currentSurface = 'Carpet';
              } else {
                currentSurface = '';
              }
            }
          }
        }

        if (el.classList.contains('event__match')) {
          try {
            const homePlayerEl = el.querySelector('.event__participant--home');
            const awayPlayerEl = el.querySelector('.event__participant--away');
            const homePlayer = homePlayerEl?.textContent?.trim() || '';
            const awayPlayer = awayPlayerEl?.textContent?.trim() || '';

            // Check if player name is bold (indicates winner)
            const homeIsBold = homePlayerEl?.classList.contains('fontExtraBold') || false;
            const awayIsBold = awayPlayerEl?.classList.contains('fontExtraBold') || false;

            const homeFlagEl = el.querySelector('.event__logo--home.flag');
            const awayFlagEl = el.querySelector('.event__logo--away.flag');
            const homeNationality = homeFlagEl?.getAttribute('title') || '';
            const awayNationality = awayFlagEl?.getAttribute('title') || '';

            const odds1Element = el.querySelector('.event__odd--odd1 span');
            const odds2Element = el.querySelector('.event__odd--odd2 span');
            const odds1 = odds1Element?.textContent?.trim() || '';
            const odds2 = odds2Element?.textContent?.trim() || '';

            // Extract scores (may be empty for unfinished matches)
            const homeSetScore = el.querySelector('.event__score--home')?.textContent?.trim() || '';
            const awaySetScore = el.querySelector('.event__score--away')?.textContent?.trim() || '';
            const homeParts = Array.from(el.querySelectorAll('.event__part--home')).map(e => e.textContent?.trim());
            const awayParts = Array.from(el.querySelectorAll('.event__part--away')).map(e => e.textContent?.trim());

            let score = '';
            if (homeSetScore && awaySetScore) {
              const sets = homeParts.map((h, idx) => {
                const a = awayParts[idx];
                let homeScore = h;
                let awayScore = a;

                if (h && h.length > 1 && (h.startsWith('6') || h.startsWith('7'))) {
                  homeScore = h.charAt(0);
                }
                if (a && a.length > 1 && (a.startsWith('6') || a.startsWith('7'))) {
                  awayScore = a.charAt(0);
                }

                return `${homeScore}-${awayScore}`;
              }).filter(s => s !== '-').join(' ');
              score = sets || `${homeSetScore}-${awaySetScore}`;
            }

            // Determine winner - priority: bold font > set scores
            let winner = '';

            // Method 1: Check for bold font (most reliable, works for retirements)
            if (homeIsBold && !awayIsBold) {
              winner = homePlayer;
            } else if (awayIsBold && !homeIsBold) {
              winner = awayPlayer;
            } else if (homeSetScore && awaySetScore) {
              // Method 2: Fallback to set scores if bold not available
              const homeWins = parseInt(homeSetScore);
              const awayWins = parseInt(awaySetScore);

              if (homeWins > awayWins) {
                winner = homePlayer;
              } else if (awayWins > homeWins) {
                winner = awayPlayer;
              }
            }

            // Add match if we have both players and odds
            if (homePlayer && awayPlayer && odds1 && odds2) {
              matchData.push({
                tournament: currentTournament,
                country: currentCountry,
                surface: currentSurface,
                player1: homePlayer,
                nationality1: homeNationality,
                player2: awayPlayer,
                nationality2: awayNationality,
                odds1: odds1,
                odds2: odds2,
                score: score,
                winner: winner,
                homeSetScore: homeSetScore,
                awaySetScore: awaySetScore,
                match_date: matchDate  // ✅ Date extracted from page
              });
            }
          } catch (e) {
            console.error('Error extracting match:', e);
          }
        }
      }

      return matchData;
    }, pageDate);
  };

  // Main scraping logic based on mode
  let allMatches = [];

  if (mode === '--today') {
    console.log('Mode: Today\'s matches');
    const dateText = await extractDateFromPage();
    const pageDate = parseDateFromFlashscore(dateText);
    console.log(`Extracted date from page: "${dateText}" → ${pageDate}`);

    allMatches = await extractMatches(pageDate);
    console.log(`Found ${allMatches.length} matches for ${pageDate}`);

  } else if (mode === '--single-day') {
    console.log(`Mode: Single day (${DAYS_BACK} days back)`);

    // Navigate back N days
    for (let day = 0; day < DAYS_BACK; day++) {
      console.log(`Going back to day ${day + 1}/${DAYS_BACK}...`);
      const clicked = await page.evaluate(() => {
        const prevButton = document.querySelector('button[data-day-picker-arrow="prev"]');
        if (prevButton) {
          prevButton.click();
          return true;
        }
        return false;
      });

      if (!clicked) {
        console.log(`Could not click previous day button at day ${day + 1}`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    // Extract date and matches
    const dateText = await extractDateFromPage();
    const pageDate = parseDateFromFlashscore(dateText);
    console.log(`Extracted date from page: "${dateText}" → ${pageDate}`);

    allMatches = await extractMatches(pageDate);
    console.log(`Found ${allMatches.length} matches for ${pageDate}`);

  } else if (mode === '--single-day') {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - DAYS);
    OUTPUT_FILE = `matches-${formatDate(targetDate)}-${filterModeName}.json`;
    
    console.log(`Target date: ${formatDate(targetDate)} (${DAYS} days back)`);
    
    // Navigate to the target date
    for (let day = 1; day <= DAYS; day++) {
      console.log(`\nNavigating... Day ${day}/${DAYS}`);
      const clicked = await page.evaluate(() => {
        const prevButton = document.querySelector('button[data-day-picker-arrow="prev"]');
        if (prevButton) {
          prevButton.click();
          return true;
        }
        return false;
      });

      if (!clicked) {
        console.log(`Could not click previous day button at day ${day}`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    // Extract date and matches
    const dateText = await extractDateFromPage();
    const pageDate = parseDateFromFlashscore(dateText);
    console.log(`Extracted date from page: "${dateText}" → ${pageDate}`);

    allMatches = await extractMatches(pageDate);
    console.log(`Found ${allMatches.length} matches for ${pageDate}`);

  } else if (mode === '--days-back') {
    console.log(`Mode: Multiple days (${DAYS} days back)`);

    for (let day = 1; day <= DAYS; day++) {
      console.log(`\n[Day ${day}/${DAYS}] Going back...`);
      const clicked = await page.evaluate(() => {
        const prevButton = document.querySelector('button[data-day-picker-arrow="prev"]');
        if (prevButton) {
          prevButton.click();
          return true;
        }
        return false;
      });

      if (!clicked) {
        console.log(`Could not click previous day button at day ${day}`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 4000));

      // Extract date for this day
      const dateText = await extractDateFromPage();
      const pageDate = parseDateFromFlashscore(dateText);
      console.log(`[Day ${day}/${DAYS}] Extracted date: "${dateText}" → ${pageDate}`);

      // Extract matches for this day
      const dayMatches = await extractMatches(pageDate);
      console.log(`[Day ${day}/${DAYS}] Found ${dayMatches.length} matches`);

      allMatches = allMatches.concat(dayMatches);
    }

    console.log(`\nTotal matches from all ${DAYS} days: ${allMatches.length}`);
  } else if (mode === '--days-forward') {
    console.log(`Mode: Multiple days (${DAYS} days forward)`);

    for (let day = 1; day <= DAYS; day++) {
      console.log(`\n[Day ${day}/${DAYS}] Going forward...`);
      const clicked = await page.evaluate(() => {
        const nextButton = document.querySelector('button[data-day-picker-arrow="next"]');
        if (nextButton) {
          nextButton.click();
          return true;
        }
        return false;
      });

      if (!clicked) {
        console.log(`Could not click next day button at day ${day}`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 4000));

      // Extract date for this day
      const dateText = await extractDateFromPage();
      const pageDate = parseDateFromFlashscore(dateText);
      console.log(`[Day ${day}/${DAYS}] Extracted date: "${dateText}" → ${pageDate}`);

      // Extract matches for this day
      const dayMatches = await extractMatches(pageDate);
      console.log(`[Day ${day}/${DAYS}] Found ${dayMatches.length} matches`);

      allMatches = allMatches.concat(dayMatches);
    }

    console.log(`\nTotal matches from all ${DAYS} days forward: ${allMatches.length}`);
  } else if (mode === '--single-day-forward') {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + DAYS);
    OUTPUT_FILE = `matches-${formatDate(targetDate)}-${filterModeName}.json`;
    
    console.log(`Target date: ${formatDate(targetDate)} (${DAYS} days forward)`);
    
    // Navigate forward to the target date
    for (let day = 1; day <= DAYS; day++) {
      console.log(`\nNavigating forward... Day ${day}/${DAYS}`);
      const clicked = await page.evaluate(() => {
        const nextButton = document.querySelector('button[data-day-picker-arrow="next"]');
        if (nextButton) {
          nextButton.click();
          return true;
        }
        return false;
      });

      if (!clicked) {
        console.log(`Could not click next day button at day ${day}`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    // Extract date and matches
    const dateText = await extractDateFromPage();
    const pageDate = parseDateFromFlashscore(dateText);
    console.log(`Extracted date from page: "${dateText}" → ${pageDate}`);

    allMatches = await extractMatches(pageDate);
    console.log(`Found ${allMatches.length} matches for ${pageDate}`);
  }

  await browser.close();

  // Helper function to check if score is empty
  const isScoreEmpty = (score) => !score || score === '' || score === '---' || score.trim() === '';

  // Filter to only matches with complete metadata
  let validMatches = allMatches.filter(m =>
    m.tournament &&
    m.country &&
    m.surface &&
    m.odds1 &&
    m.odds2 &&
    m.nationality1 &&
    m.nationality2 &&
    m.match_date  // ✅ Must have date
  );

  // Apply filtering based on mode
  const beforeFilterCount = validMatches.length;

  if (filterMode === '--pending') {
    validMatches = validMatches.filter(m => isScoreEmpty(m.score));
  } else if (filterMode === '--finished') {
    validMatches = validMatches.filter(m => !isScoreEmpty(m.score));
  } else if (filterMode === '--strip-scores') {
    validMatches = validMatches.map(m => ({
      ...m,
      score: '',
      winner: '',
      homeSetScore: '',
      awaySetScore: ''
    }));
  }

  console.log(`\n=== EXTRACTION SUMMARY ===`);
  console.log(`Total matches extracted: ${allMatches.length}`);
  console.log(`Matches with valid metadata: ${beforeFilterCount}`);
  if (filterMode !== '--all') {
    console.log(`After filtering (${filterMode}): ${validMatches.length}`);
  }

  // Count unique dates
  const uniqueDates = [...new Set(validMatches.map(m => m.match_date))];
  console.log(`\nUnique dates in dataset: ${uniqueDates.length}`);
  uniqueDates.forEach(date => {
    const count = validMatches.filter(m => m.match_date === date).length;
    console.log(`  - ${date}: ${count} matches`);
  });

  console.log(`\nFinal dataset breakdown:`);
  console.log(`  - Total in output: ${validMatches.length}`);
  console.log(`  - With odds: ${validMatches.filter(m => m.odds1 && m.odds2).length}`);
  console.log(`  - With scores (finished): ${validMatches.filter(m => !isScoreEmpty(m.score)).length}`);
  console.log(`  - Without scores (pending): ${validMatches.filter(m => isScoreEmpty(m.score)).length}`);
  console.log(`  - With winner: ${validMatches.filter(m => m.winner).length}`);

  // Save to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validMatches, null, 2));
  console.log(`\n✓ Saved ${validMatches.length} matches to ${OUTPUT_FILE}`);

  // Show sample
  const sampleSize = Math.min(3, validMatches.length);
  if (sampleSize > 0) {
    console.log(`\n=== SAMPLE DATA (first ${sampleSize} matches) ===`);
    validMatches.slice(0, sampleSize).forEach((m, i) => {
      console.log(`\n${i + 1}. ${m.player1} (${m.nationality1}) vs ${m.player2} (${m.nationality2})`);
      console.log(`   Tournament: ${m.tournament}`);
      console.log(`   Country: ${m.country}, Surface: ${m.surface}`);
      console.log(`   Odds: ${m.odds1} / ${m.odds2}`);
      console.log(`   Score: ${isScoreEmpty(m.score) ? 'NOT PLAYED YET' : m.score}`);
      console.log(`   Winner: ${m.winner || 'TBD'}`);
      console.log(`   Date: ${m.match_date} ✅`);
    });
  } else {
    console.log(`\n⚠️  No matches found with filter: ${filterMode}`);
  }

  console.log(`\n✅ Done! Use this file for:`);
  if (filterMode === '--pending') {
    console.log(`   Morning predictions (Workflow A)`);
  } else if (filterMode === '--finished') {
    console.log(`   Evening results upload (Workflow B)`);
  } else if (filterMode === '--strip-scores') {
    console.log(`   Training/testing predictions`);
  } else {
    console.log(`   General data collection with accurate dates`);
  }
  console.log(`\n📅 All matches include match_date field extracted from Flashscore\n`);

  process.exit(0);
})();
