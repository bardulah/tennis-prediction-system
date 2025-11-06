package com.tennis.predictions.domain.usecase

import com.tennis.predictions.core.util.Result
import com.tennis.predictions.core.util.RetryPolicy
import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.util.AIAnalysisService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import timber.log.Timber
import javax.inject.Inject

/**
 * Use case for analyzing a match with AI
 */
class AnalyzeMatchUseCase @Inject constructor(
    private val aiService: AIAnalysisService
) {
    operator fun invoke(
        prediction: Prediction,
        provider: AIProvider
    ): Flow<Result<AnalysisResult>> = flow {
        emit(Result.Loading)

        val result = RetryPolicy.retryWithExponentialBackoff(
            maxRetries = 2 // AI calls are expensive, retry less
        ) {
            when (provider) {
                AIProvider.GOOGLE -> aiService.analyzeWithGoogle(prediction)
                AIProvider.PERPLEXITY -> aiService.analyzeWithPerplexity(prediction)
            }
        }

        result.onSuccess { analysisResult ->
            emit(Result.Success(
                AnalysisResult(
                    analysis = analysisResult.analysis,
                    sources = analysisResult.sources,
                    fromCache = analysisResult.fromCache,
                    provider = provider
                )
            ))
        }.onFailure { exception ->
            Timber.e(exception, "Failed to analyze match")
            emit(Result.Error(exception, "Failed to analyze match"))
        }
    }.catch { exception ->
        Timber.e(exception, "Unexpected error in AnalyzeMatchUseCase")
        emit(Result.Error(exception, "Unexpected error occurred"))
    }
}

enum class AIProvider {
    GOOGLE, PERPLEXITY
}

data class AnalysisResult(
    val analysis: String,
    val sources: List<String>,
    val fromCache: Boolean,
    val provider: AIProvider
)
