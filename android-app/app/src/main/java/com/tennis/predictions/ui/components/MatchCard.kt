package com.tennis.predictions.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tennis.predictions.data.model.Prediction
import com.tennis.predictions.ui.theme.*
import com.tennis.predictions.util.formatOdds

@Composable
fun MatchCard(
    prediction: Prediction,
    onAnalyzeClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Players and Odds
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = prediction.player1,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = if (prediction.predictedWinner == prediction.player1)
                                FontWeight.Bold else FontWeight.Normal
                        )
                        if (prediction.predictedWinner == prediction.player1) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "✓",
                                style = MaterialTheme.typography.titleMedium,
                                color = Success
                            )
                        }
                    }
                    Text(
                        text = prediction.oddsPlayer1.formatOdds(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Text(
                    text = "vs",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )

                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.End
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (prediction.predictedWinner == prediction.player2) {
                            Text(
                                text = "✓",
                                style = MaterialTheme.typography.titleMedium,
                                color = Success
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                        }
                        Text(
                            text = prediction.player2,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = if (prediction.predictedWinner == prediction.player2)
                                FontWeight.Bold else FontWeight.Normal
                        )
                    }
                    Text(
                        text = prediction.oddsPlayer2.formatOdds(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Badges Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Confidence Badge
                ConfidenceBadge(
                    confidence = prediction.confidenceScore,
                    label = prediction.getConfidenceBadge()
                )

                // Action Badge
                ActionBadge(action = prediction.recommendedAction)

                // Value Bet Badge
                if (prediction.valueBet == true) {
                    Badge(
                        containerColor = Success.copy(alpha = 0.2f),
                        contentColor = Success
                    ) {
                        Text("VALUE", style = MaterialTheme.typography.labelSmall)
                    }
                }

                // Result Badge
                prediction.getPredictionResult()?.let { result ->
                    Badge(
                        containerColor = if (prediction.predictionCorrect == true)
                            Success.copy(alpha = 0.2f) else Error.copy(alpha = 0.2f),
                        contentColor = if (prediction.predictionCorrect == true) Success else Error
                    ) {
                        Text(result, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Analyze Button
            Button(
                onClick = onAnalyzeClick,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Psychology,
                    contentDescription = "Analyze",
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Analyze with AI")
            }
        }
    }
}

@Composable
fun ConfidenceBadge(confidence: Int, label: String) {
    val color = when {
        confidence >= 80 -> HighConfidence
        confidence >= 60 -> MedConfidence
        else -> LowConfidence
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.2f))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = "$label $confidence%",
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun ActionBadge(action: String?) {
    val (color, text) = when (action?.lowercase()) {
        "bet" -> BetAction to "BET"
        "monitor" -> MonitorAction to "MONITOR"
        "skip" -> SkipAction to "SKIP"
        else -> OnSurfaceVariant to "N/A"
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.2f))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.Medium
        )
    }
}
