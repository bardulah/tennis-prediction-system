package com.tennis.predictions.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.domain.usecase.AIProvider
import com.tennis.predictions.domain.usecase.AnalyzeMatchUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AnalysisUiState(
    val isLoading: Boolean = false,
    val analysis: String? = null,
    val sources: List<String> = emptyList(),
    val error: String? = null,
    val selectedProvider: AIProvider = AIProvider.GOOGLE,
    val fromCache: Boolean = false
)

@HiltViewModel
class AnalysisViewModel @Inject constructor(
    private val analyzeMatchUseCase: AnalyzeMatchUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AnalysisUiState())
    val uiState: StateFlow<AnalysisUiState> = _uiState.asStateFlow()

    fun analyzeMatch(prediction: Prediction, provider: AIProvider = AIProvider.GOOGLE) {
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = true,
                    error = null,
                    selectedProvider = provider,
                    analysis = null,
                    sources = emptyList()
                )
            }

            analyzeMatchUseCase(prediction, provider).collect { result ->
                result.onLoading {
                    _uiState.update { it.copy(isLoading = true, error = null) }
                }.onSuccess { analysisResult ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            analysis = analysisResult.analysis,
                            sources = analysisResult.sources,
                            fromCache = analysisResult.fromCache,
                            error = null
                        )
                    }
                }.onError { exception ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Analysis failed"
                        )
                    }
                }
            }
        }
    }

    fun switchProvider(provider: AIProvider) {
        _uiState.update { it.copy(selectedProvider = provider) }
    }

    fun clearAnalysis() {
        _uiState.update {
            AnalysisUiState(selectedProvider = it.selectedProvider)
        }
    }
}
