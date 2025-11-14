# Tennis Prediction Agent - File Reference Guide

## Core Architecture Files

### **Interface Layer**
- **`main.py`** - FastAPI webhook server with context preservation
  - Handles Telegram messages
  - Manages session state with database
  - Preserves conversation history across turns

### **Intelligence Layer** 
- **`agents.py`** - Multi-agent system architecture
  - **Dispatcher Agent**: Intelligent routing logic
  - **Prediction Agent**: Data retrieval and analytics
  - **Analysis Agent**: AI-powered matchup insights
- **`tools.py`** - Core functionality and data access
  - Enhanced player name matching
  - Database query functions
  - Graceful fallback handling

### **Memory Layer**
- **`database_session_service.py`** - PostgreSQL-based persistent memory
  - Session state management
  - Cross-instance memory sharing
  - Conversation history storage

### **Analytics Layer**
- **`database_mcp_server.py`** - Advanced analytics engine
  - 8 specialized query types
  - Time-series analysis
  - Value opportunity detection

## Enhanced Functions

### **New Player Analysis Functions**
```python
get_player_matchups(player_name)      # Show player's matchups
analyze_player_performance(player_name) # Show performance stats  
expand_player_name(player_input)      # Convert surnames to full names
find_players_by_name(search_name)     # Smart name matching
```

### **Enhanced Existing Functions**
```python
analyze_matchup(player1, player2)     # Now supports partial names
get_predictions()                     # Enhanced filtering options
get_value_bets()                      # Value bet identification
```

## Test and Demo Files

### **Testing Suite**
- **`test_context_preservation.py`** - Tests conversation memory
- **`test_player_name_matching.py`** - Tests surname/partial matching
- **`test_routing_fix.py`** - Tests agent routing logic
- **`test_enhanced_agent.py`** - Comprehensive system tests

### **Demo Files**
- **`demo_player_matching.py`** - Demonstrates name matching logic
- **`print_architecture.py`** - Shows complete system architecture
- **`test_context_agent.py`** - Simplified agent for testing

## Configuration Files

### **Dependencies**
- **`requirements.txt`** - Python package dependencies
- **`.env`** - Environment variables (database, API keys)

### **Deployment**
- **`ecosystem.config.js`** - PM2 process management
- **`start_enhanced_agent.py`** - Unified startup script

## Documentation Files

### **Enhancement Documentation**
- **`ENHANCEMENT_DOCUMENTATION.md`** - Complete enhancement overview
- **`CONTEXT_FIX_DOCUMENTATION.md`** - Context preservation fix details
- **`PLAYER_NAME_MATCHING_FIX.md`** - Player discovery improvements
- **`CIRPANLI_ANALYSIS_FIX.md`** - Agent routing fix details
- **`ARCHITECTURE_OVERVIEW.md`** - Technical architecture deep-dive

### **Original Documentation**
- **`ARCHITECTURE.md`** - Original system design
- **`README.md`** - Project overview and setup
- **`QUICK_START.md`** - Getting started guide

## Query Types Available

### **Basic Queries (Original)**
1. `get_predictions` - Fetch predictions with filters
2. `get_value_bets` - Identify value betting opportunities
3. `analyze_matchup` - AI-powered matchup analysis

### **Enhanced Player Queries (New)**
4. `get_player_matchups` - Show all matchups for a player
5. `analyze_player_performance` - Player performance statistics
6. `query_database` - Advanced analytics via MCP

### **Advanced Analytics via MCP Server**
7. `get_player_stats` - Comprehensive player metrics
8. `get_head_to_head` - Historical matchup analysis
9. `get_form_analysis` - Recent performance trends
10. `get_surface_analysis` - Court surface performance
11. `get_tournament_analysis` - Tournament-specific insights
12. `get_odds_analysis` - Betting odds patterns
13. `get_value_opportunities` - Advanced value detection
14. `get_performance_trends` - Time-series performance tracking

## Database Schema

### **Session Storage Tables**
```sql
agent_sessions     - Main session data and conversation history
session_events     - Detailed event tracking with timestamps
user_context       - User preferences and interaction statistics
```

### **Tennis Data Tables**
```sql
predictions        - Match predictions, odds, confidence scores
live_matches       - Live match tracking and results
players           - Player information and rankings
```

## API Endpoints

### **Telegram Integration**
- `POST /webhook` - Telegram webhook endpoint
- `GET /health` - Health check endpoint

### **MCP Server** 
- `localhost:3005` - Database MCP server for analytics

### **Startup Commands**
```bash
# Full enhanced system
python start_enhanced_agent.py

# Context testing only
python test_context_agent.py

# Individual components
python database_mcp_server.py  # Port 3005
python main.py                 # Port 3004
```

## Key Improvements Summary

### **Issues Fixed**
✅ **Context Loss**: Agent remembers previous responses within sessions
✅ **Player Discovery**: "Djokovic" finds "Novak Djokovic" via surname matching
✅ **Routing Error**: "Cirpanli analysis" routes to correct agent

### **Enhancements Added**
✅ **8 New Analytics**: Advanced query types via MCP server
✅ **Persistent Memory**: Cross-restart and cross-instance memory
✅ **Graceful Fallbacks**: Friendly error handling for all failure modes

### **Architecture Benefits**
✅ **Modular Design**: Separation of concerns across layers
✅ **Scalable**: Multi-instance deployment ready
✅ **Robust**: Comprehensive error handling and fallbacks
✅ **User-Friendly**: Natural language queries with smart matching
