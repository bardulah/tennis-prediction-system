package com.tennis.predictions.core.di

import android.content.Context
import androidx.room.Room
import com.tennis.predictions.core.database.TennisDatabase
import com.tennis.predictions.core.database.dao.PredictionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideApplicationContext(
        @ApplicationContext context: Context
    ): Context = context

    @Provides
    @Singleton
    fun provideTennisDatabase(
        @ApplicationContext context: Context
    ): TennisDatabase {
        return Room.databaseBuilder(
            context,
            TennisDatabase::class.java,
            TennisDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun providePredictionDao(database: TennisDatabase): PredictionDao {
        return database.predictionDao()
    }
}
