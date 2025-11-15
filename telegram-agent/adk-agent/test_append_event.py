#!/usr/bin/env python3
"""
Test append_event method with correct signature
"""

import asyncio
from google.adk.sessions import InMemorySessionService, Event

async def test_append_event():
    print("Testing append_event method with correct signature...")
    
    # Create session service
    session_service = InMemorySessionService()
    
    # Create a test session
    session = await session_service.create_session(
        app_name="test_app",
        user_id="test_user", 
        session_id="test_session_123"
    )
    print(f"Created session: {session}")
    
    # Test append_event with correct signature
    try:
        event = Event(
            type="user_message",
            data={"text": "hello", "user": "test_user"}
        )
        result = await session_service.append_event(session, event)
        print("✅ append_event called successfully")
        print(f"Result: {result}")
        
        # Get the session to verify the event was added
        session = await session_service.get_session("test_app", "test_user", "test_session_123")
        print(f"Session after append_event: {session}")
        print(f"Events in session: {session.events if hasattr(session, 'events') else 'No events attr'}")
        
    except Exception as e:
        print(f"❌ Error with append_event: {e}")
        return False
    
    print("✅ append_event test passed")
    return True

if __name__ == "__main__":
    asyncio.run(test_append_event())
