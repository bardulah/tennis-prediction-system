package com.tennis.predictions.core.di

import com.tennis.predictions.core.database.dao.PredictionDao
import com.tennis.predictions.core.util.NetworkMonitor
import com.tennis.predictions.data.api.ApiService
import com.tennis.predictions.data.repository.PredictionsRepository
import com.tennis.predictions.data.repository.PredictionsRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun providePredictionsRepository(
        apiService: ApiService,
        predictionDao: PredictionDao,
        networkMonitor: NetworkMonitor
    ): PredictionsRepository {
        return PredictionsRepositoryImpl(apiService, predictionDao, networkMonitor)
    }
}
