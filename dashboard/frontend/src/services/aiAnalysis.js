import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Analysis Service using Google Gemini with Grounding
 * Provides detailed tennis match analysis with web search capabilities
 */

const getApiKey = () => {
  // Try multiple sources for API key
  return import.meta.env.VITE_GOOGLE_AI_API_KEY ||
         import.meta.env.VITE_GEMINI_API_KEY ||
         import.meta.env.GOOGLE_AI_API_KEY;
};

const getPerplexityApiKey = () => {
  return import.meta.env.VITE_PERPLEXITY_API_KEY ||
         import.meta.env.PERPLEXITY_API_KEY;
};

let genAI = null;

// Cache management for AI analysis
const ANALYSIS_CACHE_KEY = 'tennis_ai_analysis_cache';
const ANALYSIS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Generate a unique key for a match analysis
 */
function generateMatchKey(match, provider = 'google') {
  return `${provider}-${match.player1}-${match.player2}-${match.tournament}-${match.surface}-${match.prediction_day}`;
}

/**
 * Get cached analysis for a match
 */
function getCachedAnalysis(match, provider = 'google') {
  try {
    const cached = localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (!cached) return null;

    const cache = JSON.parse(cached);
    const matchKey = generateMatchKey(match, provider);
    const analysis = cache[matchKey];

    if (!analysis) return null;

    const now = Date.now();
    if (now - analysis.timestamp > ANALYSIS_CACHE_DURATION) {
      // Remove expired analysis
      delete cache[matchKey];
      localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    console.log('📦 Using cached AI analysis for', matchKey);
    return analysis;
  } catch (error) {
    console.warn('Error reading analysis cache:', error);
    return null;
  }
}

/**
 * Save analysis to cache
 */
function setCachedAnalysis(match, analysis, provider = 'google') {
  try {
    const cached = localStorage.getItem(ANALYSIS_CACHE_KEY);
    const cache = cached ? JSON.parse(cached) : {};
    
    const matchKey = generateMatchKey(match, provider);
    cache[matchKey] = {
      ...analysis,
      cachedAt: new Date().toISOString(),
      matchKey,
      provider
    };

    localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cache));
    console.log('💾 Cached AI analysis for', matchKey);
  } catch (error) {
    console.warn('Error saving analysis cache:', error);
  }
}

/**
 * Get all cached analyses
 */
function getAllCachedAnalyses() {
  try {
    const cached = localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (!cached) return [];

    const cache = JSON.parse(cached);
    return Object.values(cache).map(analysis => ({
      ...analysis,
      age: Date.now() - analysis.timestamp
    }));
  } catch (error) {
    console.warn('Error reading analysis cache:', error);
    return [];
  }
}

/**
 * Analyze match using Perplexity API
 * @param {Object} match - Match object containing player and match details
 * @returns {Promise<Object>} Analysis result with text and sources
 */
