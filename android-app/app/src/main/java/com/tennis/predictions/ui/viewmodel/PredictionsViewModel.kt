package com.tennis.predictions.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tennis.predictions.data.model.FilterOptions
import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.data.model.TournamentGroup
import com.tennis.predictions.data.repository.PredictionsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

data class PredictionsUiState(
    val isLoading: Boolean = false,
    val predictions: List<Prediction> = emptyList(),
    val tournamentGroups: List<TournamentGroup> = emptyList(),
    val filterOptions: FilterOptions? = null,
    val error: String? = null,
    val searchQuery: String = "",
    val selectedTournament: String? = null,
    val selectedSurface: String? = null,
    val selectedAction: String? = null,
    val minConfidence: Int? = null,
    val maxConfidence: Int? = null,
    val showValueBetsOnly: Boolean = false,
    val expandedTournaments: Set<String> = emptySet(),

    // Stats
    val accuracy: Double? = null,
    val avgConfidence: Int = 0,
    val valueBetShare: Double = 0.0
)

class PredictionsViewModel(
    private val repository: PredictionsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PredictionsUiState())
    val uiState: StateFlow<PredictionsUiState> = _uiState.asStateFlow()

    init {
        loadFilterOptions()
        loadTodaysPredictions()
    }

    fun loadTodaysPredictions() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

            val result = repository.getPredictions(
                page = 1,
                pageSize = 1000,
                search = _uiState.value.searchQuery.ifBlank { null },
                tournament = _uiState.value.selectedTournament,
                surface = _uiState.value.selectedSurface,
                recommendedAction = _uiState.value.selectedAction,
                valueBet = if (_uiState.value.showValueBetsOnly) true else null,
                minConfidence = _uiState.value.minConfidence,
                maxConfidence = _uiState.value.maxConfidence,
                dateFrom = today,
                dateTo = today,
                sortBy = "confidence_score",
                sortDir = "DESC"
            )

            result.onSuccess { response ->
                val predictions = response.data
                val tournamentGroups = repository.groupByTournament(predictions)
                val (accuracy, avgConf, valueBetShare) = repository.calculateOverallStats(predictions)

                _uiState.update {
                    it.copy(
                        isLoading = false,
                        predictions = predictions,
                        tournamentGroups = tournamentGroups,
                        accuracy = accuracy,
                        avgConfidence = avgConf,
                        valueBetShare = valueBetShare,
                        error = null
                    )
                }
            }.onFailure { exception ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = exception.message ?: "Failed to load predictions"
                    )
                }
            }
        }
    }

    private fun loadFilterOptions() {
        viewModelScope.launch {
            repository.getFilterOptions().onSuccess { filters ->
                _uiState.update { it.copy(filterOptions = filters) }
            }
        }
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadTodaysPredictions()
    }

    fun setTournamentFilter(tournament: String?) {
        _uiState.update { it.copy(selectedTournament = tournament) }
        loadTodaysPredictions()
    }

    fun setSurfaceFilter(surface: String?) {
        _uiState.update { it.copy(selectedSurface = surface) }
        loadTodaysPredictions()
    }

    fun setActionFilter(action: String?) {
        _uiState.update { it.copy(selectedAction = action) }
        loadTodaysPredictions()
    }

    fun setConfidenceRange(min: Int?, max: Int?) {
        _uiState.update { it.copy(minConfidence = min, maxConfidence = max) }
        loadTodaysPredictions()
    }

    fun toggleValueBetsOnly() {
        _uiState.update { it.copy(showValueBetsOnly = !it.showValueBetsOnly) }
        loadTodaysPredictions()
    }

    fun toggleTournamentExpanded(tournament: String) {
        _uiState.update {
            val expanded = it.expandedTournaments.toMutableSet()
            if (expanded.contains(tournament)) {
                expanded.remove(tournament)
            } else {
                expanded.add(tournament)
            }
            it.copy(expandedTournaments = expanded)
        }
    }

    fun clearFilters() {
        _uiState.update {
            it.copy(
                searchQuery = "",
                selectedTournament = null,
                selectedSurface = null,
                selectedAction = null,
                minConfidence = null,
                maxConfidence = null,
                showValueBetsOnly = false
            )
        }
        loadTodaysPredictions()
    }

    fun refresh() {
        loadFilterOptions()
        loadTodaysPredictions()
    }
}
