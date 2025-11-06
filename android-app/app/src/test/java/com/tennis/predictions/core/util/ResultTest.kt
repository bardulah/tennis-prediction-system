package com.tennis.predictions.core.util

import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for Result wrapper
 */
class ResultTest {

    @Test
    fun `success creates Success result`() {
        val data = "test data"
        val result = Result.success(data)

        assertTrue(result is Result.Success)
        assertTrue(result.isSuccess)
        assertFalse(result.isError)
        assertFalse(result.isLoading)
        assertEquals(data, result.getOrNull())
    }

    @Test
    fun `error creates Error result`() {
        val exception = Exception("Test error")
        val result = Result.error(exception, "Error message")

        assertTrue(result is Result.Error)
        assertTrue(result.isError)
        assertFalse(result.isSuccess)
        assertFalse(result.isLoading)
        assertEquals(exception, result.exceptionOrNull())
        assertNull(result.getOrNull())
    }

    @Test
    fun `loading creates Loading result`() {
        val result = Result.loading()

        assertTrue(result is Result.Loading)
        assertTrue(result.isLoading)
        assertFalse(result.isSuccess)
        assertFalse(result.isError)
        assertNull(result.getOrNull())
    }

    @Test
    fun `map transforms success data`() {
        val result = Result.success(5)
        val mapped = result.map { it * 2 }

        assertTrue(mapped is Result.Success)
        assertEquals(10, mapped.getOrNull())
    }

    @Test
    fun `map does not transform error`() {
        val exception = Exception("Test")
        val result: Result<Int> = Result.error(exception)
        val mapped = result.map { it * 2 }

        assertTrue(mapped is Result.Error)
        assertEquals(exception, mapped.exceptionOrNull())
    }

    @Test
    fun `getOrDefault returns data for success`() {
        val result = Result.success(42)
        assertEquals(42, result.getOrDefault(0))
    }

    @Test
    fun `getOrDefault returns default for error`() {
        val result: Result<Int> = Result.error(Exception())
        assertEquals(0, result.getOrDefault(0))
    }

    @Test
    fun `getOrThrow returns data for success`() {
        val result = Result.success(42)
        assertEquals(42, result.getOrThrow())
    }

    @Test(expected = Exception::class)
    fun `getOrThrow throws exception for error`() {
        val result: Result<Int> = Result.error(Exception("Test"))
        result.getOrThrow()
    }

    @Test
    fun `onSuccess executes action for Success`() {
        var executed = false
        val result = Result.success("data")

        result.onSuccess { executed = true }

        assertTrue(executed)
    }

    @Test
    fun `onSuccess does not execute action for Error`() {
        var executed = false
        val result: Result<String> = Result.error(Exception())

        result.onSuccess { executed = true }

        assertFalse(executed)
    }

    @Test
    fun `onError executes action for Error`() {
        var executed = false
        val result: Result<String> = Result.error(Exception())

        result.onError { executed = true }

        assertTrue(executed)
    }

    @Test
    fun `onError does not execute action for Success`() {
        var executed = false
        val result = Result.success("data")

        result.onError { executed = true }

        assertFalse(executed)
    }
}
