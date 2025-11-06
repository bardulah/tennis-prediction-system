package com.tennis.predictions.domain.usecase

import com.tennis.predictions.core.util.Result
import com.tennis.predictions.core.util.RetryPolicy
import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.data.repository.PredictionsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import timber.log.Timber
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

/**
 * Use case for fetching today's predictions with filters
 */
class GetTodaysPredictionsUseCase @Inject constructor(
    private val repository: PredictionsRepository
) {
    operator fun invoke(filters: PredictionFilters = PredictionFilters()): Flow<Result<List<Prediction>>> = flow {
        emit(Result.Loading)

        val today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

        val result = RetryPolicy.retryWithExponentialBackoff {
            repository.getPredictions(
                page = 1,
                pageSize = 1000,
                search = filters.searchQuery,
                tournament = filters.tournament,
                surface = filters.surface,
                recommendedAction = filters.recommendedAction,
                valueBet = filters.valueBet,
                minConfidence = filters.minConfidence,
                maxConfidence = filters.maxConfidence,
                dateFrom = today,
                dateTo = today,
                sortBy = "confidence_score",
                sortDir = "DESC"
            )
        }

        result.onSuccess { response ->
            emit(Result.Success(response.data))
        }.onFailure { exception ->
            Timber.e(exception, "Failed to fetch predictions")
            emit(Result.Error(exception, "Failed to load predictions"))
        }
    }.catch { exception ->
        Timber.e(exception, "Unexpected error in GetTodaysPredictionsUseCase")
        emit(Result.Error(exception, "Unexpected error occurred"))
    }
}

/**
 * Data class for prediction filters
 */
data class PredictionFilters(
    val searchQuery: String? = null,
    val tournament: String? = null,
    val surface: String? = null,
    val recommendedAction: String? = null,
    val valueBet: Boolean? = null,
    val minConfidence: Int? = null,
    val maxConfidence: Int? = null
)
