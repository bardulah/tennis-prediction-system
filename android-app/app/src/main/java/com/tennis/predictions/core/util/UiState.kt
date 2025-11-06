package com.tennis.predictions.core.util

/**
 * Sealed interface for representing UI state in a type-safe manner
 */
sealed interface UiState<out T> {
    data object Idle : UiState<Nothing>
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val error: UiError) : UiState<Nothing>

    val isLoading: Boolean
        get() = this is Loading

    val isSuccess: Boolean
        get() = this is Success

    val isError: Boolean
        get() = this is Error

    val isIdle: Boolean
        get() = this is Idle

    fun getOrNull(): T? = when (this) {
        is Success -> data
        else -> null
    }

    fun errorOrNull(): UiError? = when (this) {
        is Error -> error
        else -> null
    }
}

/**
 * User-friendly error types
 */
sealed class UiError {
    data object NoInternet : UiError()
    data object ServerError : UiError()
    data object Unauthorized : UiError()
    data object NotFound : UiError()
    data object Timeout : UiError()
    data class ApiError(val code: Int, val message: String) : UiError()
    data class Unknown(val message: String) : UiError()

    fun getMessage(): String = when (this) {
        is NoInternet -> "No internet connection. Please check your network."
        is ServerError -> "Server error. Please try again later."
        is Unauthorized -> "Unauthorized. Please check your credentials."
        is NotFound -> "Resource not found."
        is Timeout -> "Request timeout. Please try again."
        is ApiError -> message
        is Unknown -> "An error occurred: $message"
    }
}

/**
 * Maps the success data if present
 */
inline fun <T, R> UiState<T>.map(transform: (T) -> R): UiState<R> {
    return when (this) {
        is UiState.Success -> UiState.Success(transform(data))
        is UiState.Error -> this
        is UiState.Loading -> this
        is UiState.Idle -> this
    }
}

/**
 * Extension to convert Result to UiState
 */
fun <T> Result<T>.toUiState(): UiState<T> {
    return when (this) {
        is Result.Success -> UiState.Success(data)
        is Result.Error -> UiState.Error(exception.toUiError())
        is Result.Loading -> UiState.Loading
    }
}

/**
 * Convert exception to user-friendly error
 */
fun Throwable.toUiError(): UiError {
    return when (this) {
        is java.net.UnknownHostException,
        is java.net.ConnectException -> UiError.NoInternet
        is java.net.SocketTimeoutException -> UiError.Timeout
        is retrofit2.HttpException -> {
            when (code()) {
                401 -> UiError.Unauthorized
                404 -> UiError.NotFound
                in 500..599 -> UiError.ServerError
                else -> UiError.ApiError(code(), message())
            }
        }
        else -> UiError.Unknown(message ?: "Unknown error occurred")
    }
}
