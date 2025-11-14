#!/usr/bin/env python3
"""
Check if the bot is using the old or new code

This helps verify if the fix has taken effect.
"""

import os
import sys

def check_bot_version():
    """Check which version of agents.py is being used."""
    print("🔍 Checking Bot Code Version")
    print("=" * 40)
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with open('agents.py', 'r') as f:
        content = f.read()
    
    # Check for new simplified version
    if 'create_prediction_agent() -> LlmAgent:' in content and 'name="tennis_agent"' in content:
        print("✅ Using NEW simplified version")
        print("🎯 Should work correctly now")
        
        # Show key parts
        if 'You handle ALL tennis-related queries' in content:
            print("✅ Comprehensive agent instructions found")
        
        if 'recent predictions involving cirpanli" → use get_predictions' in content:
            print("✅ Cirpanli routing example found")
            
        print("\n💡 If still getting wrong response:")
        print("   1. Restart bot completely")
        print("   2. Clear any Python caches")
        print("   3. Check if running from different directory")
        
    elif 'create_dispatcher_agent' in content and 'tennis_dispatcher' in content:
        print("❌ Using OLD complex routing version")
        print("🔄 This version has routing issues")
        print("\n💡 SOLUTION:")
        print("   Replace agents.py with agents_SIMPLE_FIX.py")
        
    else:
        print("❓ Unknown version")
        print("📋 Current agent structure found")
        
    # Show agent names
    import re
    agents = re.findall(r'name="([^"]+)"', content)
    if agents:
        print(f"\n📊 Agent names found: {agents}")
    
    print("\n" + "="*40)
    print("🎯 EXPECTED RESULT AFTER FIX:")
    print("   'recent predictions involving cirpanli'")
    print("   → Uses: get_predictions tool")
    print("   → Shows: Cirpanli data OR helpful message")
    print("   → Does NOT ask: 'Who is Cirpanli's opponent?'")

if __name__ == "__main__":
    check_bot_version()
