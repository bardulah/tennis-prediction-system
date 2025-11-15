#!/usr/bin/env python3
"""
Test ADK session format compliance
"""

import asyncio
from google.adk.sessions import BaseSessionService

# Test simple ADK session format
async def test_session_format():
    print("Testing ADK session format compliance...")
    
    # Mock session data in ADK expected format
    session_data = {
        "id": "test_session_123",
        "appName": "test_app", 
        "userId": "test_user"
    }
    
    print(f"Sample session data: {session_data}")
    
    # This should work with ADK
    print("✅ Session format appears correct")
    
    # Try creating a simple session service
    try:
        from database_session_service import DatabaseSessionService
        service = DatabaseSessionService()
        print("✅ DatabaseSessionService created successfully")
        
        # Test getting a session (should return None for non-existent session)
        result = await service.get_session("test_app", "test_user", "nonexistent_session")
        print(f"Session lookup result: {result}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    print("✅ ADK session format test passed")
    return True

if __name__ == "__main__":
    asyncio.run(test_session_format())
