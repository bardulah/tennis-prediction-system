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

let genAI = null;

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
export async function analyzeMatch(match) {
  const ai = genAI || initializeAI();

  if (!ai) {
    throw new Error("Google AI service not initialized. Please configure your API key.");
  }

  const {
    player1,
    player2,
    tournament,
    surface,
    predicted_winner,
    confidence_score,
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
- AI Prediction: ${predicted_winner} (${confidence_score}% confidence)

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
   - Compare AI prediction (${predicted_winner} at ${confidence_score}%) with bookmaker odds
   - Identify any value in the betting markets
   - Assess risk vs reward

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

    return {
      analysis,
      sources,
      timestamp: new Date().toISOString(),
      model: "gemini-2.0-flash-exp"
    };

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
 * Check if AI service is properly configured
 * @returns {boolean} True if API key is available
 */
export function isAIConfigured() {
  return !!getApiKey();
}
