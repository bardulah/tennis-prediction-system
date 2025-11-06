package com.tennis.predictions.domain.usecase

import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.data.model.TournamentGroup
import com.tennis.predictions.data.repository.PredictionsRepository
import javax.inject.Inject

/**
 * Use case for grouping predictions by tournament
 */
class GroupPredictionsByTournamentUseCase @Inject constructor(
    private val repository: PredictionsRepository
) {
    operator fun invoke(predictions: List<Prediction>): List<TournamentGroup> {
        return repository.groupByTournament(predictions)
    }
}
