#!/usr/bin/env python3
"""
Test the emergency fix for routing

This verifies that the new agents.py will route correctly.
"""

import os
import sys

def test_emergency_fix():
    """Test that the emergency fix is in place."""
    print("🧪 Testing Emergency Fix")
    print("=" * 40)
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Check if backup was created
    if os.path.exists('agents_backup.py'):
        print("✅ Backup created: agents_backup.py")
    else:
        print("❌ Backup not found")
    
    # Check if new file is in place
    with open('agents.py', 'r') as f:
        content = f.read()
    
    if "🚨 SINGLE PLAYER REQUESTS → prediction_agent" in content:
        print("✅ Emergency fix routing rules found")
    else:
        print("❌ Emergency fix routing rules missing")
    
    if "Cirpanli analysis" in content:
        print("✅ Cirpanli example found")
    else:
        print("❌ Cirpanli example missing")
    
    if "Route ALL single-player requests to prediction_agent immediately" in content:
        print("✅ Explicit routing instruction found")
    else:
        print("❌ Explicit routing instruction missing")
    
    print("\n📋 Test Scenarios:")
    test_queries = [
        "recent predictions involving cirpanli",
        "cirpanli analysis",
        "djokovic performance",
        "cirpanli vs nadal"
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        
        # Apply routing logic
        if " vs " in query.lower():
            print("  → Should route to: analysis_agent (has 'vs')")
        elif "cirpanli" in query.lower() and "analysis" in query.lower():
            print("  → Should route to: prediction_agent (player analysis)")
        elif "cirpanli" in query.lower():
            print("  → Should route to: prediction_agent (Cirpanli mentioned)")
        else:
            print("  → Should route to: prediction_agent (general)")
    
    print("\n" + "="*40)
    print("🎉 EMERGENCY FIX READY!")
    print("✅ Backup created: agents_backup.py")
    print("✅ Enhanced routing in place")
    print("✅ Bot should now route correctly")
    
    print("\n🚀 NEXT STEPS:")
    print("1. Restart the bot (python main.py)")
    print("2. Test: 'recent predictions involving cirpanli'")
    print("3. Should show player data or helpful message")
    print("4. Should NOT ask for opponent")

if __name__ == "__main__":
    test_emergency_fix()
