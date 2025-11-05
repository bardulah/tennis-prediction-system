package com.tennis.predictions.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.util.AIAnalysisService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AnalysisUiState(
    val isLoading: Boolean = false,
    val analysis: String? = null,
    val sources: List<String> = emptyList(),
    val error: String? = null,
    val selectedProvider: AIProvider = AIProvider.GOOGLE,
    val fromCache: Boolean = false
)

enum class AIProvider {
    GOOGLE, PERPLEXITY
}

class AnalysisViewModel(
    private val aiService: AIAnalysisService
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

            val result = when (provider) {
                AIProvider.GOOGLE -> aiService.analyzeWithGoogle(prediction)
                AIProvider.PERPLEXITY -> aiService.analyzeWithPerplexity(prediction)
            }

            result.onSuccess { analysisResult ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        analysis = analysisResult.analysis,
                        sources = analysisResult.sources,
                        fromCache = analysisResult.fromCache,
                        error = null
                    )
                }
            }.onFailure { exception ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = exception.message ?: "Analysis failed"
                    )
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

    fun clearCache() {
        aiService.clearCache()
    }
}
