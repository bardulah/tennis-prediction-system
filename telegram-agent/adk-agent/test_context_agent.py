#!/usr/bin/env python3
"""
Test Context Preservation - Simplified Agent Startup

This script starts just the main agent with enhanced context preservation
for testing the immediate conversational memory fix.

Usage:
    python test_context_agent.py
"""

import asyncio
import os
import sys
from datetime import datetime

def print_banner():
    """Print startup banner."""
    banner = """
╔════════════════════════════════════════════════════════════════╗
║          Context Preservation Test Agent                      ║
║                     (Simplified Version)                      ║
╠════════════════════════════════════════════════════════════════╣
║  🎯 Testing: Immediate conversational context retention       ║
║  💾 Persistent Memory: PostgreSQL Database                    ║
║  🔧 Enhanced Context: Session state updates per turn          ║
╚════════════════════════════════════════════════════════════════╝

Test Scenario:
1. Ask bot for "value bets" 
2. Then say "analyze all 3"
3. Bot should remember the 3 matches it listed, not ask for clarification

Start your Telegram conversation to test context preservation!
"""
    print(banner)

def check_dependencies():
    """Check if all required dependencies are available."""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Checking dependencies...")
    
    required_files = [
        'main.py',
        'agents.py', 
        'tools.py',
        'database_session_service.py'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {', '.join(missing_files)}")
        return False
    
    # Check environment variables
    required_env_vars = ['DATABASE_URL', 'GOOGLE_API_KEY', 'TELEGRAM_BOT_TOKEN']
    missing_env_vars = []
    
    for var in required_env_vars:
        if not os.getenv(var):
            missing_env_vars.append(var)
    
    if missing_env_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_env_vars)}")
        return False
    
    print("✅ All dependencies satisfied")
    return True

def test_database_connection():
    """Test database connection."""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Testing database connection...")
    
    try:
        import psycopg2
        from dotenv import load_dotenv
        
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
        database_url = os.getenv("DATABASE_URL")
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Test basic query
        cur.execute("SELECT COUNT(*) FROM predictions LIMIT 1")
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        print(f"✅ Database connection successful (found {result[0]} predictions)")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

async def run_context_test_agent():
    """Run the context test agent."""
    print_banner()
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed. Please fix the issues above.")
        return False
    
    # Test database connection
    if not test_database_connection():
        print("❌ Database connection failed. Please check your DATABASE_URL.")
        return False
    
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🚀 Starting Context Test Agent...")
    print("💡 Remember to test with: 'value bets' → 'analyze all 3'")
    
    try:
        # Import and run the main agent
        import main
        main.main()
        
    except KeyboardInterrupt:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🛑 Context Test Agent stopped by user")
    except Exception as e:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] ❌ Error running context test agent: {e}")
        return False
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 👋 Context Test Agent stopped")
    return True

def main():
    """Main entry point."""
    try:
        # Set up signal handlers for graceful shutdown
        def signal_handler(sig, frame):
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Received shutdown signal...")
            sys.exit(0)
        
        import signal
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Run the context test agent
        asyncio.run(run_context_test_agent())
        
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
