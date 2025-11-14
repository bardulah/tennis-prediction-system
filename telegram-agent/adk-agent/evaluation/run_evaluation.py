import asyncio
import os
import sys
import json

# Add the parent directory to the sys.path to allow for imports from the main module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from agents import (
    create_prediction_agent,
    create_analysis_agent,
    create_dispatcher_agent,
)

async def run_evaluation():
    """
    Runs the ADK agent evaluation.
    """
    print("Starting agent evaluation...")

    # Load the evaluation dataset
    eval_set_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'evalset.json'))
    
    if not os.path.exists(eval_set_path):
        print(f"Evaluation set not found at {eval_set_path}")
        return
    
    with open(eval_set_path, 'r') as f:
        eval_data = json.load(f)
    
    # Create the agent
    prediction_agent = create_prediction_agent()
    analysis_agent = create_analysis_agent()
    dispatcher_agent = create_dispatcher_agent(prediction_agent, analysis_agent)
    
    # Create an in-memory session service for evaluation
    session_service = InMemorySessionService()
    
    # Create the runner
    runner = Runner(
        agent=dispatcher_agent,
        app_name="tennis_agent_eval",
        session_service=session_service,
    )
    
    # Run evaluation
    results = []
    if isinstance(eval_data, dict) and 'test_cases' in eval_data:
        test_cases = eval_data['test_cases']
    elif isinstance(eval_data, list):
        test_cases = eval_data
    else:
        print("Invalid evaluation set format")
        return
    
    print(f"\nRunning {len(test_cases)} test cases...\n")
    
    for idx, test_case in enumerate(test_cases, 1):
        user_id = f"eval_user_{idx}"
        user_message = test_case.get('input', '')
        expected_output = test_case.get('expected_output', '')
        
        print(f"Test {idx}: {user_message}")
        
        try:
            response_text = ""
            async for event in runner.run_async(
                user_id=user_id,
                session_id=None,
                new_message=user_message,
            ):
                if hasattr(event, "text") and event.text:
                    response_text += event.text
                elif hasattr(event, "message") and event.message:
                    response_text += event.message
            
            result = {
                "test_case": idx,
                "input": user_message,
                "expected": expected_output,
                "actual": response_text.strip(),
                "passed": bool(response_text.strip()),
            }
            results.append(result)
            print(f"  Response: {response_text[:100]}...")
            print(f"  Status: {'PASSED' if result['passed'] else 'FAILED'}\n")
            
        except Exception as e:
            print(f"  Error: {e}\n")
            results.append({
                "test_case": idx,
                "input": user_message,
                "error": str(e),
                "passed": False,
            })
    
    # Print summary
    print("\n--- Evaluation Summary ---")
    passed = sum(1 for r in results if r.get('passed'))
    total = len(results)
    print(f"Passed: {passed}/{total}")
    print(f"Pass Rate: {(passed/total*100):.1f}%")
    print("--- End of Report ---\n")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
