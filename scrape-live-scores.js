#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { Pool } = require('pg');

// Database connection from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's match identifiers from predictions table
async function getTodayMatchIdentifiers() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT match_id, player1, player2, tournament
      FROM predictions 
      WHERE prediction_day = CURRENT_DATE
      ORDER BY tournament, player1
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

// Update live match status in database
async function updateLiveMatch(matchIdentifier, liveScore, liveStatus, actualWinner) {
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT update_live_match($1, $2, $3, $4)
    `, [matchIdentifier, liveScore, liveStatus, actualWinner]);
  } finally {
    client.release();
  }
}

// Scrape live scores from Flashscore for today's matches
async function scrapeLiveScores() {
  console.log('[Live Scraper] Starting live score scraping...');
  
  // Get today's matches from our predictions
  const todayMatches = await getTodayMatchIdentifiers();
  console.log(`[Live Scraper] Found ${todayMatches.length} predictions for today`);
  
  if (todayMatches.length === 0) {
    console.log('[Live Scraper] No predictions found for today, skipping');
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('[Live Scraper] Navigating to Flashscore...');
    await page.goto('https://www.flashscore.com/tennis/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Close cookie banner if present
    try {
      await page.click('#onetrust-accept-btn-handler', { timeout: 2000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // Cookie banner not found, continue
    }

    // Wait for tennis content to load
    await page.waitForSelector('.event__match', { timeout: 10000 });
    
    // Update each match's live status
    for (const match of todayMatches) {
      try {
        console.log(`[Live Scraper] Processing: ${match.player1} vs ${match.player2}`);
        
        // Search for this specific match on the page
        const matchData = await page.evaluate((player1, player2) => {
          // Find match elements containing both player names
          const matchElements = document.querySelectorAll('.event__match');
          
          for (const matchEl of matchElements) {
            const player1El = matchEl.querySelector('.event__participant--home');
            const player2El = matchEl.querySelector('.event__participant--away');
            
            if (player1El && player2El) {
              const p1 = player1El.textContent?.trim();
              const p2 = player2El.textContent?.trim();
              
              // Check if this matches our players - require FULL name match, not just last word
              // This prevents "A." from matching both "Fiorentini A." and "Weber A."
              const p1FullMatch = p1 === player1 || player1 === p1;
              const p2FullMatch = p2 === player2 || player2 === p2;

              if (p1 && p2 && p1FullMatch && p2FullMatch) {
                
                // Get the score/status using proper extraction logic
                const homeSetScore = matchEl.querySelector('.event__score--home')?.textContent?.trim() || '';
                const awaySetScore = matchEl.querySelector('.event__score--away')?.textContent?.trim() || '';
                const homeParts = Array.from(matchEl.querySelectorAll('.event__part--home')).map(e => e.textContent?.trim());
                const awayParts = Array.from(matchEl.querySelectorAll('.event__part--away')).map(e => e.textContent?.trim());
                
                // Reconstruct full tennis score like the main scraper
                let score = '';
                if (homeSetScore && awaySetScore) {
                  const sets = homeParts.map((h, idx) => {
                    const a = awayParts[idx];
                    let homeScore = h;
                    let awayScore = a;
                    
                    // Handle special case scores (6-0, 7-6, etc.)
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
                
                const statusEl = matchEl.querySelector('.event__time');
                const status = statusEl ? statusEl.textContent?.trim() : '';
                
                // Determine live status - more precise detection
                let liveStatus = 'not_started';
                
                // Check for explicit "live" indicators
                const statusLower = status.toLowerCase();
                if (statusLower.includes('live') || 
                    statusLower.includes('set') ||
                    statusLower.includes('game') ||
                    (status.includes(':') && !statusLower.includes('not started') && !statusLower.includes('postponed'))) {
                  liveStatus = 'live';
                } else if (score && !statusLower.includes('not started')) {
                  liveStatus = 'completed';
                }
                
                // Determine winner - improved logic
                const homeIsBold = player1El?.classList.contains('fontExtraBold') || false;
                const awayIsBold = player2El?.classList.contains('fontExtraBold') || false;
                
                let winner = '';
                
                // Method 1: Check for bold font (most reliable, works for retirements)
                if (homeIsBold && !awayIsBold) {
                  winner = p1;
                } else if (awayIsBold && !homeIsBold) {
                  winner = p2;
                } else if (homeSetScore && awaySetScore) {
                  // Method 2: Fallback to set scores - count sets won from parts
                  const homeSetsWon = homeParts.filter(set => {
                    const [homeScore, awayScore] = set.split('-').map(s => parseInt(s));
                    return homeScore > awayScore;
                  }).length;
                  
                  const awaySetsWon = awayParts.filter(set => {
                    const [homeScore, awayScore] = set.split('-').map(s => parseInt(s));
                    return awayScore > homeScore;
                  }).length;
                  
                  // Also consider the final set counts as backup
                  const finalSetHome = parseInt(homeSetScore);
                  const finalSetAway = parseInt(awaySetScore);
                  
                  // Count total sets won
                  const totalHomeSets = homeSetsWon + (finalSetHome > finalSetAway ? 1 : 0);
                  const totalAwaySets = awaySetsWon + (finalSetAway > finalSetHome ? 1 : 0);
                  
                  if (totalHomeSets > totalAwaySets) {
                    winner = p1;
                  } else if (totalAwaySets > totalHomeSets) {
                    winner = p2;
                  }
                }
                
                return {
                  score: score || '',
                  status: status || '',
                  liveStatus: liveStatus,
                  winner: winner
                };
              }
            }
          }
          
          return null;
        }, match.player1, match.player2);
        
        if (matchData) {
          console.log(`[Live Scraper] Found: ${match.player1} vs ${match.player2} - ${matchData.liveStatus} - Score: ${matchData.score}` + (matchData.winner ? ` - Winner: ${matchData.winner}` : ''));
          
          // Update database
          await updateLiveMatch(
            match.match_id,
            matchData.score,
            matchData.liveStatus,
            matchData.winner || null
          );
        } else {
          console.log(`[Live Scraper] Match not found on page: ${match.player1} vs ${match.player2}`);
          // Update as not started
          await updateLiveMatch(match.match_id, '', 'not_started', null);
        }
        
      } catch (error) {
        console.error(`[Live Scraper] Error processing match ${match.player1} vs ${match.player2}:`, error.message);
        // Mark as not_started on error
        await updateLiveMatch(match.match_id, '', 'not_started', null);
      }
    }
    
  } finally {
    await browser.close();
  }
  
  console.log('[Live Scraper] Live score scraping completed');
}

// Main execution
if (require.main === module) {
  (async () => {
    try {
      if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL environment variable is required');
        process.exit(1);
      }
      
      await scrapeLiveScores();
    } catch (error) {
      console.error('[Live Scraper] Fatal error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { scrapeLiveScores };
