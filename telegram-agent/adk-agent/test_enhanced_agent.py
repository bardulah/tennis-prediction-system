#!/usr/bin/env python3
"""
Test script for Enhanced Tennis Prediction Agent

This script validates the new database MCP server and persistent memory functionality.

Usage:
    python test_enhanced_agent.py
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
    print(f"🧪 TEST: {test_name}")
    print(f"⏰ {datetime.now().strftime('%H:%M:%S')}")
    print('='*60)

def print_test_result(test_name: str, success: bool, message: str = ""):
    """Print test result."""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} {test_name}")
    if message:
        print(f"   📝 {message}")

async def test_database_connection():
    """Test database connection."""
    test_name = "Database Connection"
    print_test_header(test_name)
    
    try:
        import psycopg2
        from dotenv import load_dotenv
        
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            print_test_result(test_name, False, "DATABASE_URL not found in environment")
            return False
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Test basic query
        cur.execute("SELECT COUNT(*) FROM predictions LIMIT 1")
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        print_test_result(test_name, True, f"Connected successfully, found {result[0]} predictions")
        return True
        
    except Exception as e:
        print_test_result(test_name, False, f"Connection failed: {e}")
        return False

async def test_database_session_service():
    """Test database session service initialization."""
    test_name = "Database Session Service"
    print_test_header(test_name)
    
    try:
        from database_session_service import create_database_session_service
        
        session_service = create_database_session_service()
        
        # Test session creation
        test_user_id = "test_user"
        test_session_id = "test_session_123"
        test_app_name = "tennis_agent_test"
        
        await session_service.create_session(
            app_name=test_app_name,
            user_id=test_user_id,
            session_id=test_session_id,
            initial_state={"test": "data"},
            metadata={"test_metadata": "value"}
        )
        
        # Test session retrieval
        session_data = await session_service.get_session(
            app_name=test_app_name,
            user_id=test_user_id,
            session_id=test_session_id
        )
        
        if session_data and session_data.get("state", {}).get("test") == "data":
            print_test_result(test_name, True, "Session creation and retrieval successful")
            
            # Clean up test session
            await session_service.delete_session(
                app_name=test_app_name,
                user_id=test_user_id,
                session_id=test_session_id
            )
            
            return True
        else:
            print_test_result(test_name, False, "Session data mismatch")
            return False
            
    except Exception as e:
        print_test_result(test_name, False, f"Session service test failed: {e}")
        return False

async def test_mcp_server_tools():
    """Test database MCP server tools."""
    test_name = "Database MCP Server Tools"
    print_test_header(test_name)
    
    try:
        # Test MCP server tool definitions
        from database_mcp_server import server
        
        # Get available tools
        tools_result = await server.list_tools()
        
        if not tools_result or not hasattr(tools_result, 'tools'):
            print_test_result(test_name, False, "No tools returned from MCP server")
            return False
        
        expected_tools = [
            "get_player_stats",
            "get_head_to_head", 
            "get_form_analysis",
            "get_surface_analysis",
            "get_tournament_analysis",
            "get_odds_analysis",
            "get_value_opportunities",
            "get_performance_trends"
        ]
        
        available_tools = [tool.name for tool in tools_result.tools]
        missing_tools = [tool for tool in expected_tools if tool not in available_tools]
        
        if missing_tools:
            print_test_result(test_name, False, f"Missing tools: {', '.join(missing_tools)}")
            return False
        else:
            print_test_result(test_name, True, f"All {len(expected_tools)} expected tools available")
            return True
            
    except Exception as e:
        print_test_result(test_name, False, f"MCP server test failed: {e}")
        return False

async def test_enhanced_agent_creation():
    """Test enhanced agent creation with new tools."""
    test_name = "Enhanced Agent Creation"
    print_test_header(test_name)
    
    try:
        from agents import create_prediction_agent, create_analysis_agent, create_dispatcher_agent
        
        # Create enhanced agents
        prediction_agent = create_prediction_agent()
        analysis_agent = create_analysis_agent()
        dispatcher_agent = create_dispatcher_agent(prediction_agent, analysis_agent)
        
        # Check that agents have the expected number of tools
        # Prediction agent should have 3 tools: get_predictions, get_value_bets, query_database
        if len(prediction_agent.tools) < 3:
            print_test_result(test_name, False, f"Prediction agent has only {len(prediction_agent.tools)} tools, expected at least 3")
            return False
        
        # Analysis agent should have 1 tool: analyze_matchup
        if len(analysis_agent.tools) != 1:
            print_test_result(test_name, False, f"Analysis agent has {len(analysis_agent.tools)} tools, expected 1")
            return False
        
        # Dispatcher agent should have 2 sub-agents
        if len(dispatcher_agent.sub_agents) != 2:
            print_test_result(test_name, False, f"Dispatcher agent has {len(dispatcher_agent.sub_agents)} sub-agents, expected 2")
            return False
        
        print_test_result(test_name, True, f"Agent creation successful - Prediction: {len(prediction_agent.tools)} tools, Analysis: {len(analysis_agent.tools)} tool, Dispatcher: {len(dispatcher_agent.sub_agents)} sub-agents")
        return True
        
    except Exception as e:
        print_test_result(test_name, False, f"Agent creation test failed: {e}")
        return False

async def test_environment_variables():
    """Test required environment variables."""
    test_name = "Environment Variables"
    print_test_header(test_name)
    
    required_vars = [
        "DATABASE_URL",
        "GOOGLE_API_KEY", 
        "TELEGRAM_BOT_TOKEN"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print_test_result(test_name, False, f"Missing variables: {', '.join(missing_vars)}")
        return False
    else:
        print_test_result(test_name, True, "All required environment variables present")
        return True

async def test_main_agent_imports():
    """Test that main agent can be imported with new dependencies."""
    test_name = "Main Agent Imports"
    print_test_header(test_name)
    
    try:
        # Test imports
        from database_session_service import create_database_session_service
        from agents import create_prediction_agent, create_analysis_agent, create_dispatcher_agent
        
        # Test creating session service
        session_service = create_database_session_service()
        if not session_service:
            raise Exception("Failed to create session service")
        
        # Test creating agents
        prediction_agent = create_prediction_agent()
        analysis_agent = create_analysis_agent()
        dispatcher_agent = create_dispatcher_agent(prediction_agent, analysis_agent)
        
        print_test_result(test_name, True, "All imports and object creation successful")
        return True
        
    except Exception as e:
        print_test_result(test_name, False, f"Import test failed: {e}")
        return False

async def run_all_tests():
    """Run all tests."""
    print("🚀 Starting Enhanced Tennis Prediction Agent Tests")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Environment Variables", test_environment_variables),
        ("Database Connection", test_database_connection),
        ("Database Session Service", test_database_session_service),
        ("MCP Server Tools", test_mcp_server_tools),
        ("Main Agent Imports", test_main_agent_imports),
        ("Enhanced Agent Creation", test_enhanced_agent_creation),
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
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! Enhanced agent is ready to run.")
        return True
    else:
        print("⚠️  Some tests failed. Please fix issues before running the enhanced agent.")
        return False

def main():
    """Main test runner."""
    try:
        # Change to script directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Run tests
        success = asyncio.run(run_all_tests())
        
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
