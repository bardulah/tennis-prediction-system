package com.tennis.predictions.core.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import timber.log.Timber
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

/**
 * Manages user preferences using DataStore
 */
@Singleton
class UserPreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore

    private object PreferenceKeys {
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val DEFAULT_SURFACE_FILTER = stringPreferencesKey("default_surface_filter")
        val DEFAULT_ACTION_FILTER = stringPreferencesKey("default_action_filter")
        val SHOW_VALUE_BETS_ONLY = booleanPreferencesKey("show_value_bets_only")
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
        val HIGH_CONFIDENCE_THRESHOLD = intPreferencesKey("high_confidence_threshold")
        val CACHE_EXPIRY_HOURS = intPreferencesKey("cache_expiry_hours")
        val LAST_SYNC_TIME = longPreferencesKey("last_sync_time")
    }

    // Theme preferences
    val themeMode: Flow<ThemeMode> = dataStore.data
        .catch { handleException(it) }
        .map { preferences ->
            ThemeMode.valueOf(
                preferences[PreferenceKeys.THEME_MODE] ?: ThemeMode.SYSTEM.name
            )
        }

    suspend fun setThemeMode(mode: ThemeMode) {
        dataStore.edit { preferences ->
            preferences[PreferenceKeys.THEME_MODE] = mode.name
        }
    }

    // Filter preferences
    val defaultSurfaceFilter: Flow<String?> = dataStore.data
        .catch { handleException(it) }
        .map { it[PreferenceKeys.DEFAULT_SURFACE_FILTER] }

    suspend fun setDefaultSurfaceFilter(surface: String?) {
        dataStore.edit { preferences ->
            if (surface != null) {
                preferences[PreferenceKeys.DEFAULT_SURFACE_FILTER] = surface
            } else {
                preferences.remove(PreferenceKeys.DEFAULT_SURFACE_FILTER)
            }
        }
    }

    val defaultActionFilter: Flow<String?> = dataStore.data
        .catch { handleException(it) }
        .map { it[PreferenceKeys.DEFAULT_ACTION_FILTER] }

    suspend fun setDefaultActionFilter(action: String?) {
        dataStore.edit { preferences ->
            if (action != null) {
                preferences[PreferenceKeys.DEFAULT_ACTION_FILTER] = action
            } else {
                preferences.remove(PreferenceKeys.DEFAULT_ACTION_FILTER)
            }
        }
    }

    val showValueBetsOnly: Flow<Boolean> = dataStore.data
        .catch { handleException(it) }
        .map { it[PreferenceKeys.SHOW_VALUE_BETS_ONLY] ?: false }

    suspend fun setShowValueBetsOnly(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferenceKeys.SHOW_VALUE_BETS_ONLY] = enabled
        }
    }

    // Notification preferences
    val notificationsEnabled: Flow<Boolean> = dataStore.data
        .catch { handleException(it) }
        .map { it[PreferenceKeys.NOTIFICATIONS_ENABLED] ?: true }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferenceKeys.NOTIFICATIONS_ENABLED] = enabled
        }
    }

    // Confidence threshold
    val highConfidenceThreshold: Flow<Int> = dataStore.data
        .catch { handleException(it) }
        .map { it[PreferenceKeys.HIGH_CONFIDENCE_THRESHOLD] ?: 80 }

    suspend fun setHighConfidenceThreshold(threshold: Int) {
        dataStore.edit { preferences ->
            preferences[PreferenceKeys.HIGH_CONFIDENCE_THRESHOLD] = threshold
        }
    }

    // Cache settings
    val cacheExpiryHours: Flow<Int> = dataStore.data
        .catch { handleException(it) }
        .map { it[PreferenceKeys.CACHE_EXPIRY_HOURS] ?: 1 }

    suspend fun setCacheExpiryHours(hours: Int) {
        dataStore.edit { preferences ->
            preferences[PreferenceKeys.CACHE_EXPIRY_HOURS] = hours
        }
    }

    // Sync tracking
    val lastSyncTime: Flow<Long> = dataStore.data
        .catch { handleException(it) }
        .map { it[PreferenceKeys.LAST_SYNC_TIME] ?: 0L }

    suspend fun updateLastSyncTime() {
        dataStore.edit { preferences ->
            preferences[PreferenceKeys.LAST_SYNC_TIME] = System.currentTimeMillis()
        }
    }

    // Clear all preferences
    suspend fun clearAll() {
        dataStore.edit { it.clear() }
    }

    private fun <T> handleException(exception: Throwable): Flow<Preferences> {
        Timber.e(exception, "Error reading preferences")
        if (exception is IOException) {
            return dataStore.data
        }
        throw exception
    }
}

enum class ThemeMode {
    LIGHT, DARK, SYSTEM
}