export async function analyzeMatchWithPerplexity(match, forceRefresh = false) {
  const apiKey = getPerplexityApiKey();
  
  if (!apiKey) {
    throw new Error("Perplexity API key not configured. Set VITE_PERPLEXITY_API_KEY in your .env file");
  }

  // Check cache first unless forced refresh
  if (!forceRefresh) {
    const cachedAnalysis = getCachedAnalysis(match, 'perplexity');
    if (cachedAnalysis) {
      return {
        ...cachedAnalysis,
        fromCache: true,
        cachedAt: cachedAnalysis.cachedAt
      };
    }
  }

  console.log('🔮 Running fresh Perplexity AI analysis for', generateMatchKey(match, 'perplexity'));

  const {
    player1,
    player2,
    tournament,
    surface,
    odds_player1,
    odds_player2,
    prediction_day
  } = match;

  const matchDate = prediction_day ? new Date(prediction_day).toLocaleDateString() : 'upcoming';

  const prompt = `
Provide a comprehensive betting analysis for this tennis match:

**Match Details:**
- Tournament: ${tournament}
- Surface: ${surface}
- Date: ${matchDate}
- Player 1: ${player1} (Odds: ${Number(odds_player1).toFixed(2)})
- Player 2: ${player2} (Odds: ${Number(odds_player2).toFixed(2)})

**Analysis Required:**

1. **Recent Form & Performance:**
   - Analyze each player's last 5-10 matches with specific results
   - Note any winning streaks, title wins, or concerning losses
   - Current ranking and trajectory

2. **Head-to-Head Record:**
   - Historical matchup results with dates and scores
   - Surface-specific H2H breakdown
   - Key tactical patterns from previous meetings

3. **Surface Analysis:**
   - How each player performs on ${surface} courts
   - Recent ${surface} court results and statistics
   - Surface-specific strengths (serve %, return %, rally length)

4. **Playing Style & Matchup:**
   - Key strengths and weaknesses of each player
   - How their styles match up against each other
   - Critical factors (serve power, movement, consistency, mental game)

5. **Current Context:**
   - Recent injuries or fitness concerns
   - Tournament-specific factors (altitude, conditions, schedule)
   - Motivation factors (rankings, titles, head-to-head rivalry)

6. **Betting Value Assessment:**
   - Analyze the betting odds provided: ${player1} at ${Number(odds_player1).toFixed(2)}, ${player2} at ${Number(odds_player2).toFixed(2)}
   - Identify any value in the betting markets
   - Assess risk vs reward based on your analysis

7. **Final Prediction:**
   - Clear winner prediction with expected scoreline
   - Confidence level (high/medium/low) with justification
   - Alternative betting angles (sets, games, over/under)

Please use current, real-time data from web searches to ensure accuracy. Format with clear sections using markdown.
`;

  try {
    console.log('🔮 Calling Perplexity API...');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.95,
        search_recency_days: 7,
        return_images: false,
        return_related_questions: false,
        search_domain_filter: null,
        stream: false
      })
    });

    console.log('🔮 Perplexity response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔮 Perplexity API error response:', errorText);
      throw new Error(`Perplexity API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔮 Perplexity API response:', data);
    console.log('🔮 Perplexity citations:', data.citations);

    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      console.error('🔮 Perplexity response structure:', Object.keys(data));
      throw new Error("Received empty analysis from Perplexity");
    }

    const resultData = {
      analysis,
      sources: data.citations?.map((citation, index) => {
        console.log('🔮 Processing citation:', citation, 'Type:', typeof citation);
        
        // Handle different citation structures
        let title, url;
        
        if (typeof citation === 'string') {
          // Citation is just a URL string
          url = citation;
          // Extract a meaningful title from URL
          const domain = url.split('/')[2] || 'Source';
          const cleanDomain = domain.replace('www.', '');
          
          // Skip localhost/dashboard URLs and redirect to actual source
          if (cleanDomain.includes('localhost') || cleanDomain.includes('193.24.209.9')) {
            title = 'Tennis Match Data';
            url = '#';
          } else {
            title = cleanDomain;
          }
        } else if (typeof citation === 'object' && citation !== null) {
          // Citation is an object with title and url
          title = citation.title || citation.url || 'Web Source';
          url = citation.url || '#';
        } else {
          // Fallback
          title = 'Web Source';
          url = '#';
        }
        
        return {
          title,
          url: url
        };
      }) || [],
      timestamp: new Date().toISOString(),
      model: "sonar-pro",
      fromCache: false
    };

    // Cache result
    setCachedAnalysis(match, resultData, 'perplexity');

    return resultData;

  } catch (error) {
    console.error("Error calling Perplexity:", error);

    if (error.message?.includes('401')) {
      throw new Error("Invalid Perplexity API key. Please check your configuration.");
    }

    if (error.message?.includes('429')) {
      throw new Error("Perplexity API quota exceeded. Please try again later.");
    }

    throw new Error(`Perplexity Analysis failed: ${error.message}`);
  }
}

const initializeAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Google AI API key not found. Set VITE_GOOGLE_AI_API_KEY in your .env file");
    return null;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
  } catch (error) {
    console.error("Failed to initialize Google AI:", error);
    return null;
  }
};

/**
 * Analyze a tennis match using Google Gemini with web search grounding
 * @param {Object} match - Match object containing player and match details
 * @returns {Promise<Object>} Analysis result with text and sources
 */
export async function analyzeMatch(match, forceRefresh = false) {
  const ai = genAI || initializeAI();

  if (!ai) {
    throw new Error("Google AI service not initialized. Please configure your API key.");
  }

  // Check cache first unless forced refresh
  if (!forceRefresh) {
    const cachedAnalysis = getCachedAnalysis(match);
    if (cachedAnalysis) {
      return {
        ...cachedAnalysis,
        fromCache: true,
        cachedAt: cachedAnalysis.cachedAt
      };
    }
  }

  console.log('🤖 Running fresh AI analysis for', generateMatchKey(match));

  const {
    player1,
    player2,
    tournament,
    surface,
    odds_player1,
    odds_player2,
    prediction_day
  } = match;

  const matchDate = prediction_day ? new Date(prediction_day).toLocaleDateString() : 'upcoming';

  const prompt = `
Provide a comprehensive betting analysis for this tennis match:

**Match Details:**
- Tournament: ${tournament}
- Surface: ${surface}
- Date: ${matchDate}
- Player 1: ${player1} (Odds: ${Number(odds_player1).toFixed(2)})
- Player 2: ${player2} (Odds: ${Number(odds_player2).toFixed(2)})

**Analysis Required:**

1. **Recent Form & Performance:**
   - Analyze each player's last 5-10 matches with specific results
   - Note any winning streaks, title wins, or concerning losses
   - Current ranking and trajectory

2. **Head-to-Head Record:**
   - Historical matchup results with dates and scores
   - Surface-specific H2H breakdown
   - Key tactical patterns from previous meetings

3. **Surface Analysis:**
   - How each player performs on ${surface} courts
   - Recent ${surface} court results and statistics
   - Surface-specific strengths (serve %, return %, rally length)

4. **Playing Style & Matchup:**
   - Key strengths and weaknesses of each player
   - How their styles match up against each other
   - Critical factors (serve power, movement, consistency, mental game)

5. **Current Context:**
   - Recent injuries or fitness concerns
   - Tournament-specific factors (altitude, conditions, schedule)
   - Motivation factors (rankings, titles, head-to-head rivalry)

6. **Betting Value Assessment:**
   - Analyze the betting odds provided: ${player1} at ${Number(odds_player1).toFixed(2)}, ${player2} at ${Number(odds_player2).toFixed(2)}
   - Identify any value in the betting markets
   - Assess risk vs reward based on your analysis

7. **Final Prediction:**
   - Clear winner prediction with expected scoreline
   - Confidence level (high/medium/low) with justification
   - Alternative betting angles (sets, games, over/under)

Please use current, real-time data from web searches to ensure accuracy. Format with clear sections using markdown.
`;

  try {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{
        googleSearch: {}
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const response = result.response;
    const analysis = response.text();

    // Extract grounding metadata if available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map(chunk => ({
      title: chunk.web?.title || 'Web Source',
      url: chunk.web?.uri || '#',
    })) || [];

    if (!analysis || analysis.trim() === '') {
      throw new Error("Received empty analysis from AI service");
    }

    const resultData = {
      analysis,
      sources,
      timestamp: new Date().toISOString(),
      model: "gemini-2.0-flash-exp",
      fromCache: false
    };

    // Cache the result
    setCachedAnalysis(match, resultData);

    return resultData;

  } catch (error) {
    console.error("Error calling Google AI:", error);

    if (error.message?.includes('API key')) {
      throw new Error("Invalid API key. Please check your Google AI configuration.");
    }

    if (error.message?.includes('quota')) {
      throw new Error("API quota exceeded. Please try again later.");
    }

    throw new Error(`AI Analysis failed: ${error.message}`);
  }
}

/**
 * Get all cached analyses for display
 */
export function getCachedAnalyses() {
  return getAllCachedAnalyses();
}

/**
 * Clear cached analysis for a specific match
 */
export function clearMatchAnalysis(match) {
  try {
    const cached = localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (!cached) return;

    const cache = JSON.parse(cached);
    const matchKey = generateMatchKey(match);
    
    if (cache[matchKey]) {
      delete cache[matchKey];
      localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cache));
      console.log('🗑️ Cleared cached analysis for', matchKey);
    }
  } catch (error) {
    console.warn('Error clearing analysis cache:', error);
  }
}

/**
 * Check if AI service is properly configured
 * @returns {boolean} True if API key is available
 */
export function isAIConfigured() {
  return !!getApiKey();
}

/**
 * Check if Perplexity service is properly configured
 * @returns {boolean} True if API key is available
 */
export function isPerplexityConfigured() {
  return !!getPerplexityApiKey();
}

/**
 * Get configuration status for all AI providers
 * @returns {Object} Configuration status for each provider
 */
export function getAIProvidersStatus() {
  return {
    google: {
      configured: isAIConfigured(),
      name: 'Google Gemini',
      description: 'Google\'s AI model with web search grounding'
    },
    perplexity: {
      configured: isPerplexityConfigured(),
      name: 'Perplexity',
      description: 'Sonar Pro search with real-time web access'
    }
  };
}
