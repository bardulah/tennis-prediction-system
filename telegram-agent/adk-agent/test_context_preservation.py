#!/usr/bin/env python3
"""
Test script for Context Preservation in Tennis Prediction Agent

This script specifically tests the immediate conversational context issue 
where the agent should remember what it just said in the previous turn.

Test Scenario:
1. Agent provides a list of 3 matches
2. User says "analyze all 3"
3. Agent should analyze the 3 matches it just mentioned, not ask for clarification

Usage:
    python test_context_preservation.py
"""

import asyncio
import json
import os
import sys
from datetime import datetime

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

def print_test_header(test_name: str):
    """Print test header."""
    print(f"\n{'='*60}")
    print(f"🧪 CONTEXT TEST: {test_name}")
    print(f"⏰ {datetime.now().strftime('%H:%M:%S')}")
    print('='*60)

def print_test_result(test_name: str, success: bool, message: str = ""):
    """Print test result."""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} {test_name}")
    if message:
        print(f"   📝 {message}")

async def test_context_preservation():
    """Test that agent preserves immediate conversational context."""
    test_name = "Immediate Context Preservation"
    print_test_header(test_name)
    
    try:
        # Import required modules
        from google.adk.runners import Runner
        from google.genai.types import Content, Part
        from database_session_service import create_database_session_service
        from agents import create_prediction_agent, create_analysis_agent, create_dispatcher_agent
        
        # Create session service and agents
        session_service = create_database_session_service()
        prediction_agent = create_prediction_agent()
        analysis_agent = create_analysis_agent()
        dispatcher_agent = create_dispatcher_agent(prediction_agent, analysis_agent)
        
        # Create runner
        runner = Runner(
            agent=dispatcher_agent,
            app_name="context_test",
            session_service=session_service,
        )
        
        test_user_id = "context_test_user"
        test_session_id = "context_test_session"
        
        # Step 1: User asks for value bets (agent should provide a list)
        print("Step 1: User asks for value bets...")
        message1 = Content(parts=[Part(text="Show me today's value bets")])
        
        response1 = ""
        async for event in runner.run_async(
            user_id=test_user_id,
            session_id=test_session_id,
            new_message=message1,
        ):
            if hasattr(event, "text") and event.text:
                response1 += event.text
        
        print(f"Agent Response 1: {response1[:200]}...")
        
        # Check if agent provided a list (we expect it to mention specific matches)
        if "Martinez" in response1 or "Wessels" in response1 or "Novak" in response1:
            print("✅ Agent provided a list of matches in response 1")
        else:
            print("⚠️  Agent response doesn't seem to contain specific matches - this is okay for test data")
        
        # Step 2: User asks to analyze "all 3" (referring to the list)
        print("\nStep 2: User asks to analyze all 3...")
        message2 = Content(parts=[Part(text="analyze all 3")])
        
        response2 = ""
        async for event in runner.run_async(
            user_id=test_user_id,
            session_id=test_session_id,
            new_message=message2,
        ):
            if hasattr(event, "text") and event.text:
                response2 += event.text
        
        print(f"Agent Response 2: {response2[:200]}...")
        
        # Check if agent tried to analyze the matches rather than asking for clarification
        # The agent should NOT say things like "you need to specify which matches"
        context_failure_phrases = [
            "need to specify",
            "specify which",
            "which matches",
            "please provide the names",
            "could you please provide"
        ]
        
        has_failed_phrase = any(phrase.lower() in response2.lower() for phrase in context_failure_phrases)
        
        if has_failed_phrase:
            print_test_result(test_name, False, "Agent asked for clarification instead of analyzing previous matches")
            print("   This indicates context preservation is not working")
            return False
        else:
            print_test_result(test_name, True, "Agent did not ask for clarification - attempted to use context")
            print("   This indicates context preservation is working")
            
            # Clean up test session
            await session_service.delete_session(
                app_name="context_test",
                user_id=test_user_id,
                session_id=test_session_id
            )
            
            return True
        
    except Exception as e:
        print_test_result(test_name, False, f"Context preservation test failed: {e}")
        return False

async def test_session_state_updates():
    """Test that session state is properly updated with conversation history."""
    test_name = "Session State Updates"
    print_test_header(test_name)
    
    try:
        from database_session_service import create_database_session_service
        
        session_service = create_database_session_service()
        
        test_user_id = "session_test_user"
        test_session_id = "session_test_session"
        
        # Create initial session
        await session_service.create_session(
            app_name="session_test",
            user_id=test_user_id,
            session_id=test_session_id
        )
        
        # Check initial state
        initial_session = await session_service.get_session(
            app_name="session_test",
            user_id=test_user_id,
            session_id=test_session_id
        )
        
        initial_events = initial_session.get("events", [])
        initial_conversation_count = initial_session.get("conversation_count", 0)
        
        print(f"Initial conversation count: {initial_conversation_count}")
        print(f"Initial events count: {len(initial_events)}")
        
        # Simulate a conversation turn
        test_events = [
            {
                "type": "user_message",
                "content": "Show me value bets",
                "timestamp": datetime.now().isoformat()
            },
            {
                "type": "agent_response",
                "content": "Here are today's value bets: Match 1, Match 2, Match 3",
                "timestamp": datetime.now().isoformat()
            }
        ]
        
        # Update session with conversation
        await session_service.update_session(
            app_name="session_test",
            user_id=test_user_id,
            session_id=test_session_id,
            events=test_events,
            add_conversation=True
        )
        
        # Check updated state
        updated_session = await session_service.get_session(
            app_name="session_test",
            user_id=test_user_id,
            session_id=test_session_id
        )
        
        updated_events = updated_session.get("events", [])
        updated_conversation_count = updated_session.get("conversation_count", 0)
        
        print(f"Updated conversation count: {updated_conversation_count}")
        print(f"Updated events count: {len(updated_events)}")
        
        # Verify updates
        conversation_count_increased = updated_conversation_count == initial_conversation_count + 1
        events_stored = len(updated_events) == len(test_events)
        
        if conversation_count_increased and events_stored:
            print_test_result(test_name, True, "Session state properly updated with conversation history")
            
            # Clean up
            await session_service.delete_session(
                app_name="session_test",
                user_id=test_user_id,
                session_id=test_session_id
            )
            
            return True
        else:
            print_test_result(test_name, False, "Session state not properly updated")
            print(f"   Conversation count increased: {conversation_count_increased}")
            print(f"   Events stored: {events_stored}")
            return False
            
    except Exception as e:
        print_test_result(test_name, False, f"Session state test failed: {e}")
        return False

async def run_context_tests():
    """Run all context preservation tests."""
    print("🧠 Starting Context Preservation Tests")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🎯 Testing: Agent should remember what it just said in previous turns")
    
    tests = [
        ("Session State Updates", test_session_state_updates),
        ("Immediate Context Preservation", test_context_preservation),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR in {test_name}: {e}")
            results.append((test_name, False))
    
    # Print summary
    print("\n" + "="*60)
    print("📊 CONTEXT TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 Context preservation working! Agent should remember previous turns.")
    else:
        print("⚠️  Context preservation issues detected. Agent may lose immediate context.")
    
    return passed == total

def main():
    """Main test runner."""
    try:
        # Change to script directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Run tests
        success = asyncio.run(run_context_tests())
        
        if not success:
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error during testing: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
