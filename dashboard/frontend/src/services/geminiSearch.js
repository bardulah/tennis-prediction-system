import { GoogleGenAI } from "@google/genai";
import { SportPick } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (str) => {
  // Remove markdown formatting and trim whitespace
  return str.replace(/^```json\s*|```$/g, '').trim();
};

export const fetchSportsPicks = async (userQuery) => {
  const systemInstruction = `You are an expert sports betting analyst. Your goal is to find the best sports betting picks for the user for the current day by searching the web. When searching, consider a wide range of sources including popular sports news websites, blogs, and discussions on social platforms like X (formerly Twitter) or Reddit.

For each pick, provide a concise summary, its decimal odds, and its source.

ALWAYS respond with a valid JSON object in a string format. Do not add any markdown formatting like \`\`\`json. The JSON object must have a single key 'picks' which is an array of objects.

Each object must have the following properties:
- 'league': string
- 'matchup': string
- 'pick': string
- 'reason': string
- 'odds': number (if available)
- 'sourceUrl': string (the direct URL of the source article/post)
- 'sourceTitle': string (the title of the source article/post)
- 'searchKeyword': string (the single most unique team or player name from the matchup to use for a search query)

If you cannot find any picks, return an empty array for the 'picks' key.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
          { role: 'user', parts: [{ text: systemInstruction }] },
          { role: 'model', parts: [{ text: 'OK, I will find the best sports picks and respond in the required JSON format.' }] },
          { role: 'user', parts: [{ text: userQuery }] },
      ],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = cleanJsonString(response.text);
    const parsedData = JSON.parse(jsonText);
    const picks = parsedData.picks || [];

    return { picks };

  } catch (error) {
    console.error("Error fetching or parsing sports picks:", error);
    throw new Error("Failed to get a valid response from the AI model.");
  }
};
