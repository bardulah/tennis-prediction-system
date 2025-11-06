package com.tennis.predictions.core.util

import kotlinx.coroutines.delay
import timber.log.Timber
import kotlin.math.pow

/**
 * Retry policy with exponential backoff
 */
object RetryPolicy {
    private const val DEFAULT_MAX_RETRIES = 3
    private const val DEFAULT_INITIAL_DELAY = 1000L // 1 second
    private const val DEFAULT_MAX_DELAY = 10000L // 10 seconds
    private const val DEFAULT_BACKOFF_FACTOR = 2.0

    /**
     * Executes a block with retry logic and exponential backoff
     */
    suspend fun <T> retryWithExponentialBackoff(
        maxRetries: Int = DEFAULT_MAX_RETRIES,
        initialDelay: Long = DEFAULT_INITIAL_DELAY,
        maxDelay: Long = DEFAULT_MAX_DELAY,
        factor: Double = DEFAULT_BACKOFF_FACTOR,
        block: suspend () -> T
    ): T {
        var currentDelay = initialDelay
        var lastException: Throwable? = null

        repeat(maxRetries) { attempt ->
            try {
                return block()
            } catch (e: Exception) {
                lastException = e

                if (attempt == maxRetries - 1) {
                    throw e
                }

                // Check if error is retryable
                if (!isRetryableError(e)) {
                    throw e
                }

                Timber.d("Retry attempt ${attempt + 1}/$maxRetries after ${currentDelay}ms")
                delay(currentDelay)

                currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelay)
            }
        }

        throw lastException ?: Exception("Retry failed with unknown error")
    }

    /**
     * Determines if an error should trigger a retry
     */
    private fun isRetryableError(exception: Throwable): Boolean {
        return when (exception) {
            is java.net.SocketTimeoutException,
            is java.net.UnknownHostException,
            is java.net.ConnectException -> true
            is retrofit2.HttpException -> exception.code() in 500..599
            else -> false
        }
    }
}
