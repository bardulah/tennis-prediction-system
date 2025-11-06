package com.tennis.predictions

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.ui.screens.AnalysisBottomSheet
import com.tennis.predictions.ui.screens.FilterBottomSheet
import com.tennis.predictions.ui.screens.MainScreen
import com.tennis.predictions.ui.theme.TennisPredictionsTheme
import com.tennis.predictions.ui.viewmodel.AnalysisViewModel
import com.tennis.predictions.ui.viewmodel.PredictionsViewModel
import com.tennis.predictions.domain.usecase.AIProvider
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            TennisPredictionsTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TennisPredictionsApp()
                }
            }
        }
    }
}

@Composable
fun TennisPredictionsApp() {
    val predictionsViewModel: PredictionsViewModel = hiltViewModel()
    val analysisViewModel: AnalysisViewModel = hiltViewModel()

    val predictionsState by predictionsViewModel.uiState.collectAsState()
    val analysisState by analysisViewModel.uiState.collectAsState()

    var showFilterSheet by remember { mutableStateOf(false) }
    var selectedPrediction by remember { mutableStateOf<Prediction?>(null) }

    MainScreen(
        uiState = predictionsState,
        onRefresh = { predictionsViewModel.refresh() },
        onToggleTournament = { tournament ->
            predictionsViewModel.toggleTournamentExpanded(tournament)
        },
        onAnalyzeClick = { prediction ->
            selectedPrediction = prediction
            analysisViewModel.analyzeMatch(prediction, analysisState.selectedProvider)
        },
        onFilterClick = { showFilterSheet = true }
    )

    // Filter Bottom Sheet
    if (showFilterSheet) {
        FilterBottomSheet(
            uiState = predictionsState,
            onDismiss = { showFilterSheet = false },
            onSearchChange = { query ->
                predictionsViewModel.setSearchQuery(query)
            },
            onTournamentSelect = { tournament ->
                predictionsViewModel.setTournamentFilter(tournament)
            },
            onSurfaceSelect = { surface ->
                predictionsViewModel.setSurfaceFilter(surface)
            },
            onActionSelect = { action ->
                predictionsViewModel.setActionFilter(action)
            },
            onValueBetsToggle = {
                predictionsViewModel.toggleValueBetsOnly()
            },
            onClearFilters = {
                predictionsViewModel.clearFilters()
            }
        )
    }

    // Analysis Bottom Sheet
    selectedPrediction?.let { prediction ->
        AnalysisBottomSheet(
            prediction = prediction,
            analysisState = analysisState,
            onDismiss = {
                selectedPrediction = null
                analysisViewModel.clearAnalysis()
            },
            onProviderChange = { provider ->
                analysisViewModel.switchProvider(provider)
            },
            onAnalyze = { provider ->
                analysisViewModel.analyzeMatch(prediction, provider)
            }
        )
    }
}
