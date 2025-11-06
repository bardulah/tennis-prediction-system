package com.tennis.predictions.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.tennis.predictions.data.model.Prediction
import java.util.Date

@Entity(
    tableName = "predictions",
    indices = [
        Index(value = ["prediction_day"]),
        Index(value = ["tournament"]),
        Index(value = ["created_at"])
    ]
)
data class PredictionEntity(
    @PrimaryKey
    @ColumnInfo(name = "prediction_id")
    val predictionId: Int,

    @ColumnInfo(name = "match_id")
    val matchId: String,

    @ColumnInfo(name = "prediction_date")
    val predictionDate: Date?,

    @ColumnInfo(name = "prediction_day")
    val predictionDay: Date?,

    @ColumnInfo(name = "tournament")
    val tournament: String,

    @ColumnInfo(name = "surface")
    val surface: String?,

    @ColumnInfo(name = "player1")
    val player1: String,

    @ColumnInfo(name = "player2")
    val player2: String,

    @ColumnInfo(name = "odds_player1")
    val oddsPlayer1: Double,

    @ColumnInfo(name = "odds_player2")
    val oddsPlayer2: Double,

    @ColumnInfo(name = "predicted_winner")
    val predictedWinner: String,

    @ColumnInfo(name = "confidence_score")
    val confidenceScore: Int,

    @ColumnInfo(name = "reasoning")
    val reasoning: String?,

    @ColumnInfo(name = "risk_assessment")
    val riskAssessment: String?,

    @ColumnInfo(name = "value_bet")
    val valueBet: Boolean?,

    @ColumnInfo(name = "recommended_action")
    val recommendedAction: String?,

    @ColumnInfo(name = "data_quality_score")
    val dataQualityScore: Int?,

    @ColumnInfo(name = "learning_phase")
    val learningPhase: String?,

    @ColumnInfo(name = "days_operated")
    val daysOperated: Int?,

    @ColumnInfo(name = "system_accuracy_at_prediction")
    val systemAccuracyAtPrediction: Double?,

    @ColumnInfo(name = "data_limitations")
    val dataLimitations: String?,

    @ColumnInfo(name = "player1_data_available")
    val player1DataAvailable: Boolean?,

    @ColumnInfo(name = "player2_data_available")
    val player2DataAvailable: Boolean?,

    @ColumnInfo(name = "h2h_data_available")
    val h2hDataAvailable: Boolean?,

    @ColumnInfo(name = "surface_data_available")
    val surfaceDataAvailable: Boolean?,

    @ColumnInfo(name = "similar_matches_count")
    val similarMatchesCount: Int?,

    @ColumnInfo(name = "actual_winner")
    val actualWinner: String?,

    @ColumnInfo(name = "prediction_correct")
    val predictionCorrect: Boolean?,

    @ColumnInfo(name = "confidence_bucket")
    val confidenceBucket: String?,

    @ColumnInfo(name = "created_at")
    val createdAt: Date?,

    @ColumnInfo(name = "cached_at")
    val cachedAt: Date = Date()
)

// Extension functions for conversion
fun PredictionEntity.toDomain(): Prediction {
    return Prediction(
        predictionId = predictionId,
        matchId = matchId,
        predictionDate = predictionDate?.toString(),
        predictionDay = predictionDay?.toString(),
        tournament = tournament,
        surface = surface,
        player1 = player1,
        player2 = player2,
        oddsPlayer1 = oddsPlayer1,
        oddsPlayer2 = oddsPlayer2,
        predictedWinner = predictedWinner,
        confidenceScore = confidenceScore,
        reasoning = reasoning,
        riskAssessment = riskAssessment,
        valueBet = valueBet,
        recommendedAction = recommendedAction,
        dataQualityScore = dataQualityScore,
        learningPhase = learningPhase,
        daysOperated = daysOperated,
        systemAccuracyAtPrediction = systemAccuracyAtPrediction,
        dataLimitations = dataLimitations,
        player1DataAvailable = player1DataAvailable,
        player2DataAvailable = player2DataAvailable,
        h2hDataAvailable = h2hDataAvailable,
        surfaceDataAvailable = surfaceDataAvailable,
        similarMatchesCount = similarMatchesCount,
        actualWinner = actualWinner,
        predictionCorrect = predictionCorrect,
        confidenceBucket = confidenceBucket,
        createdAt = createdAt?.toString()
    )
}

fun Prediction.toEntity(): PredictionEntity {
    return PredictionEntity(
        predictionId = predictionId,
        matchId = matchId,
        predictionDate = predictionDate?.let { parseDate(it) },
        predictionDay = predictionDay?.let { parseDate(it) },
        tournament = tournament,
        surface = surface,
        player1 = player1,
        player2 = player2,
        oddsPlayer1 = oddsPlayer1,
        oddsPlayer2 = oddsPlayer2,
        predictedWinner = predictedWinner,
        confidenceScore = confidenceScore,
        reasoning = reasoning,
        riskAssessment = riskAssessment,
        valueBet = valueBet,
        recommendedAction = recommendedAction,
        dataQualityScore = dataQualityScore,
        learningPhase = learningPhase,
        daysOperated = daysOperated,
        systemAccuracyAtPrediction = systemAccuracyAtPrediction,
        dataLimitations = dataLimitations,
        player1DataAvailable = player1DataAvailable,
        player2DataAvailable = player2DataAvailable,
        h2hDataAvailable = h2hDataAvailable,
        surfaceDataAvailable = surfaceDataAvailable,
        similarMatchesCount = similarMatchesCount,
        actualWinner = actualWinner,
        predictionCorrect = predictionCorrect,
        confidenceBucket = confidenceBucket,
        createdAt = createdAt?.let { parseDate(it) }
    )
}

private fun parseDate(dateString: String): Date? {
    return try {
        java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
            .parse(dateString)
    } catch (e: Exception) {
        null
    }
}
