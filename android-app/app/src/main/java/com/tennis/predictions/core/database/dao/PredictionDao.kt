package com.tennis.predictions.core.database.dao

import androidx.paging.PagingSource
import androidx.room.*
import com.tennis.predictions.core.database.entity.PredictionEntity
import kotlinx.coroutines.flow.Flow
import java.util.Date

@Dao
interface PredictionDao {
    @Query("SELECT * FROM predictions WHERE prediction_day = :day ORDER BY confidence_score DESC")
    fun getPredictionsForDay(day: Date): Flow<List<PredictionEntity>>

    @Query("SELECT * FROM predictions WHERE prediction_day = :day ORDER BY confidence_score DESC")
    fun getPredictionsForDayPaged(day: Date): PagingSource<Int, PredictionEntity>

    @Query("""
        SELECT * FROM predictions
        WHERE prediction_day = :day
        AND (:tournament IS NULL OR tournament = :tournament)
        AND (:surface IS NULL OR surface = :surface)
        AND (:action IS NULL OR recommended_action = :action)
        AND (:valueBet = 0 OR value_bet = 1)
        ORDER BY confidence_score DESC
    """)
    fun getFilteredPredictions(
        day: Date,
        tournament: String?,
        surface: String?,
        action: String?,
        valueBet: Int
    ): Flow<List<PredictionEntity>>

    @Query("SELECT * FROM predictions WHERE tournament = :tournament")
    fun getPredictionsByTournament(tournament: String): Flow<List<PredictionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPrediction(prediction: PredictionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPredictions(predictions: List<PredictionEntity>)

    @Update
    suspend fun updatePrediction(prediction: PredictionEntity)

    @Delete
    suspend fun deletePrediction(prediction: PredictionEntity)

    @Query("DELETE FROM predictions WHERE prediction_day < :cutoffDate")
    suspend fun deleteOldPredictions(cutoffDate: Date)

    @Query("DELETE FROM predictions")
    suspend fun clearAll()

    @Query("SELECT DISTINCT tournament FROM predictions WHERE prediction_day = :day")
    fun getTournamentsForDay(day: Date): Flow<List<String>>

    @Query("SELECT COUNT(*) FROM predictions WHERE prediction_day = :day")
    suspend fun getPredictionCount(day: Date): Int

    @Query("SELECT * FROM predictions WHERE prediction_id = :id")
    suspend fun getPredictionById(id: Int): PredictionEntity?
}
