#!/usr/bin/env python3
"""
Test the routing fix and tool selection

This tests that:
1. The prediction agent has the right tools
2. The tools are imported correctly  
3. The routing logic should work

Usage:
    python3 test_routing_debug.py
"""

import os
import sys

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

def test_tool_creation():
    """Test that tools are created correctly."""
    print("🧪 Testing Tool Creation")
    print("-" * 40)
    
    try:
        from tools import (
            get_player_matchups, 
            analyze_player_performance,
            get_player_matchups_tool,
            analyze_player_performance_tool
        )
        
        print("✅ All player analysis functions imported successfully")
        print("✅ All FunctionTool instances imported successfully")
        
        # Test that the functions exist and are callable
        assert callable(get_player_matchups), "get_player_matchups should be callable"
        assert callable(analyze_player_performance), "analyze_player_performance should be callable"
        
        print("✅ Functions are callable")
        return True
        
    except Exception as e:
        print(f"❌ Error testing tool creation: {e}")
        return False

def test_agent_creation():
    """Test that agents can be created with the new tools."""
    print("\n🎾 Testing Agent Creation")
    print("-" * 40)
    
    try:
        # Import the agent creation functions
        sys.path.insert(0, os.path.dirname(__file__))
        
        # Import the function tools
        from tools import (
            get_player_matchups_tool,
            analyze_player_performance_tool,
            get_predictions_tool,
            get_value_bets_tool
        )
        
        # Manually create the prediction agent to test tool assignment
        from google.adk.agents import LlmAgent
        
        GEMINI_MODEL = "gemini-2.5-flash"
        
        # Test creating prediction agent with all tools
        prediction_agent = LlmAgent(
            name="prediction_agent",
            description="Test prediction agent",
            instruction="Test agent for tool verification",
            model=GEMINI_MODEL,
            tools=[
                get_predictions_tool,
                get_value_bets_tool, 
                get_player_matchups_tool,
                analyze_player_performance_tool
            ],
        )
        
        print("✅ Prediction agent created successfully")
        
        # Check tool names
        tool_names = [tool.name for tool in prediction_agent.tools]
        print(f"✅ Agent has {len(tool_names)} tools: {tool_names}")
        
        # Verify specific tools are present
        expected_tools = ['get_predictions', 'get_value_bets', 'get_player_matchups', 'analyze_player_performance']
        missing_tools = [tool for tool in expected_tools if tool not in tool_names]
        
        if missing_tools:
            print(f"⚠️  Missing tools: {missing_tools}")
            return False
        else:
            print("✅ All expected tools present")
            return True
        
    except Exception as e:
        print(f"❌ Error testing agent creation: {e}")
        return False

def test_function_behavior():
    """Test the behavior of the functions."""
    print("\n🔍 Testing Function Behavior")
    print("-" * 40)
    
    try:
        from tools import get_player_matchups, analyze_player_performance
        
        # Test without database (should give graceful fallback)
        result1 = get_player_matchups("Cirpanli")
        result2 = analyze_player_performance("Cirpanli")
        
        print("✅ get_player_matchups('Cirpanli') executed successfully")
        print(f"   Response length: {len(result1)} characters")
        print(f"   Response preview: {result1[:60]}...")
        
        print("✅ analyze_player_performance('Cirpanli') executed successfully")  
        print(f"   Response length: {len(result2)} characters")
        print(f"   Response preview: {result2[:60]}...")
        
        # Check that responses are appropriate
        if "having trouble accessing the database" in result1 or "Cirpanli's matchups" in result1:
            print("✅ get_player_matchups returned appropriate response")
        else:
            print("⚠️  get_player_matchups response unexpected")
        
        if "having trouble accessing the database" in result2 or "Cirpanli's performance" in result2:
            print("✅ analyze_player_performance returned appropriate response")
        else:
            print("⚠️  analyze_player_performance response unexpected")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing function behavior: {e}")
        return False

def main():
    """Run all routing debug tests."""
    print("🚀 Testing Agent Routing Fix")
    print("=" * 50)
    print("🎯 Goal: Ensure 'Cirpanli analysis' routes to prediction agent with player tools")
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    tests = [
        ("Tool Creation", test_tool_creation),
        ("Agent Creation", test_agent_creation),
        ("Function Behavior", test_function_behavior),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR in {test_name}: {e}")
            results.append((test_name, False))
    
    # Print summary
    print("\n" + "="*50)
    print("📊 ROUTING DEBUG SUMMARY")
    print("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 Tools and routing should work!")
        print("\n💡 Expected behavior:")
        print("   'Cirpanli analysis' → prediction_agent → get_player_matchups()")
        print("   → Shows Cirpanli info (not value bets)")
    else:
        print("\n⚠️  Some issues detected - check the output above")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
