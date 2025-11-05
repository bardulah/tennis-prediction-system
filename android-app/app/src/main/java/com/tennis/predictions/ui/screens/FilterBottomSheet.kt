package com.tennis.predictions.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tennis.predictions.ui.viewmodel.PredictionsUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterBottomSheet(
    uiState: PredictionsUiState,
    onDismiss: () -> Unit,
    onSearchChange: (String) -> Unit,
    onTournamentSelect: (String?) -> Unit,
    onSurfaceSelect: (String?) -> Unit,
    onActionSelect: (String?) -> Unit,
    onValueBetsToggle: () -> Unit,
    onClearFilters: () -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf(uiState.searchQuery) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        modifier = modifier,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false),
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Filters",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Row {
                        TextButton(onClick = {
                            onClearFilters()
                            searchQuery = ""
                        }) {
                            Text("Clear All")
                        }
                        IconButton(onClick = onDismiss) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close"
                            )
                        }
                    }
                }
            }

            // Search
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = {
                        searchQuery = it
                        onSearchChange(it)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Search tournaments or players...") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Search"
                        )
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = {
                                searchQuery = ""
                                onSearchChange("")
                            }) {
                                Icon(
                                    imageVector = Icons.Default.Clear,
                                    contentDescription = "Clear"
                                )
                            }
                        }
                    },
                    singleLine = true
                )
            }

            // Value Bets Toggle
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Value Bets Only",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Switch(
                        checked = uiState.showValueBetsOnly,
                        onCheckedChange = { onValueBetsToggle() }
                    )
                }
            }

            // Surface Filter
            item {
                FilterSection(
                    title = "Surface",
                    options = uiState.filterOptions?.surfaces ?: emptyList(),
                    selectedOption = uiState.selectedSurface,
                    onOptionSelect = onSurfaceSelect
                )
            }

            // Recommended Action Filter
            item {
                FilterSection(
                    title = "Recommended Action",
                    options = listOf("bet", "monitor", "skip"),
                    selectedOption = uiState.selectedAction,
                    onOptionSelect = onActionSelect
                )
            }

            // Tournament Filter
            item {
                FilterSection(
                    title = "Tournament",
                    options = uiState.filterOptions?.tournaments ?: emptyList(),
                    selectedOption = uiState.selectedTournament,
                    onOptionSelect = onTournamentSelect
                )
            }
        }
    }
}

@Composable
fun FilterSection(
    title: String,
    options: List<String>,
    selectedOption: String?,
    onOptionSelect: (String?) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = selectedOption == null,
                onClick = { onOptionSelect(null) },
                label = { Text("All") }
            )
            options.take(3).forEach { option ->
                FilterChip(
                    selected = selectedOption == option,
                    onClick = {
                        onOptionSelect(if (selectedOption == option) null else option)
                    },
                    label = { Text(option) }
                )
            }
        }
    }
}
