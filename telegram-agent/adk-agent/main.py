import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes
import uvicorn

from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.genai.types import Content, Part

from agents import (
    create_prediction_agent,
    create_analysis_agent,
    create_dispatcher_agent,
)

# Load environment variables
load_dotenv()

# --- Configuration ---
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
PORT = int(os.getenv("PORT", "3004"))
DATABASE_URL = os.getenv("DATABASE_URL")

if not all([TELEGRAM_BOT_TOKEN, GOOGLE_API_KEY, WEBHOOK_URL]):
    raise ValueError("TELEGRAM_BOT_TOKEN, GOOGLE_API_KEY, and WEBHOOK_URL must be set in the .env file")

WEBHOOK_PATH = "/webhook"

# --- ADK Agent and Runner Initialization ---
# Create specialized agents
prediction_agent = create_prediction_agent()
analysis_agent = create_analysis_agent()

# Create the dispatcher agent
dispatcher_agent = create_dispatcher_agent(prediction_agent, analysis_agent)

# Use InMemorySessionService for now to test basic functionality
from google.adk.sessions import InMemorySessionService
session_service = InMemorySessionService()
print("Using InMemorySessionService for testing")

# Create the Runner for executing the agent
runner = Runner(
    agent=dispatcher_agent,
    app_name="agents",  # Must match the module where the agent is defined
    session_service=session_service,
)

# --- Telegram Bot and FastAPI App Initialization ---
application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
app = FastAPI()

# Store runner for async access
global_runner = runner

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming Telegram messages with persistent conversational context."""
    user_id = str(update.effective_user.id)
    user_message_text = update.message.text

    if not user_message_text:
        return

    print(f"[{user_id}] User: {user_message_text}")

    try:
        session_id = user_id  # Use user ID as session ID
        
        # Get current session with conversation history
        session_data = await session_service.get_session(
            app_name="agents",
            user_id=user_id,
            session_id=session_id
        )
        
        # Initialize conversation history if session is new
        conversation_history = []
        if session_data:
            conversation_history = session_data.get("events", [])
        else:
            # Create new session if it doesn't exist
            await session_service.create_session(
                app_name="agents",
                user_id=user_id,
                session_id=session_id
            )
        
        # Create the new message
        message = Content(parts=[Part(text=user_message_text)])
        
        # Run the agent using the Runner
        response_text = ""
        async for event in global_runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=message,
        ):
            # Collect text from events
            if hasattr(event, "text") and event.text:
                response_text += event.text
            # Also check for content parts which may contain text
            if hasattr(event, "content") and event.content:
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        response_text += part.text

        final_response = response_text.strip() or "I couldn't generate a response."
        
        # Update session with the complete conversation turn
        new_events = conversation_history + [
            {
                "type": "user_message",
                "content": user_message_text,
                "timestamp": datetime.now().isoformat()
            },
            {
                "type": "agent_response", 
                "content": final_response,
                "timestamp": datetime.now().isoformat()
            }
        ]
        
        # Update the session with conversation history and increment conversation count
        await session_service.update_session(
            app_name="agents",
            user_id=user_id,
            session_id=session_id,
            events=new_events,
            add_conversation=True
        )
        
        print(f"[{user_id}] Agent: {final_response}")
        await update.message.reply_text(final_response, parse_mode="Markdown")

    except Exception as e:
        print(f"Error processing message: {e}")
        await update.message.reply_text(f"Sorry, I encountered an error: {e}")

@app.post(WEBHOOK_PATH)
async def telegram_webhook(request: Request):
    """Handle Telegram webhook updates."""
    update_data = await request.json()
    
    # Initialize the application if not already done
    if not hasattr(application, '_initialized') or not application._initialized:
        await application.initialize()
        application._initialized = True
    
    update = Update.de_json(update_data, application.bot)
    await application.process_update(update)
    return Response(status_code=200)

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    """Set Telegram webhook on startup."""
    print("Starting Tennis Prediction Agent...")
    print("Setting webhook...")
    await application.bot.set_webhook(url=f"{WEBHOOK_URL}{WEBHOOK_PATH}")
    print(f"Webhook set to {WEBHOOK_URL}{WEBHOOK_PATH}")
    print("Agent is ready to receive messages!")

@app.on_event("shutdown")
async def shutdown_event():
    """Delete Telegram webhook on shutdown."""
    print("Deleting webhook...")
    await application.bot.delete_webhook()
    print("Webhook deleted.")

def main():
    """Start the application."""
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    uvicorn.run(app, host="0.0.0.0", port=PORT)

if __name__ == "__main__":
    main()
