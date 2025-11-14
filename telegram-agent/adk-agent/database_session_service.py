"""
Database Session Service for Tennis Prediction Agent

This module provides persistent memory for the ADK agent using PostgreSQL.
Unlike InMemorySessionService, this enables memory persistence across restarts
and supports multiple instances of the agent sharing the same memory.

Features:
- Persistent session storage in PostgreSQL
- Cross-instance memory sharing
- Conversation history retention
- User context preservation across sessions
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, AsyncGenerator

import psycopg2
from dotenv import load_dotenv
from google.adk.sessions import BaseSessionService
from google.adk.events import Event
from google.genai.types import Content, Part

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")

class DatabaseSessionService(BaseSessionService):
    """
    PostgreSQL-based session service for persistent memory.
    
    This service stores session data in the database, allowing the agent
    to remember conversations across restarts and share memory between instances.
    """
    
    def __init__(self):
        self.connection_pool = None
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize the database schema for session storage."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                # Create enhanced sessions table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS agent_sessions (
                        session_id VARCHAR(255) PRIMARY KEY,
                        user_id VARCHAR(255) NOT NULL,
                        app_name VARCHAR(255) NOT NULL,
                        events JSONB DEFAULT '[]',
                        state JSONB DEFAULT '{}',
                        metadata JSONB DEFAULT '{}',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        conversation_count INTEGER DEFAULT 0,
                        total_events INTEGER DEFAULT 0
                    );
                """)
                
                # Create indexes for performance
                cur.execute("CREATE INDEX IF NOT EXISTS idx_user_session ON agent_sessions (user_id, session_id);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_app_session ON agent_sessions (app_name, session_id);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_last_activity ON agent_sessions (last_activity);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_updated_at ON agent_sessions (updated_at);")
                
                # Create session events table for detailed event tracking
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS session_events (
                        event_id SERIAL PRIMARY KEY,
                        session_id VARCHAR(255) NOT NULL,
                        user_id VARCHAR(255) NOT NULL,
                        app_name VARCHAR(255) NOT NULL,
                        event_type VARCHAR(50) NOT NULL,
                        event_data JSONB NOT NULL,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        
                        -- Foreign key constraint
                        FOREIGN KEY (session_id) REFERENCES agent_sessions(session_id) ON DELETE CASCADE
                    );
                """)
                
                # Create indexes for session_events
                cur.execute("CREATE INDEX IF NOT EXISTS idx_session_timestamp ON session_events (session_id, timestamp);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_user_timestamp ON session_events (user_id, timestamp);")
                
                # Create user context table for storing user preferences and history
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS user_context (
                        user_id VARCHAR(255) PRIMARY KEY,
                        app_name VARCHAR(255) NOT NULL,
                        user_preferences JSONB DEFAULT '{}',
                        interaction_stats JSONB DEFAULT '{}',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                
                # Create unique constraint and index for user_context
                cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_app ON user_context (user_id, app_name);")
                
                conn.commit()
                print("Database session service initialized successfully")
                
        except Exception as e:
            print(f"Error initializing database session service: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    async def create_session(
        self,
        app_name: str,
        user_id: str,
        session_id: str,
        initial_state: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Create a new session with initial state and metadata."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                initial_state = initial_state or {}
                metadata = metadata or {}
                
                # Convert to ADK expected format with camelCase fields and limit to required fields only
                session_data = {
                    'id': session_id,
                    'appName': app_name, 
                    'userId': user_id
                    # ADK expects only these required fields, no extras
                }
                
                cur.execute("""
                    INSERT INTO agent_sessions 
                    (session_id, user_id, app_name, state, metadata)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (session_id) DO UPDATE SET
                        state = COALESCE(agent_sessions.state, '{}'),
                        metadata = COALESCE(agent_sessions.metadata, '{}'),
                        last_activity = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                """, (session_id, user_id, app_name, json.dumps(initial_state), json.dumps(metadata)))
                
                # Initialize user context if not exists
                cur.execute("""
                    INSERT INTO user_context (user_id, app_name, user_preferences, interaction_stats)
                    VALUES (%s, %s, '{}', '{}')
                    ON CONFLICT (user_id, app_name) DO NOTHING
                """, (user_id, app_name))
                
                conn.commit()
                
        except Exception as e:
            print(f"Error creating session: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    async def get_session(
        self,
        app_name: str,
        user_id: str,
        session_id: str
    ) -> Optional[Dict[str, Any]]:
        """Retrieve session data by ID."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT state, metadata, events, conversation_count, total_events, created_at, updated_at
                    FROM agent_sessions 
                    WHERE session_id = %s AND user_id = %s AND app_name = %s
                """, (session_id, user_id, app_name))
                
                result = cur.fetchone()
                if result:
                    # Return data in ADK expected format with camelCase field names
                    return {
                        "id": session_id,
                        "appName": app_name,
                        "userId": user_id,
                        "state": result[0] or {},
                        "metadata": result[1] or {},
                        # Note: ADK expects only these core fields, exclude extra database fields
                    }
                return None
                
        except Exception as e:
            print(f"Error retrieving session: {e}")
            return None
        finally:
            conn.close()
    
    async def list_sessions(
        self,
        app_name: str,
        user_id: str
    ) -> List[str]:
        """List all session IDs for a user."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT session_id 
                    FROM agent_sessions 
                    WHERE user_id = %s AND app_name = %s
                    ORDER BY last_activity DESC
                """, (user_id, app_name))
                
                return [row[0] for row in cur.fetchall()]
                
        except Exception as e:
            print(f"Error listing sessions: {e}")
            return []
        finally:
            conn.close()
    
    async def update_session(
        self,
        app_name: str,
        user_id: str,
        session_id: str,
        state: Optional[Dict[str, Any]] = None,
        events: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        add_conversation: bool = False
    ) -> None:
        """Update session with new state, events, or metadata."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                # Get current session data
                cur.execute("""
                    SELECT state, events, metadata, conversation_count, total_events
                    FROM agent_sessions 
                    WHERE session_id = %s AND user_id = %s AND app_name = %s
                """, (session_id, user_id, app_name))
                
                current = cur.fetchone()
                if not current:
                    # Create session if it doesn't exist
                    await self.create_session(app_name, user_id, session_id, state, metadata)
                    return
                
                current_state, current_events, current_metadata, conv_count, total_events = current
                
                # Merge state
                if state is not None:
                    new_state = {**(current_state or {}), **state}
                else:
                    new_state = current_state or {}
                
                # Merge metadata
                if metadata is not None:
                    new_metadata = {**(current_metadata or {}), **metadata}
                else:
                    new_metadata = current_metadata or {}
                
                # Add events
                new_events = (current_events or []) + (events or [])
                
                # Update counters
                new_conv_count = conv_count + (1 if add_conversation else 0)
                new_total_events = total_events + (len(events) if events else 0)
                
                cur.execute("""
                    UPDATE agent_sessions 
                    SET state = %s,
                        events = %s,
                        metadata = %s,
                        last_activity = CURRENT_TIMESTAMP,
                        conversation_count = %s,
                        total_events = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE session_id = %s AND user_id = %s AND app_name = %s
                """, (
                    json.dumps(new_state), 
                    json.dumps(new_events), 
                    json.dumps(new_metadata),
                    new_conv_count,
                    new_total_events,
                    session_id, 
                    user_id, 
                    app_name
                ))
                
                # Store individual events in session_events table
                if events:
                    for event_data in events:
                        cur.execute("""
                            INSERT INTO session_events 
                            (session_id, user_id, app_name, event_type, event_data)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (
                            session_id, 
                            user_id, 
                            app_name, 
                            event_data.get('type', 'unknown'),
                            json.dumps(event_data)
                        ))
                
                conn.commit()
                
        except Exception as e:
            print(f"Error updating session: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    async def delete_session(
        self,
        app_name: str,
        user_id: str,
        session_id: str
    ) -> bool:
        """Delete a session and its associated events."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                # Delete session events first (due to foreign key constraint)
                cur.execute("""
                    DELETE FROM session_events 
                    WHERE session_id = %s AND user_id = %s AND app_name = %s
                """, (session_id, user_id, app_name))
                
                # Delete session
                cur.execute("""
                    DELETE FROM agent_sessions 
                    WHERE session_id = %s AND user_id = %s AND app_name = %s
                """, (session_id, user_id, app_name))
                
                deleted = cur.rowcount > 0
                conn.commit()
                return deleted
                
        except Exception as e:
            print(f"Error deleting session: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()
    
    async def delete_user_sessions(
        self,
        app_name: str,
        user_id: str
    ) -> int:
        """Delete all sessions for a user."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                # Delete session events first
                cur.execute("""
                    DELETE FROM session_events 
                    WHERE user_id = %s AND app_name = %s
                """, (user_id, app_name))
                
                # Delete sessions
                cur.execute("""
                    DELETE FROM agent_sessions 
                    WHERE user_id = %s AND app_name = %s
                """, (user_id, app_name))
                
                deleted_count = cur.rowcount
                conn.commit()
                return deleted_count
                
        except Exception as e:
            print(f"Error deleting user sessions: {e}")
            conn.rollback()
            return 0
        finally:
            conn.close()
    
    async def get_user_context(
        self,
        app_name: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get user context and preferences."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_preferences, interaction_stats, created_at, updated_at
                    FROM user_context 
                    WHERE user_id = %s AND app_name = %s
                """, (user_id, app_name))
                
                result = cur.fetchone()
                if result:
                    return {
                        "user_preferences": result[0] or {},
                        "interaction_stats": result[1] or {},
                        "created_at": result[2],
                        "updated_at": result[3]
                    }
                return None
                
        except Exception as e:
            print(f"Error retrieving user context: {e}")
            return None
        finally:
            conn.close()
    
    async def update_user_context(
        self,
        app_name: str,
        user_id: str,
        preferences: Optional[Dict[str, Any]] = None,
        interaction_stats: Optional[Dict[str, Any]] = None
    ) -> None:
        """Update user context and preferences."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                # Get current context
                cur.execute("""
                    SELECT user_preferences, interaction_stats
                    FROM user_context 
                    WHERE user_id = %s AND app_name = %s
                """, (user_id, app_name))
                
                current = cur.fetchone()
                
                if current:
                    current_prefs, current_stats = current
                    
                    new_prefs = {**(current_prefs or {}), **(preferences or {})}
                    new_stats = {**(current_stats or {}), **(interaction_stats or {})}
                    
                    cur.execute("""
                        UPDATE user_context 
                        SET user_preferences = %s,
                            interaction_stats = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = %s AND app_name = %s
                    """, (json.dumps(new_prefs), json.dumps(new_stats), user_id, app_name))
                else:
                    # Create new context
                    cur.execute("""
                        INSERT INTO user_context 
                        (user_id, app_name, user_preferences, interaction_stats)
                        VALUES (%s, %s, %s, %s)
                    """, (
                        user_id, 
                        app_name, 
                        json.dumps(preferences or {}), 
                        json.dumps(interaction_stats or {})
                    ))
                
                conn.commit()
                
        except Exception as e:
            print(f"Error updating user context: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    async def get_session_events(
        self,
        app_name: str,
        user_id: str,
        session_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get detailed event history for a session."""
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT event_type, event_data, timestamp
                    FROM session_events 
                    WHERE session_id = %s AND user_id = %s AND app_name = %s
                    ORDER BY timestamp DESC
                    LIMIT %s OFFSET %s
                """, (session_id, user_id, app_name, limit, offset))
                
                return [
                    {
                        "type": row[0],
                        "data": row[1],
                        "timestamp": row[2]
                    }
                    for row in cur.fetchall()
                ]
                
        except Exception as e:
            print(f"Error retrieving session events: {e}")
            return []
        finally:
            conn.close()
    
    def close(self):
        """Close database connections."""
        # Connection pooling would go here if implemented
        pass

# Factory function for easy integration
def create_database_session_service() -> DatabaseSessionService:
    """Create and return a DatabaseSessionService instance."""
    return DatabaseSessionService()
