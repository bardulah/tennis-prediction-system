# Tennis Prediction Agent Architecture

This document outlines the architecture, setup, and operational procedures for the AI-powered Tennis Prediction Agent.

## 1. Overview

The agent is a sophisticated, multi-component system built using Google's Agent Development Kit (ADK). It functions as a Telegram bot that allows users to query a database of tennis predictions, perform detailed matchup analyses, and retrieve value bets.

The architecture is designed to be modular, scalable, and maintainable, following best practices from the ADK documentation.

### Key Architectural Components:

1.  **Multi-Agent System (ADK):** The core logic is a multi-agent system orchestrated by a central dispatcher.
    *   **Dispatcher Agent:** The primary interface that routes user queries to the appropriate specialized agent.
    *   **Prediction Agent:** Handles all requests for fetching prediction data from the database.
    *   **Analysis Agent:** Manages complex matchup analysis by querying external LLMs (Perplexity, Gemini).
2.  **Decoupled Tool Server (MCP):** Tools are implemented as a separate service using the Model Context Protocol (MCP). This decouples the agent's core logic from the tool implementations, allowing tools to be reused and scaled independently.
3.  **Persistent Long-Term Memory:** The agent uses a PostgreSQL database to store conversation history (`sessions` table). This allows the agent to maintain context across multiple sessions, providing a personalized user experience.
4.  **Telegram Webhook Interface:** The agent integrates with Telegram using a webhook server built with FastAPI, ensuring real-time message processing.
5.  **Agent Quality Evaluation Framework:** A dedicated framework exists to run automated tests, ensuring the agent's performance and preventing regressions.

## 2. How to Run the Agent

The agent requires two separate processes to be run in different terminals from the `/opt/tennis-scraper` directory.

**Prerequisites:**
*   Ensure the `sessions` table has been created in the database by running the `telegram-agent/adk-agent/database_setup.sql` script.
*   Ensure all environment variables in `telegram-agent/adk-agent/.env` are correctly configured.

### Terminal 1: Start the MCP Tool Server

```bash
# Activate the virtual environment
source telegram-agent/adk-agent/venv/bin/activate

# Start the tool server
python telegram-agent/adk-agent/mcp_server.py
```
This server runs on `http://localhost:3005` by default and exposes the agent's tools.

### Terminal 2: Start the Telegram Agent

```bash
# Activate the virtual environment
source telegram-agent/adk-agent/venv/bin/activate

# Start the main agent and webhook server
python telegram-agent/adk-agent/main.py
```
This will start the FastAPI server, set the Telegram webhook, and begin listening for user messages.

## 3. Project State & Recent Enhancements

The project recently underwent a significant migration from a Node.js-based single-agent system (using Anthropic's Claude) to the current Python-based multi-agent system (using Google's ADK).

This migration addressed several key issues, including tool-use errors and a lack of conversational memory. The following enhancements were implemented:

1.  **Agent Quality Framework:** An evaluation suite was established in `telegram-agent/adk-agent/evaluation/`. It includes a dataset (`evalset.json`) and a runner script (`run_evaluation.py`) to automate testing.
2.  **MCP Tool Server:** The agent's tools were decoupled into `mcp_server.py`, improving modularity.
3.  **Long-Term Memory:** The agent now uses `DatabaseSessionService` to persist conversations in the database, enabling long-term memory.
4.  **Multi-Agent Architecture:** The system was refactored into a dispatcher with specialized sub-agents for prediction and analysis, improving maintainability.

All changes have been merged into the `main` branch.

## 4. Known Issues

### Import Statements Fixed (Nov 13, 2025)

**Issue**: All Python files used incorrect import statements `from google_adk import ...`

**Root Cause**: The google-adk package (v1.18.0) uses namespace packaging and imports as `google.adk`, not `google_adk`.

**Status**: ✅ FIXED
- Fixed main.py imports (lines 7-10)
- Fixed agents.py imports (lines 1-3)
- Fixed tools.py imports (line 5)
- Fixed mcp_server.py imports (line 3)
- Fixed evaluation/run_evaluation.py imports (line 8)

### API Architecture Mismatch

**Critical Issue**: The code was written for a fundamentally different ADK architecture than v1.18.0.

**Problem**: 
- Code attempts to use `AgentService` and `AgentServiceFactory` which do not exist in ADK v1.18.0
- Code uses `GeminiModel` but the actual class is just named differently (should use `model="gemini-2.5-flash"` string)
- Code does not use the `Runner` class which is the correct way to execute agents
- The entire architecture around services is incorrect for this version

**Status**: ✅ FIXED (Nov 13, 2025)
- Rewrote main.py to use `Runner` class and `DatabaseSessionService`
- Rewrote agents.py to use `LlmAgent` with direct model string instead of `GeminiModel`
- Updated tools.py to properly create `FunctionTool` instances with name, description, and func parameters
- Updated mcp_server.py to use the correct McpServer API
- Fixed evaluation/run_evaluation.py to use Runner and InMemorySessionService
- All import statements now correctly use `google.adk` instead of `google_adk`