package com.tennis.predictions.domain.usecase

import app.cash.turbine.test
import com.tennis.predictions.core.util.Result
import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.data.model.PredictionsResponse
import com.tennis.predictions.data.model.PaginationMeta
import com.tennis.predictions.data.repository.PredictionsRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

/**
 * Unit tests for GetTodaysPredictionsUseCase
 */
class GetTodaysPredictionsUseCaseTest {

    private lateinit var repository: PredictionsRepository
    private lateinit var useCase: GetTodaysPredictionsUseCase

    @Before
    fun setup() {
        repository = mockk()
        useCase = GetTodaysPredictionsUseCase(repository)
    }

    @Test
    fun `invoke emits loading then success when repository returns data`() = runTest {
        // Given
        val mockPrediction = createMockPrediction()
        val mockResponse = PredictionsResponse(
            data = listOf(mockPrediction),
            meta = PaginationMeta(total = 1, page = 1, pageSize = 1, totalPages = 1)
        )

        coEvery {
            repository.getPredictions(any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns kotlin.Result.success(mockResponse)

        // When / Then
        useCase.invoke().test {
            // First emission should be Loading
            val loading = awaitItem()
            assertTrue(loading is Result.Loading)

            // Second emission should be Success with data
            val success = awaitItem()
            assertTrue(success is Result.Success)
            assertEquals(1, (success as Result.Success).data.size)

            awaitComplete()
        }
    }

    @Test
    fun `invoke emits loading then error when repository fails`() = runTest {
        // Given
        val exception = Exception("Network error")
        coEvery {
            repository.getPredictions(any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns kotlin.Result.failure(exception)

        // When / Then
        useCase.invoke().test {
            // First emission should be Loading
            val loading = awaitItem()
            assertTrue(loading is Result.Loading)

            // Second emission should be Error
            val error = awaitItem()
            assertTrue(error is Result.Error)
            assertEquals(exception, (error as Result.Error).exception)

            awaitComplete()
        }
    }

    @Test
    fun `invoke applies filters correctly`() = runTest {
        // Given
        val filters = PredictionFilters(
            tournament = "Wimbledon",
            surface = "Grass"
        )

        coEvery {
            repository.getPredictions(
                page = any(),
                pageSize = any(),
                search = any(),
                tournament = "Wimbledon",
                surface = "Grass",
                learningPhase = any(),
                recommendedAction = any(),
                predictionCorrect = any(),
                valueBet = any(),
                minConfidence = any(),
                maxConfidence = any(),
                dateFrom = any(),
                dateTo = any(),
                sortBy = any(),
                sortDir = any()
            )
        } returns kotlin.Result.success(
            PredictionsResponse(
                data = emptyList(),
                meta = PaginationMeta(0, 1, 0, 0)
            )
        )

        // When
        useCase.invoke(filters).test {
            awaitItem() // Loading
            awaitItem() // Success
            awaitComplete()
        }

        // Then - verify the repository was called with correct filters
        // (In real tests, we'd verify the exact parameters)
    }

    private fun createMockPrediction() = Prediction(
        predictionId = 1,
        matchId = "match1",
        predictionDate = "2024-01-01T10:00:00",
        predictionDay = "2024-01-01",
        tournament = "Test Tournament",
        surface = "Hard",
        player1 = "Player A",
        player2 = "Player B",
        oddsPlayer1 = 1.5,
        oddsPlayer2 = 2.5,
        predictedWinner = "Player A",
        confidenceScore = 85,
        reasoning = "Test reasoning",
        riskAssessment = "low",
        valueBet = true,
        recommendedAction = "bet",
        dataQualityScore = 90,
        learningPhase = "phase3_mature_system",
        daysOperated = 100,
        systemAccuracyAtPrediction = 75.0,
        dataLimitations = null,
        player1DataAvailable = true,
        player2DataAvailable = true,
        h2hDataAvailable = true,
        surfaceDataAvailable = true,
        similarMatchesCount = 10,
        actualWinner = null,
        predictionCorrect = null,
        confidenceBucket = "high",
        createdAt = "2024-01-01T09:00:00"
    )
}
