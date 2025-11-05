/**
 * Social Media Scraping Service
 * Fetches daily tennis picks from Reddit and other platforms
 * Uses Tavily API for intelligent web scraping
 */

const getTavilyApiKey = () => {
  return import.meta.env.VITE_TAVILY_API_KEY ||
         import.meta.env.TAVILY_API_KEY;
};

const TAVILY_API_URL = 'https://api.tavily.com/search';

// Cache management
const CACHE_KEY = 'tennis_reddit_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Get cached data if still valid
 */
function getCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    console.log('📦 Using cached Reddit data from', new Date(timestamp).toLocaleTimeString());
    return data;
  } catch (error) {
    console.warn('Error reading cache:', error);
    return null;
  }
}

/**
 * Save data to cache
 */
function setCachedData(data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('💾 Cached Reddit data for', CACHE_DURATION / 60000, 'minutes');
  } catch (error) {
    console.warn('Error saving cache:', error);
  }
}

/**
 * Search Reddit for tennis betting discussions and picks
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Structured results with picks and discussions
 */
export async function searchRedditPicks(query = 'tennis betting picks today', options = {}) {
  const apiKey = getTavilyApiKey();

  if (!apiKey) {
    console.warn("Tavily API key not found. Using mock data for demo.");
    return getMockRedditData();
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: options.depth || 'advanced',
        include_domains: options.domains || ['reddit.com'],
        max_results: options.maxResults || 10,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Process and structure the results
    return processRedditResults(data);

  } catch (error) {
    console.error('Error fetching Reddit data:', error);
    // Fallback to mock data for development
    return getMockRedditData();
  }
}

/**
 * Get tennis betting discussions from multiple subreddits
 * @returns {Promise<Array>} Array of discussion threads with picks
 */
export async function getTennisBettingThreads() {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData) {
    return cachedData;
  }

  const subreddits = [
    'tennis',
    'sportsbook',
    'SportsbookReview',
    'Betting',
    'TennisPicks'
  ];

  const queries = subreddits.map(sub =>
    `site:reddit.com/r/${sub} tennis picks ${new Date().toLocaleDateString()}`
  );

  try {
    console.log('🔍 Fetching fresh Reddit data from Tavily API');
    
    // Fetch from multiple subreddits in parallel
    const results = await Promise.all(
      queries.map(query =>
        searchRedditPicks(query, { maxResults: 5 })
      )
    );

    // Combine and deduplicate results
    const allPicks = results.flatMap(r => r.picks);
    const uniquePicks = deduplicatePicks(allPicks);

    const finalData = {
      picks: uniquePicks,
      totalThreads: results.reduce((sum, r) => sum + r.totalThreads, 0),
      lastUpdated: new Date().toISOString(),
    };

    // Cache the results
    setCachedData(finalData);

    return finalData;

  } catch (error) {
    console.error('Error fetching betting threads:', error);
    const fallbackData = getMockRedditData();
    
    // Even cache fallback data to avoid repeated API failures
    setCachedData(fallbackData);
    return fallbackData;
  }
}

/**
 * Process raw Tavily results into structured picks
 */
