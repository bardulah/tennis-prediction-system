package com.tennis.predictions.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.tennis.predictions.core.database.dao.PredictionDao
import com.tennis.predictions.core.database.entity.PredictionEntity

@Database(
    entities = [PredictionEntity::class],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class TennisDatabase : RoomDatabase() {
    abstract fun predictionDao(): PredictionDao

    companion object {
        const val DATABASE_NAME = "tennis_predictions.db"
    }
}
