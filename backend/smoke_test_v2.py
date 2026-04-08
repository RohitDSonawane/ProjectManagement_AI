import sys
import os

# Add the current directory to path so we can import services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.llm_service import llm_service
from models.card import CaseStudyCard

def test_prototype(query: str):
    print(f"\n{'='*60}")
    print(f"PROTOTYPE TEST: {query}")
    print(f"{'='*60}")
    
    try:
        # Note: This will actually call the real LLM if API keys are set.
        # If not, it will fail, which is good for verifying env setup.
        card = llm_service.process_query(query)
        
        print("\n--- GENERATED CASE STUDY CARD ---")
        print(f"CONCEPT: {card.concept}")
        print(f"STORY  : {card.story}")
        print(f"PROBLEM: {card.problem}")
        print(f"DECISION: {card.decision_point}")
        print(f"LESSONS : {', '.join(card.key_lessons)}")
        print(f"FOLLOWUP: {card.think_about_this}")
        
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")

if __name__ == "__main__":
    # If API keys aren't set, this will fail gracefully or show OpenRouter errors
    test_prototype("Tell me how EVM works with a real company example")