function processRedditResults(tavilyData) {
  const picks = [];
  const results = tavilyData.results || [];

  results.forEach((result, index) => {
    // Extract structured data from content
    const pick = {
      id: `reddit-${index}-${Date.now()}`,
      source: 'reddit',
      url: result.url,
      title: result.title,
      content: result.content,
      score: result.score || 0,
      subreddit: extractSubreddit(result.url),
      timestamp: new Date().toISOString(),
      // Try to extract player names and picks
      extracted: extractPickData(result.content),
    };

    picks.push(pick);
  });

  return {
    picks,
    summary: tavilyData.answer || 'Recent tennis betting discussions',
    totalThreads: results.length,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Extract subreddit name from URL
 */
function extractSubreddit(url) {
  const match = url.match(/reddit\.com\/r\/([^\/]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Extract structured pick data from text
 * Looks for patterns like "Player A vs Player B - pick Player A"
 */
function extractPickData(text) {
  const picks = [];

  // Common patterns for tennis picks
  const patterns = [
    /(\w+\s+\w+)\s+vs\s+(\w+\s+\w+)[\s\S]*?(?:pick|betting on|going with)[:\s]+(\w+)/gi,
    /(\w+\s+\w+)\s+over\s+(\w+\s+\w+)/gi,
    /(\w+\s+\w+)\s+ML\s+@\s+([\d.]+)/gi,
  ];

  patterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      picks.push({
        player1: match[1]?.trim(),
        player2: match[2]?.trim(),
        pick: match[3]?.trim() || match[1]?.trim(),
        confidence: 'medium', // Could be enhanced with NLP
      });
    });
  });

  return picks.length > 0 ? picks : null;
}

/**
 * Remove duplicate picks based on player names
 */
function deduplicatePicks(picks) {
  const seen = new Set();
  return picks.filter(pick => {
    const key = `${pick.title}-${pick.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Mock data for development/demo when API is not configured
 */
function getMockRedditData() {
  const today = new Date().toLocaleDateString();

  return {
    picks: [
      {
        id: 'mock-1',
        source: 'reddit',
        subreddit: 'sportsbook',
        title: `Daily Tennis Discussion - ${today}`,
        content: 'Some great value on Alcaraz today at 1.75. His form has been incredible on hard courts.',
        url: 'https://reddit.com/r/sportsbook/example1',
        score: 42,
        timestamp: new Date().toISOString(),
        extracted: [{
          player1: 'Alcaraz',
          pick: 'Alcaraz',
          confidence: 'high'
        }]
      },
      {
        id: 'mock-2',
        source: 'reddit',
        subreddit: 'tennis',
        title: 'Match Preview: Djokovic vs Sinner',
        content: 'Djokovic has won their last 3 meetings, but Sinner is improving fast. Taking Djokovic ML.',
        url: 'https://reddit.com/r/tennis/example2',
        score: 38,
        timestamp: new Date().toISOString(),
        extracted: [{
          player1: 'Djokovic',
          player2: 'Sinner',
          pick: 'Djokovic',
          confidence: 'medium'
        }]
      },
      {
        id: 'mock-3',
        source: 'reddit',
        subreddit: 'Betting',
        title: 'Tennis picks for today',
        content: 'Going big on Medvedev. His serve is unplayable right now and opponent struggles on returns.',
        url: 'https://reddit.com/r/Betting/example3',
        score: 29,
        timestamp: new Date().toISOString(),
        extracted: [{
          player1: 'Medvedev',
          pick: 'Medvedev',
          confidence: 'high'
        }]
      },
      {
        id: 'mock-4',
        source: 'reddit',
        subreddit: 'sportsbook',
        title: 'WTA Daily Discussion',
        content: 'Swiatek vs Sabalenka should be epic. Slight edge to Swiatek on clay but this is hard court.',
        url: 'https://reddit.com/r/sportsbook/example4',
        score: 24,
        timestamp: new Date().toISOString(),
        extracted: [{
          player1: 'Swiatek',
          player2: 'Sabalenka',
          pick: 'Swiatek',
          confidence: 'low'
        }]
      },
      {
        id: 'mock-5',
        source: 'reddit',
        subreddit: 'tennis',
        title: `${today} - Betting Thread`,
        content: 'Value bet alert: Rublev at 2.10 odds. He always shows up in masters events.',
        url: 'https://reddit.com/r/tennis/example5',
        score: 51,
        timestamp: new Date().toISOString(),
        extracted: [{
          player1: 'Rublev',
          pick: 'Rublev',
          confidence: 'medium'
        }]
      },
    ],
    summary: `Active tennis betting discussions across Reddit with ${5} threads discussing today's matches`,
    totalThreads: 5,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Check if Tavily service is configured
 */
export function isSocialsConfigured() {
  return !!getTavilyApiKey();
}

/**
 * Get configuration status and instructions
 */
export function getSocialsStatus() {
  const isConfigured = isSocialsConfigured();

  return {
    configured: isConfigured,
    message: isConfigured
      ? 'Tavily API configured - Live Reddit data enabled'
      : 'Using demo data - Configure VITE_TAVILY_API_KEY for live Reddit picks',
    provider: 'Tavily',
  };
}
