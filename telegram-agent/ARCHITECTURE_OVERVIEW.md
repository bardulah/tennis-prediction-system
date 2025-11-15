# Tennis Prediction Agent - Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TELEGRAM USER INTERFACE                      │
│                      (Telegram Bot)                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI WEBHOOK SERVER                     │
│                        (Port 3004)                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  MAIN.PY - Message Handler                  │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │ Session     │  │ Context     │  │ Response    │        │ │
│  │  │ Management  │◄─┤ Preservation│──┤ Generation  │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ADK RUNNER FRAMEWORK                        │
│                       (Google ADK)                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     DISPATCHER AGENT                        │ │
│  │                   (tennis_dispatcher)                       │ │
│  │                                                             │ │
│  │  🧭 INTELLIGENT ROUTING:                                     │ │
│  │  • Single Player Analysis → Prediction Agent               │ │
│  │  • Two Player Matchup  → Analysis Agent                    │ │
│  │  • Predictions/Values  → Prediction Agent                  │ │
│  │                                                             │ │
│  │  🔄 CONTEXT AWARENESS:                                       │ │
│  │  • "analyze all 3" → Uses previous list                    │ │
│  │  • "the first one" → References prior items                │ │
│  └───────────────────┬─────────────────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
┌─────────────────────────┐   ┌────────────────────────────────┐
│   PREDICTION AGENT      │   │      ANALYSIS AGENT            │
│                         │   │                                │
│  ┌─────────────────────┐│   │  ┌─────────────────────────────┐│
│  │ Prediction Tools    ││   │  │ Matchup Analysis Tool      ││
│  │                     ││   │  │                            ││
│  │ • get_predictions   ││   │  │ • analyze_matchup          ││
│  │ • get_value_bets    ││   │  │   (Enhanced w/ partial     ││
│  │ • get_player_*      ││   │  │    name matching)          ││
│  │ • analyze_player_*  ││   │  │                            ││
│  │ • query_database    ││   │  │  ┌───────────────────────┐  ││
│  └─────────────────────┘│   │  │  │ External LLM APIs     │  ││
│                         │   │  │  │                        │  ││
│  📊 ANALYTICS CAPABLE:  │   │  │  │ • Perplexity AI        │  ││
│  • Player matchups      │   │  │  │ • Google Gemini        │  ││
│  • Performance stats    │   │  │  │ • Advanced insights    │  ││
│  • Head-to-head data    │   │  │  └───────────────────────┘  ││
│  • Surface analysis     │   │  └─────────────────────────────┘│
│  • Value opportunities  │   │                                │
│  • Trend analysis       │   │  🎯 SPECIALIZED IN:           │
│                         │   │  • AI-powered matchup analysis │
│  🎾 SMART NAME MATCHING:│   │  • Playing style insights     │
│  • "Djokovic" → Novak   │   │  • Head-to-head predictions   │
│  • "Novak" → Djokovic   │   │  • Surface-specific analysis  │
│  • Disambiguation       │   │  • Recent form comparison     │
│  • Fallback handling    │   │                                │
└─────────────────────────┘   └────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE SESSION SERVICE                     │
│                    (PostgreSQL - Persistent Memory)             │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ agent_sessions  │  │ session_events  │  │ user_context    ││
│  │                 │  │                 │  │                 ││
│  │ • session_id    │  │ • event_id      │  │ • user_id       ││
│  │ • user_id       │  │ • event_type    │  │ • preferences   ││
│  │ • events[]      │  │ • event_data    │  │ • stats         ││
│  │ • state{}       │  │ • timestamp     │  │ • history       ││
│  │ • metadata{}    │  │                 │  │                 ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                 │
│  💾 CROSS-INSTANTIATION MEMORY:                                 │
│  • Survives agent restarts                                      │
│  • Multi-instance sharing                                       │
│  • Conversation continuity                                      │
│  • User preference persistence                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE MCP SERVER                        │
│                       (Port 3005)                               │
│                                                                 │
│  🔍 ADVANCED ANALYTICS ENGINE:                                   │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ Player Stats    │  │ Tournament      │  │ Head-to-Head    ││
│  │ Tools           │  │ Analysis        │  │ Analysis        ││
│  │                 │  │ Tools           │  │ Tools           ││
│  │ • get_player_   │  │ • get_tournament│  │ • get_head_     ││
│  │   stats         │  │   _analysis     │  │   to_head       ││
│  │ • performance_  │  │ • surface_      │  │ • form_         ││
│  │   trends        │  │   breakdown     │  │   analysis      ││
│  │ • recent_form   │  │ • historical    │  │ • h2h_          ││
│  │                 │  │   patterns      │  │   accuracy      ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ Surface & Form  │  │ Odds & Value    │  │ Performance     ││
│  │ Analysis        │  │ Analysis        │  │ Trends          ││
│  │                 │  │                 │  │                 ││
│  │ • get_surface_  │  │ • get_odds_     │  │ • get_perform-  ││
│  │   analysis      │  │   analysis      │  │   ance_trends   ││
│  │ • surface_      │  │ • get_value_    │  │ • confidence_   ││
│  │   performance   │  │   opportunities │  │   trends        ││
│  │ • court_        │  │ • value_        │  │ • win_rate_     ││
│  │   preferences   │  │   detection     │  │   tracking      ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                 │
│  🚀 8 ADVANCED QUERY TYPES:                                     │
│  1. Player Statistics & Performance Analysis                   │
│  2. Tournament Trends & Surface Breakdown                      │
│  3. Head-to-Head Matchup Analysis                              │
│  4. Recent Form & Performance Trends                           │
│  5. Court Surface Performance Analysis                         │
│  6. Betting Odds Analysis & Value Detection                    │
│  7. Advanced Value Opportunity Identification                  │
│  8. Time-Series Performance Tracking                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TENNIS PREDICTIONS DATABASE                 │
│                       (PostgreSQL)                              │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ predictions     │  │ live_matches    │  │ players         ││
│  │                 │  │                 │  │                 ││
│  │ • matchup data  │  │ • live scores   │  │ • player info   ││
│  │ • odds          │  │ • match status  │  │ • rankings      ││
│  │ • predictions   │  │ • results       │  │ • statistics    ││
│  │ • confidence    │  │                 │  │                 ││
│  │ • value_bet     │  │                 │  │                 ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                 │
│  🎾 COMPREHENSIVE TENNIS DATA:                                   │
│  • Player matchups and results                                  │
│  • Live match tracking                                          │
│  • Prediction confidence scores                                 │
│  • Value bet identification                                     │
│  • Historical performance data                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### 1. **Message Processing Flow**
```
Telegram Message → FastAPI Webhook → Session Management → ADK Runner
     ↓
Context Preservation → Intelligent Routing → Agent Selection
     ↓
Tool Execution → Database Queries → Response Generation
     ↓
Session Update → Database Storage → User Response
```

