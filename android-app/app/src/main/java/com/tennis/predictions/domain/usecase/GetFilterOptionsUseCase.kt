package com.tennis.predictions.domain.usecase

import com.tennis.predictions.core.util.Result
import com.tennis.predictions.data.model.FilterOptions
import com.tennis.predictions.data.repository.PredictionsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import timber.log.Timber
import javax.inject.Inject

/**
 * Use case for fetching available filter options
 */
class GetFilterOptionsUseCase @Inject constructor(
    private val repository: PredictionsRepository
) {
    operator fun invoke(): Flow<Result<FilterOptions>> = flow {
        emit(Result.Loading)

        val result = repository.getFilterOptions()

        result.onSuccess { filters ->
            emit(Result.Success(filters))
        }.onFailure { exception ->
            Timber.e(exception, "Failed to fetch filter options")
            emit(Result.Error(exception, "Failed to load filter options"))
        }
    }.catch { exception ->
        Timber.e(exception, "Unexpected error in GetFilterOptionsUseCase")
        emit(Result.Error(exception, "Unexpected error occurred"))
    }
}
