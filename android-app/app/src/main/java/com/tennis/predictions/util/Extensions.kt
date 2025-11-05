package com.tennis.predictions.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun String?.formatDate(): String {
    if (this == null) return "N/A"
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        val date = inputFormat.parse(this)
        outputFormat.format(date ?: Date())
    } catch (e: Exception) {
        this
    }
}

fun String?.formatDateTime(): String {
    if (this == null) return "N/A"
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        val outputFormat = SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault())
        val date = inputFormat.parse(this)
        outputFormat.format(date ?: Date())
    } catch (e: Exception) {
        this
    }
}

fun Double.formatOdds(): String = String.format("%.2f", this)

fun Double.formatPercentage(): String = String.format("%.1f%%", this)
