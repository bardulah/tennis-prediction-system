#!/usr/bin/env python3
"""
Enhanced Tennis Prediction Agent Startup Script

This script starts both the database MCP server and the main agent,
providing enhanced memory capabilities and advanced query functionality.

Features:
- Database MCP server for advanced analytics (port 3005)
- Main ADK agent with persistent memory (port 3004)
- Database session service for cross-instance memory
- Enhanced query capabilities

Usage:
    python start_enhanced_agent.py
"""

import asyncio
import multiprocessing
import os
import signal
import subprocess
import sys
import time
from datetime import datetime

def print_banner():
    """Print startup banner."""
    banner = """
╔════════════════════════════════════════════════════════════════╗
║          Enhanced Tennis Prediction Agent                     ║
║                     Memory & Analytics Upgrade                 ║
╠════════════════════════════════════════════════════════════════╣
║  🔧 Database MCP Server:  http://localhost:3005               ║
║  🤖 Main Agent Server:     http://localhost:3004              ║
║  💾 Persistent Memory:     PostgreSQL Database                ║
║  📊 Advanced Analytics:    8 New Query Types                  ║
╠════════════════════════════════════════════════════════════════╣
║  New Capabilities:                                           ║
║  • Player statistics & historical performance                ║
║  • Tournament analysis & surface breakdown                   ║
║  • Head-to-head matchup analysis                             ║
║  • Recent form & performance trends                          ║
║  • Odds analysis & value opportunities                       ║
║  • Time-series performance tracking                          ║
╚════════════════════════════════════════════════════════════════╝
"""
    print(banner)

def start_database_mcp_server():
    """Start the database MCP server in a separate process."""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting Database MCP Server on port 3005...")
    
    try:
        # Import required modules
        sys.path.insert(0, os.path.dirname(__file__))
        
        # Start the database MCP server
        from database_mcp_server import main
        asyncio.run(main())
        
    except KeyboardInterrupt:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Database MCP Server stopped by user")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Error starting Database MCP Server: {e}")
        return False
    return True

def start_main_agent():
    """Start the main ADK agent."""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting Main ADK Agent on port 3004...")
    
    try:
        # Import required modules
        sys.path.insert(0, os.path.dirname(__file__))
        
        # Import and run the main agent
        import main
        main.main()
        
    except KeyboardInterrupt:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Main Agent stopped by user")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Error starting Main Agent: {e}")
        return False
    return True

def check_dependencies():
    """Check if all required dependencies are available."""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Checking dependencies...")
    
    required_files = [
        'main.py',
        'agents.py', 
        'tools.py',
        'database_mcp_server.py',
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

async def run_enhanced_agent():
    """Run the enhanced agent with both MCP server and main agent."""
    print_banner()
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed. Please fix the issues above.")
        return False
    
    # Test database connection
    if not test_database_connection():
        print("❌ Database connection failed. Please check your DATABASE_URL.")
        return False
    
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🚀 Starting Enhanced Tennis Prediction Agent...")
    
    try:
        # Start Database MCP Server in a separate task
        mcp_task = asyncio.create_task(start_database_mcp_server())
        
        # Wait a moment for MCP server to start
        await asyncio.sleep(2)
        
        # Start Main Agent in the current task
        main_task = asyncio.create_task(start_main_agent())
        
        # Wait for both tasks
        await asyncio.gather(mcp_task, main_task, return_exceptions=True)
        
    except KeyboardInterrupt:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🛑 Shutting down Enhanced Agent...")
    except Exception as e:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] ❌ Error running enhanced agent: {e}")
        return False
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 👋 Enhanced Agent stopped")
    return True

def main():
    """Main entry point."""
    try:
        # Set up signal handlers for graceful shutdown
        def signal_handler(sig, frame):
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Received shutdown signal...")
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Run the enhanced agent
        asyncio.run(run_enhanced_agent())
        
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