### 2. **Memory & Context Flow**
```
Conversation Turn → Session Retrieval → Context Building
     ↓
Agent Processing → Session Update → Database Storage
     ↓
Cross-Session Memory → Persistent Storage → Multi-Instance Sharing
```

### 3. **Query Processing Flow**
```
User Query → Dispatcher Routing → Agent Selection → Tool Execution
     ↓
Database Query → MCP Analytics → Result Processing → Response
     ↓
External APIs (Optional) → AI Analysis → Enhanced Response
```

## Component Details

### **1. Telegram Interface Layer**
- **FastAPI Webhook Server** (Port 3004)
- **Message Handler** with context preservation
- **Session Management** with database integration
- **Response Formatting** with Markdown support

### **2. ADK Framework Layer**
- **Runner**: Orchestrates agent execution
- **Session Service**: Database-based persistent memory
- **Event Processing**: Handles agent conversation events
- **Context Management**: Maintains conversation state

### **3. Agent Architecture**
- **Dispatcher Agent**: Intelligent routing logic
  - Single player queries → Prediction Agent
  - Two player matchups → Analysis Agent
  - Prediction requests → Prediction Agent
- **Prediction Agent**: Data retrieval and analytics
  - Database queries and filtering
  - Player-specific analysis
  - Value bet identification
  - Advanced analytics via MCP
- **Analysis Agent**: AI-powered insights
  - External LLM integration (Perplexity, Gemini)
  - Matchup analysis
  - Playing style insights
  - Head-to-head predictions

### **4. Database Layer**
- **Session Service**: PostgreSQL for persistent memory
  - `agent_sessions`: Main session data
  - `session_events`: Detailed conversation history
  - `user_context`: User preferences and statistics
- **MCP Server**: Advanced analytics engine (Port 3005)
  - 8 specialized query types
  - Complex statistical analysis
  - Time-series data processing
- **Predictions Database**: Core tennis data
  - Match predictions and results
  - Live match tracking
  - Player statistics and rankings

## Key Architectural Features

### **🔄 Context Preservation**
- Persistent conversation history in PostgreSQL
- Cross-session memory retention
- Immediate context awareness within conversations
- Multi-instance memory sharing

### **🎾 Enhanced Player Discovery**
- Multi-strategy name matching (exact, surname, partial)
- Intelligent disambiguation handling
- Graceful fallback for database unavailability
- Cross-player matchup analysis

### **🧭 Intelligent Routing**
- Query-type-based agent selection
- Context-aware routing decisions
- Fallback handling for edge cases
- Tool selection optimization

### **📊 Advanced Analytics**
- 8 specialized MCP query types
- Time-series performance analysis
- Statistical trend identification
- Value opportunity detection

### **🛡️ Robust Error Handling**
- Graceful database unavailability handling
- Friendly fallback responses
- Comprehensive error logging
- User-friendly error messages

## Technology Stack

- **Backend Framework**: Google ADK (Agent Development Kit)
- **Web Framework**: FastAPI
- **Database**: PostgreSQL with psycopg2
- **Telegram Integration**: python-telegram-bot
- **External AI**: Perplexity AI, Google Gemini
- **Protocol**: Model Context Protocol (MCP)
- **Language**: Python 3.12+
- **Deployment**: Docker-ready (ecosystem.config.js)

## Scaling Considerations

- **Database Connection Pooling**: Ready for production scaling
- **MCP Server Independence**: Can scale analytics separately
- **Session Sharing**: Multi-instance deployment support
- **Stateless Components**: Horizontal scaling capable
- **Caching Opportunities**: Database query result caching
- **Load Balancing**: Ready for load balancer deployment

This architecture provides a robust, scalable, and intelligent tennis prediction system with persistent memory, advanced analytics, and excellent user experience!
