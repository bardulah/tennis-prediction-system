package com.tennis.predictions.util

import android.content.Context
import android.content.SharedPreferences
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.Tool
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.googleSearch
import com.google.gson.Gson
import com.tennis.predictions.BuildConfig
import com.tennis.predictions.data.model.Prediction
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AIAnalysisService @Inject constructor(
    @ApplicationContext context: Context
) {

    private val preferences: SharedPreferences =
        context.getSharedPreferences("ai_cache", Context.MODE_PRIVATE)

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val geminiModel = GenerativeModel(
        modelName = "gemini-2.0-flash-exp",
        apiKey = BuildConfig.GOOGLE_AI_API_KEY,
        tools = listOf(Tool(googleSearch()))
    )

    data class AnalysisResult(
        val analysis: String,
        val sources: List<String> = emptyList(),
        val fromCache: Boolean = false
    )

    suspend fun analyzeWithGoogle(prediction: Prediction): Result<AnalysisResult> =
        withContext(Dispatchers.IO) {
            try {
                val cacheKey = getCacheKey("google", prediction)
                val cached = getCachedAnalysis(cacheKey)
                if (cached != null) {
                    return@withContext Result.success(
                        AnalysisResult(cached.first, cached.second, fromCache = true)
                    )
                }

                val prompt = buildAnalysisPrompt(prediction)
                val response = geminiModel.generateContent(
                    content {
                        text(prompt)
                    }
                )

                val analysisText = response.text ?: "No analysis generated"
                val sources = extractGoogleSources(response.toString())

                cacheAnalysis(cacheKey, analysisText, sources)

                Result.success(AnalysisResult(analysisText, sources, fromCache = false))
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun analyzeWithPerplexity(prediction: Prediction): Result<AnalysisResult> =
        withContext(Dispatchers.IO) {
            try {
                val cacheKey = getCacheKey("perplexity", prediction)
                val cached = getCachedAnalysis(cacheKey)
                if (cached != null) {
                    return@withContext Result.success(
                        AnalysisResult(cached.first, cached.second, fromCache = true)
                    )
                }

                val prompt = buildAnalysisPrompt(prediction)
                val jsonBody = JSONObject().apply {
                    put("model", "sonar-pro")
                    put("messages", JSONArray().apply {
                        put(JSONObject().apply {
                            put("role", "system")
                            put("content", "You are a professional tennis betting analyst providing comprehensive match analysis.")
                        })
                        put(JSONObject().apply {
                            put("role", "user")
                            put("content", prompt)
                        })
                    })
                    put("temperature", 0.2)
                    put("max_tokens", 2000)
                    put("search_recency_filter", "week")
                }

                val request = Request.Builder()
                    .url("https://api.perplexity.ai/chat/completions")
                    .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
                    .addHeader("Authorization", "Bearer ${BuildConfig.PERPLEXITY_API_KEY}")
                    .addHeader("Content-Type", "application/json")
                    .build()

                val response = okHttpClient.newCall(request).execute()
                val responseBody = response.body?.string() ?: throw Exception("Empty response")

                if (!response.isSuccessful) {
                    throw Exception("Perplexity API error: ${response.code}")
                }

                val jsonResponse = JSONObject(responseBody)
                val analysisText = jsonResponse
                    .getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content")

                val sources = extractPerplexitySources(jsonResponse)

                cacheAnalysis(cacheKey, analysisText, sources)

                Result.success(AnalysisResult(analysisText, sources, fromCache = false))
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    private fun buildAnalysisPrompt(prediction: Prediction): String {
        return """
Provide a comprehensive tennis betting analysis for this match:

**Match Details:**
- Tournament: ${prediction.tournament}
- Surface: ${prediction.surface}
- Players: ${prediction.player1} vs ${prediction.player2}
- Odds: ${prediction.player1} (${prediction.oddsPlayer1}) vs ${prediction.player2} (${prediction.oddsPlayer2})
- AI Prediction: ${prediction.predictedWinner} (${prediction.confidenceScore}% confidence)
- Recommended Action: ${prediction.recommendedAction}
${if (prediction.valueBet == true) "- Value Bet: Yes" else ""}

Please provide analysis covering:

1. **Recent Form & Performance**
   - Last 5-10 matches for each player
   - Current win/loss streaks
   - Recent tournament results
   - Current ranking trends

2. **Head-to-Head Record**
   - Overall H2H record
   - H2H on this specific surface
   - Recent meetings

3. **Surface Analysis**
   - Performance on ${prediction.surface} for each player
   - Surface-specific strengths and weaknesses
   - Historical ${prediction.surface} court stats

4. **Playing Style & Matchup**
   - Key strengths and weaknesses of each player
   - Tactical matchup considerations
   - Service and return game analysis

5. **Current Context**
   - Any injury concerns or fitness issues
   - Tournament-specific factors
   - Motivation and importance of the match

6. **Betting Value Assessment**
   - Analysis of the current odds
   - Value identification
   - Risk assessment

7. **Final Prediction**
   - Predicted winner with confidence level
   - Expected scoreline or match dynamics
   - Alternative scenarios to consider

Focus on facts and recent data. Be specific and cite sources where possible.
        """.trimIndent()
    }

    private fun getCacheKey(provider: String, prediction: Prediction): String {
        return "$provider-${prediction.player1}-${prediction.player2}-${prediction.tournament}-${prediction.surface}-${prediction.predictionDay}"
    }

    private fun getCachedAnalysis(key: String): Pair<String, List<String>>? {
        val cached = preferences.getString(key, null) ?: return null
        val cacheTime = preferences.getLong("${key}_time", 0)
        val oneHour = 60 * 60 * 1000

        if (System.currentTimeMillis() - cacheTime > oneHour) {
            preferences.edit().remove(key).remove("${key}_time").remove("${key}_sources").apply()
            return null
        }

        val sources = Gson().fromJson(
            preferences.getString("${key}_sources", "[]"),
            Array<String>::class.java
        ).toList()

        return Pair(cached, sources)
    }

    private fun cacheAnalysis(key: String, analysis: String, sources: List<String>) {
        preferences.edit()
            .putString(key, analysis)
            .putLong("${key}_time", System.currentTimeMillis())
            .putString("${key}_sources", Gson().toJson(sources))
            .apply()
    }

    private fun extractGoogleSources(responseText: String): List<String> {
        // Extract URLs from Google search results in the response
        val urlPattern = Regex("""https?://[^\s"<>]+""")
        return urlPattern.findAll(responseText)
            .map { it.value }
            .filter { it.contains("http") && !it.contains("localhost") }
            .distinct()
            .take(10)
            .toList()
    }

    private fun extractPerplexitySources(jsonResponse: JSONObject): List<String> {
        return try {
            val citations = jsonResponse.optJSONArray("citations") ?: return emptyList()
            (0 until citations.length())
                .mapNotNull {
                    val url = citations.optString(it)
                    if (url.isNotEmpty() && !url.contains("localhost")) url else null
                }
                .distinct()
                .take(10)
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun clearCache() {
        preferences.edit().clear().apply()
    }
}
