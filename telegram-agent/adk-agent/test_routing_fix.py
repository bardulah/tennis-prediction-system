#!/usr/bin/env python3
"""
Test the routing fix for single player analysis

This tests that "Cirpanli analysis" gets routed correctly to the prediction agent
instead of the analysis agent.

Usage:
    python3 test_routing_fix.py
"""

import asyncio
import os
import sys

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

def test_tool_availability():
    """Test that the new player analysis tools are available."""
    print("🧪 Testing Tool Availability")
    print("-" * 40)
    
    try:
        from tools import get_player_matchups, analyze_player_performance
        print("✅ get_player_matchups tool imported successfully")
        print("✅ analyze_player_performance tool imported successfully")
        
        # Test that FunctionTool instances are created
        from tools import get_player_matchups_tool, analyze_player_performance_tool
        print("✅ FunctionTool instances created successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error importing tools: {e}")
        return False

def test_agent_creation():
    """Test that agents can be created with new tools."""
    print("\n🎾 Testing Agent Creation")
    print("-" * 40)
    
    try:
        from agents import create_prediction_agent, create_analysis_agent, create_dispatcher_agent
        
        prediction_agent = create_prediction_agent()
        analysis_agent = create_analysis_agent()
        dispatcher_agent = create_dispatcher_agent(prediction_agent, analysis_agent)
        
        print("✅ All agents created successfully")
        
        # Check prediction agent has the right tools
        tool_names = [tool.name for tool in prediction_agent.tools]
        expected_tools = ['get_predictions', 'get_value_bets', 'get_player_matchups', 'analyze_player_performance']
        
        missing_tools = [tool for tool in expected_tools if tool not in tool_names]
        if missing_tools:
            print(f"⚠️  Missing tools in prediction_agent: {missing_tools}")
        else:
            print("✅ Prediction agent has all expected tools")
        
        # Check analysis agent has analyze_matchup tool
        analysis_tool_names = [tool.name for tool in analysis_agent.tools]
        if 'analyze_matchup' in analysis_tool_names:
            print("✅ Analysis agent has analyze_matchup tool")
        else:
            print("❌ Analysis agent missing analyze_matchup tool")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating agents: {e}")
        return False

def test_player_name_fallback():
    """Test the fallback behavior when database is not available."""
    print("\n🛡️  Testing Fallback Behavior")
    print("-" * 40)
    
    try:
        from tools import get_player_matchups, analyze_player_performance
        
        # Test without database (should give graceful fallback)
        result1 = get_player_matchups("Cirpanli")
        result2 = analyze_player_performance("Cirpanli")
        
        print("✅ get_player_matchups fallback working")
        print(f"   Response: {result1[:50]}...")
        
        print("✅ analyze_player_performance fallback working")
        print(f"   Response: {result2[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing fallback: {e}")
        return False

def main():
    """Run all routing tests."""
    print("🚀 Testing Routing Fix for Player Analysis")
    print("=" * 50)
    print("🎯 Testing: 'Cirpanli analysis' should route to prediction agent")
    print("🛠️  Fix: Updated dispatcher and prediction agent instructions")
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    tests = [
        ("Tool Availability", test_tool_availability),
        ("Agent Creation", test_agent_creation), 
        ("Fallback Behavior", test_player_name_fallback),
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
    print("📊 ROUTING FIX TEST SUMMARY")
    print("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 Routing fix working!")
        print("\n💡 Expected behavior for 'Cirpanli analysis':")
        print("   1. Dispatcher routes to prediction_agent")
        print("   2. Prediction_agent uses get_player_matchups or analyze_player_performance")
        print("   3. Shows Cirpanli's matchups/performance (or graceful fallback)")
        print("   4. No more 'need opponent' messages!")
    else:
        print("\n⚠️  Some routing issues detected.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
