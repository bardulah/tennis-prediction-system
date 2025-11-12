import { GoogleGenAI } from '@google/genai'
import { SportPick } from '../types'

if (!import.meta.env.VITE_GOOGLE_AI_API_KEY) {
  console.error('VITE_GOOGLE_AI_API_KEY environment variable not set.')
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY })

const cleanJsonString = (str) => {
  return str.replace(/^```json\s*|```$/g, '').trim()
}

export const fetchSportsPicks = async (userQuery) => {
  const now = new Date()
  const isoNow = now.toISOString()
  const todayDisplay = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const systemInstruction = `You are an expert sports betting analyst. Today is ${todayDisplay}, and the current UTC time is ${isoNow}. Your job is to return only upcoming sports betting picks that have not started yet. You must verify each event date and time from the sources you consult.

For each pick that remains, provide a concise summary, decimal odds, and the source link.

Rules you must follow:
1. Exclude any pick if the event has already started or finished. If you cannot confirm that the event is upcoming, omit it.
2. ALWAYS respond with a valid JSON object string (no markdown). The JSON must contain a single key called 'picks' mapped to an array.
3. Every pick object must include:
   - 'league': string
   - 'matchup': string
   - 'pick': string
   - 'reason': string
   - 'odds': number (if available)
   - 'eventStartTime': string (ISO 8601, e.g. 2024-05-01T19:30:00Z)
   - 'sourceUrl': string
   - 'sourceTitle': string
   - 'searchKeyword': string
4. Ensure the 'eventStartTime' is on or after ${isoNow}.
5. If no valid upcoming picks are available, return { "picks": [] }.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: 'Understood. I will respond with upcoming picks in the required JSON format.' }] },
        { role: 'user', parts: [{ text: userQuery }] }
      ],
      config: {
        tools: [{ googleSearch: {} }]
      }
    })

    const jsonText = cleanJsonString(response.text)
    const parsedData = JSON.parse(jsonText)
    const picks = Array.isArray(parsedData.picks) ? parsedData.picks : []

    const upcomingPicks = picks.filter((pick) => {
      if (!pick || !pick.eventStartTime) return false
      const startTime = new Date(pick.eventStartTime)
      if (Number.isNaN(startTime.getTime())) return false
      return startTime.getTime() >= now.getTime()
    })

    return { picks: upcomingPicks }
  } catch (error) {
    console.error('Error fetching or parsing sports picks:', error)
    throw new Error('Failed to get a valid response from the AI model.')
  }
}
