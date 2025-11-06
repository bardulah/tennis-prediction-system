package com.tennis.predictions.domain.usecase

import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.data.repository.PredictionsRepository
import javax.inject.Inject

/**
 * Use case for calculating overall statistics
 */
class CalculateStatsUseCase @Inject constructor(
    private val repository: PredictionsRepository
) {
    operator fun invoke(predictions: List<Prediction>): PredictionStats {
        val (accuracy, avgConfidence, valueBetShare) =
            repository.calculateOverallStats(predictions)

        return PredictionStats(
            accuracy = accuracy,
            avgConfidence = avgConfidence,
            valueBetShare = valueBetShare
        )
    }
}

data class PredictionStats(
    val accuracy: Double?,
    val avgConfidence: Int,
    val valueBetShare: Double
)
